import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1, getR2 } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

type Params = { params: Promise<{ id: string }> };

// POST /api/templates/:id/duplicate - テンプレート複製
export async function POST(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const original = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first<Record<string, any>>();

  if (!original) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  let body: { name?: string } = {};
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    // bodyが空の場合は無視
  }
  const newId = uuidv4();
  const now = new Date().toISOString();
  const newName = body.name || `${original.name} (コピー)`;

  // テンプレートを複製
  let newScanPdfKey: string | null = null;
  if (original.scan_pdf_key) {
    // R2のPDFもコピー
    const r2 = await getR2();
    const srcObject = await r2.get(original.scan_pdf_key as string);
    if (srcObject) {
      newScanPdfKey = `scan-pdfs/${session.user.id}/${newId}.pdf`;
      const buf = await srcObject.arrayBuffer();
      await r2.put(newScanPdfKey, buf, {
        httpMetadata: { contentType: "application/pdf" },
      });
    }
  }

  await db
    .prepare(
      `INSERT INTO templates (id, user_id, name, paper_width_mm, paper_height_mm, paper_preset, scan_pdf_key, print_settings_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newId,
      session.user.id,
      newName,
      original.paper_width_mm,
      original.paper_height_mm,
      original.paper_preset,
      newScanPdfKey,
      original.print_settings_note,
      now,
      now
    )
    .run();

  // テキストフィールドも複製
  const fields = await db
    .prepare("SELECT * FROM text_fields WHERE template_id = ?")
    .bind(id)
    .all<Record<string, any>>();

  if (fields.results.length > 0) {
    const stmts = fields.results.map((f) =>
      db
        .prepare(
          `INSERT INTO text_fields (id, template_id, label, content, position_x_mm, position_y_mm, width_mm, font_size, font_family, direction, color, field_rotation, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          uuidv4(),
          newId,
          f.label,
          f.content,
          f.position_x_mm,
          f.position_y_mm,
          f.width_mm,
          f.font_size,
          f.font_family,
          f.direction,
          f.color || "#000000",
          f.field_rotation || 0,
          f.sort_order,
          now,
          now
        )
    );
    await db.batch(stmts);
  }

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ?")
    .bind(newId)
    .first();

  return NextResponse.json({ template }, { status: 201 });
}
