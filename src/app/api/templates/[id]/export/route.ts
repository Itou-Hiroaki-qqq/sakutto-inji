import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1, getR2 } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/templates/:id/export - テンプレートエクスポート
export async function GET(request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();
  const includePdf = request.nextUrl.searchParams.get("includePdf") === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first<Record<string, any>>();

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = await db
    .prepare("SELECT * FROM text_fields WHERE template_id = ? ORDER BY sort_order ASC")
    .bind(id)
    .all<Record<string, any>>();

  // エクスポートデータの構築
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportData: Record<string, any> = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    template: {
      name: template.name,
      paperWidthMm: template.paper_width_mm,
      paperHeightMm: template.paper_height_mm,
      paperPreset: template.paper_preset,
      printSettingsNote: template.print_settings_note,
    },
    textFields: fields.results.map((f) => ({
      label: f.label,
      content: f.content,
      positionXMm: f.position_x_mm,
      positionYMm: f.position_y_mm,
      widthMm: f.width_mm,
      fontSize: f.font_size,
      fontFamily: f.font_family,
      direction: f.direction,
      color: f.color || "#000000",
      fieldRotation: f.field_rotation || 0,
      sortOrder: f.sort_order,
    })),
  };

  // PDFを含める場合
  if (includePdf && template.scan_pdf_key) {
    const r2 = await getR2();
    const object = await r2.get(template.scan_pdf_key);
    if (object) {
      const buf = await object.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(buf))
      );
      exportData.scanPdf = base64;
    }
  }

  const json = JSON.stringify(exportData, null, 2);
  const filename = `${template.name}.json`;

  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
