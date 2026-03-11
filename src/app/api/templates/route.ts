import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1 } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET /api/templates - テンプレート一覧
export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = await getD1();
  const q = request.nextUrl.searchParams.get("q") || "";
  const sort = request.nextUrl.searchParams.get("sort") || "updated_at";
  const order = request.nextUrl.searchParams.get("order") || "desc";

  const validSorts = ["updated_at", "created_at", "name"];
  const sortCol = validSorts.includes(sort) ? sort : "updated_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";

  let result;
  if (q) {
    result = await db
      .prepare(
        `SELECT * FROM templates WHERE user_id = ? AND name LIKE ? ORDER BY ${sortCol} ${sortOrder}`
      )
      .bind(session.user.id, `%${q}%`)
      .all();
  } else {
    result = await db
      .prepare(
        `SELECT * FROM templates WHERE user_id = ? ORDER BY ${sortCol} ${sortOrder}`
      )
      .bind(session.user.id)
      .all();
  }

  return NextResponse.json({ templates: result.results });
}

// POST /api/templates - テンプレート作成
export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json() as {
    name?: string;
    paperWidthMm?: number;
    paperHeightMm?: number;
    paperPreset?: string;
  };
  const { name, paperWidthMm, paperHeightMm, paperPreset } = body;

  if (!name || !paperWidthMm || !paperHeightMm) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const db = await getD1();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO templates (id, user_id, name, paper_width_mm, paper_height_mm, paper_preset, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, session.user.id, name, paperWidthMm, paperHeightMm, paperPreset || null, now, now)
    .run();

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ template }, { status: 201 });
}
