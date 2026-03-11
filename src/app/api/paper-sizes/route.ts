import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1 } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET /api/paper-sizes - カスタム用紙サイズ一覧
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = await getD1();
  const result = await db
    .prepare(
      "SELECT * FROM custom_paper_sizes WHERE user_id = ? ORDER BY created_at ASC"
    )
    .bind(session.user.id)
    .all();

  return NextResponse.json({ paperSizes: result.results });
}

// POST /api/paper-sizes - カスタム用紙サイズ保存
export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = (await request.json()) as {
    name: string;
    widthMm: number;
    heightMm: number;
  };

  if (!body.name || !body.widthMm || !body.heightMm) {
    return NextResponse.json(
      { error: "名前、幅、高さは必須です" },
      { status: 400 }
    );
  }

  const db = await getD1();
  const id = uuidv4();

  await db
    .prepare(
      `INSERT INTO custom_paper_sizes (id, user_id, name, width_mm, height_mm)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, session.user.id, body.name, body.widthMm, body.heightMm)
    .run();

  const paperSize = await db
    .prepare("SELECT * FROM custom_paper_sizes WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ paperSize }, { status: 201 });
}
