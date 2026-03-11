import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1, getR2 } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// POST /api/templates/import - テンプレートインポート
export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  let data: Record<string, unknown>;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "無効なJSONファイルです" }, { status: 400 });
  }

  // バリデーション
  const tpl = data.template as Record<string, unknown> | undefined;
  if (!tpl || !tpl.name || !tpl.paperWidthMm || !tpl.paperHeightMm) {
    return NextResponse.json({ error: "テンプレートデータが不正です" }, { status: 400 });
  }

  const db = await getD1();
  const templateId = uuidv4();
  const now = new Date().toISOString();

  // テンプレート作成
  await db
    .prepare(
      `INSERT INTO templates (id, user_id, name, paper_width_mm, paper_height_mm, paper_preset, print_settings_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      templateId,
      session.user.id,
      tpl.name as string,
      tpl.paperWidthMm as number,
      tpl.paperHeightMm as number,
      (tpl.paperPreset as string) || null,
      (tpl.printSettingsNote as string) || null,
      now,
      now
    )
    .run();

  // テキストフィールド作成
  const fields = data.textFields as Array<Record<string, unknown>> | undefined;
  if (fields && fields.length > 0) {
    const stmts = fields.map((f) =>
      db
        .prepare(
          `INSERT INTO text_fields (id, template_id, label, content, position_x_mm, position_y_mm, width_mm, font_size, font_family, direction, color, field_rotation, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          uuidv4(),
          templateId,
          (f.label as string) || null,
          (f.content as string) || "",
          f.positionXMm as number,
          f.positionYMm as number,
          (f.widthMm as number) || null,
          (f.fontSize as number) || 12,
          (f.fontFamily as string) || "noto-sans-jp",
          (f.direction as string) || "horizontal",
          (f.color as string) || "#000000",
          (f.fieldRotation as number) || 0,
          (f.sortOrder as number) || 0,
          now,
          now
        )
    );
    await db.batch(stmts);
  }

  // スキャンPDFの復元
  if (data.scanPdf) {
    try {
      const base64 = data.scanPdf as string;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const r2 = await getR2();
      const key = `scan-pdfs/${session.user.id}/${templateId}.pdf`;
      await r2.put(key, bytes.buffer, {
        httpMetadata: { contentType: "application/pdf" },
      });

      await db
        .prepare("UPDATE templates SET scan_pdf_key = ? WHERE id = ?")
        .bind(key, templateId)
        .run();
    } catch {
      // PDF復元失敗は無視（テンプレート自体は作成済み）
    }
  }

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ?")
    .bind(templateId)
    .first();

  return NextResponse.json({ template }, { status: 201 });
}
