"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { loadPdf, startRenderToCanvas } from "@/lib/pdf-renderer";
import { generatePrintPdf } from "@/lib/pdf-generator";
import { mmToPx } from "@/lib/coordinates";
import { PrintGuide } from "@/components/PrintGuide";
import { PrintSettingsNote } from "@/components/PrintSettingsNote";
import { TextField, type TextFieldData } from "@/components/TextField";
import type { PDFDocumentProxy } from "pdfjs-dist";

type TemplateData = {
  id: string;
  name: string;
  paper_width_mm: number;
  paper_height_mm: number;
  paper_preset: string | null;
  scan_pdf_key: string | null;
  print_settings_note: string | null;
};

export default function PrintPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [fields, setFields] = useState<TextFieldData[]>([]);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [showBackground, setShowBackground] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRenderRef = useRef<(() => void) | null>(null);

  // 未ログイン時リダイレクト
  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  // 背景PDF描画
  useEffect(() => {
    if (!pdfDoc || !bgCanvasRef.current || !template || !showBackground) return;

    // 前回のレンダリングをキャンセル
    cancelRenderRef.current?.();
    cancelRenderRef.current = null;

    const canvas = bgCanvasRef.current;
    let currentCancel: (() => void) | null = null;

    const paperWidthPx = mmToPx(template.paper_width_mm, 1);
    pdfDoc.getPage(1).then((page) => {
      // cleanup済みなら何もしない
      if (cancelRenderRef.current === null && currentCancel !== null) return;

      const viewport = page.getViewport({ scale: 1 });
      const scale = paperWidthPx / viewport.width;
      const task = startRenderToCanvas(pdfDoc, canvas, 1, scale);
      currentCancel = task.cancel;
      cancelRenderRef.current = task.cancel;
    });

    cancelRenderRef.current = () => {
      currentCancel?.();
    };

    return () => {
      currentCancel?.();
      cancelRenderRef.current = null;
    };
  }, [pdfDoc, template, showBackground]);

  // データ読み込み
  useEffect(() => {
    if (!session) return;

    async function load() {
      try {
        const res = await fetch(`/api/templates/${templateId}`);
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = (await res.json()) as {
          template: TemplateData;
          textFields: Record<string, unknown>[];
        };
        setTemplate(data.template);

        if (data.textFields?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: TextFieldData[] = data.textFields.map((f: any) => ({
            id: f.id as string,
            label: (f.label || "") as string,
            content: (f.content || "") as string,
            positionXMm: f.position_x_mm as number,
            positionYMm: f.position_y_mm as number,
            widthMm: f.width_mm as number | null,
            fontSize: f.font_size as number,
            fontFamily: f.font_family as string,
            direction: f.direction as "horizontal" | "vertical",
            color: (f.color || "#000000") as string,
            fieldRotation: (f.field_rotation || 0) as 0 | 90 | 180 | 270,
            sortOrder: f.sort_order as number,
          }));
          setFields(mapped);
        }

        if (data.template.scan_pdf_key) {
          const pdfRes = await fetch(`/api/templates/${templateId}/pdf`);
          if (pdfRes.ok) {
            const buf = await pdfRes.arrayBuffer();
            const doc = await loadPdf(buf);
            setPdfDoc(doc);
          }
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session, templateId, router]);

  const handleDownloadPdf = async () => {
    if (!template) return;
    setDownloading(true);
    try {
      const pdfBytes = await generatePrintPdf({
        widthMm: template.paper_width_mm,
        heightMm: template.paper_height_mm,
        fields,
      });
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name}_印刷用.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDFダウンロードエラー:", e);
    } finally {
      setDownloading(false);
    }
  };

  if (sessionPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!template) return null;

  const paperWidthPx = mmToPx(template.paper_width_mm, 1);
  const paperHeightPx = mmToPx(template.paper_height_mm, 1);

  return (
    <div className="flex h-screen flex-col">
      {/* ヘッダー */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start gap-0.5">
            <button
              onClick={() => router.push(`/templates/${templateId}/edit`)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 編集に戻る
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← トップページ
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-800">印刷プレビュー</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="rounded-md bg-blue-600 px-5 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading ? "PDF生成中..." : "PDFをダウンロード"}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左ペイン: プレビュー */}
        <div className="flex flex-1 flex-col items-center overflow-auto bg-gray-200 p-8">
          {/* 背景表示トグル（プレビューの上） */}
          {pdfDoc && (
            <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showBackground}
                onChange={(e) => setShowBackground(e.target.checked)}
                className="rounded"
              />
              スキャン画像を重ねて表示
            </label>
          )}

          <div
            className="relative shrink-0 bg-white shadow-lg"
            style={{ width: paperWidthPx, height: paperHeightPx }}
          >
            {/* 背景PDF（オプション） */}
            {showBackground && pdfDoc && (
              <canvas
                ref={bgCanvasRef}
                className="pointer-events-none absolute left-0 top-0 opacity-30"
                style={{ width: paperWidthPx, height: paperHeightPx }}
              />
            )}

            {/* テキストフィールド（印刷プレビュー） */}
            {fields.map((field) => (
              <TextField
                key={field.id}
                field={field}
                zoom={1}
                isSelected={false}
                onSelect={() => {}}
                onMove={() => {}}
              />
            ))}
          </div>
        </div>

        {/* 右ペイン: ガイダンス */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-6">
          <div className="space-y-8">
            <PrintGuide
              widthMm={template.paper_width_mm}
              heightMm={template.paper_height_mm}
              paperPreset={template.paper_preset}
            />

            <PrintSettingsNote
              templateId={templateId}
              initialNote={template.print_settings_note || ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
