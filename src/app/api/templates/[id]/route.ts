import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1 } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/templates/:id - テンプレート詳細
export async function GET(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first();

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  const fields = await db
    .prepare("SELECT * FROM text_fields WHERE template_id = ? ORDER BY sort_order ASC")
    .bind(id)
    .all();

  return NextResponse.json({ template, textFields: fields.results });
}

// PUT /api/templates/:id - テンプレート更新
export async function PUT(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  const existing = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first();

  if (!existing) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  const body = await request.json() as {
    name?: string;
    paperWidthMm?: number;
    paperHeightMm?: number;
    paperPreset?: string;
    printSettingsNote?: string;
  };
  const { name, paperWidthMm, paperHeightMm, paperPreset, printSettingsNote } = body;
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE templates SET
        name = COALESCE(?, name),
        paper_width_mm = COALESCE(?, paper_width_mm),
        paper_height_mm = COALESCE(?, paper_height_mm),
        paper_preset = COALESCE(?, paper_preset),
        print_settings_note = COALESCE(?, print_settings_note),
        updated_at = ?
      WHERE id = ?`
    )
    .bind(
      name ?? null,
      paperWidthMm ?? null,
      paperHeightMm ?? null,
      paperPreset ?? null,
      printSettingsNote ?? null,
      now,
      id
    )
    .run();

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ template });
}

// DELETE /api/templates/:id - テンプレート削除
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  const existing = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first();

  if (!existing) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  // text_fields は ON DELETE CASCADE で自動削除
  await db.prepare("DELETE FROM templates WHERE id = ?").bind(id).run();

  return NextResponse.json({ success: true });
}
