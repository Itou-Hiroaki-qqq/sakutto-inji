import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getD1, getR2 } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/templates/:id/pdf - スキャンPDFアップロード
export async function POST(request: NextRequest, { params }: Params) {
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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは10MB以下にしてください" },
      { status: 400 }
    );
  }

  const r2 = await getR2();
  const key = `scan-pdfs/${session.user.id}/${id}.pdf`;

  await r2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: "application/pdf" },
  });

  // scan_pdf_key をテンプレートに保存
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE templates SET scan_pdf_key = ?, updated_at = ? WHERE id = ?")
    .bind(key, now, id)
    .run();

  return NextResponse.json({ scanPdfKey: key }, { status: 201 });
}

// GET /api/templates/:id/pdf - スキャンPDF取得
export async function GET(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first<{ scan_pdf_key: string | null }>();

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  if (!template.scan_pdf_key) {
    return NextResponse.json({ error: "PDFが登録されていません" }, { status: 404 });
  }

  const r2 = await getR2();
  const object = await r2.get(template.scan_pdf_key);

  if (!object) {
    return NextResponse.json({ error: "PDFファイルが見つかりません" }, { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

// DELETE /api/templates/:id/pdf - スキャンPDF削除
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = await getD1();

  const template = await db
    .prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first<{ scan_pdf_key: string | null }>();

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  if (template.scan_pdf_key) {
    const r2 = await getR2();
    await r2.delete(template.scan_pdf_key);

    const now = new Date().toISOString();
    await db
      .prepare("UPDATE templates SET scan_pdf_key = NULL, updated_at = ? WHERE id = ?")
      .bind(now, id)
      .run();
  }

  return NextResponse.json({ success: true });
}
