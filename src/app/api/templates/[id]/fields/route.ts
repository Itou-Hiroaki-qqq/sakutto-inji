import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1 } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

type Params = { params: Promise<{ id: string }> };

// PUT /api/templates/:id/fields - テキストフィールド一括更新
export async function PUT(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  // テンプレートの所有確認
  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first();

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  const body = await request.json();
  const { fields } = body as {
    fields: Array<{
      id?: string;
      label?: string;
      content: string;
      positionXMm: number;
      positionYMm: number;
      widthMm?: number;
      fontSize: number;
      fontFamily: string;
      direction: string;
      color?: string;
      fieldRotation?: number;
      sortOrder: number;
    }>;
  };

  const now = new Date().toISOString();

  // 既存フィールドを全削除して再作成（一括更新のシンプルな実装）
  await db.prepare("DELETE FROM text_fields WHERE template_id = ?").bind(id).run();

  const statements = fields.map((field) => {
    const fieldId = field.id || uuidv4();
    return db
      .prepare(
        `INSERT INTO text_fields (id, template_id, label, content, position_x_mm, position_y_mm, width_mm, font_size, font_family, direction, color, field_rotation, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        fieldId,
        id,
        field.label || null,
        field.content,
        field.positionXMm,
        field.positionYMm,
        field.widthMm || null,
        field.fontSize,
        field.fontFamily,
        field.direction,
        field.color || "#000000",
        field.fieldRotation || 0,
        field.sortOrder,
        now,
        now
      );
  });

  if (statements.length > 0) {
    await db.batch(statements);
  }

  // テンプレートの updated_at も更新
  await db
    .prepare("UPDATE templates SET updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();

  const result = await db
    .prepare("SELECT * FROM text_fields WHERE template_id = ? ORDER BY sort_order ASC")
    .bind(id)
    .all();

  return NextResponse.json({ fields: result.results });
}
