"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { loadPdf } from "@/lib/pdf-renderer";
import { PaperCanvas } from "@/components/PaperCanvas";
import { TextFieldPanel } from "@/components/TextFieldPanel";
import { ZoomControl } from "@/components/ZoomControl";
import { useTextFields } from "@/hooks/useTextFields";
import type { TextFieldData } from "@/components/TextField";
import type { PDFDocumentProxy } from "pdfjs-dist";

type TemplateData = {
  id: string;
  name: string;
  paper_width_mm: number;
  paper_height_mm: number;
  paper_preset: string | null;
  scan_pdf_key: string | null;
};

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    addField,
    addFieldCenter,
    duplicateField,
    updateField,
    moveField,
    deleteField,
    undo,
  } = useTextFields();

  // 未ログイン時リダイレクト
  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  // テンプレートデータの読み込み
  useEffect(() => {
    if (!session) return;

    async function load() {
      try {
        const res = await fetch(`/api/templates/${templateId}`);
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json() as {
          template: TemplateData;
          textFields: Record<string, unknown>[];
        };
        setTemplate(data.template);

        // テキストフィールドの読み込み
        if (data.textFields?.length > 0) {
          setSaved(true);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: TextFieldData[] = data.textFields.map((f: any) => ({
            id: f.id as string,
            label: (f.label || "") as string,
            content: (f.content || "") as string,
            positionXMm: f.position_x_mm as number,
            positionYMm: f.position_y_mm as number,
            widthMm: (f.width_mm as number | null),
            fontSize: f.font_size as number,
            fontFamily: f.font_family as string,
            direction: f.direction as "horizontal" | "vertical",
            color: (f.color || "#000000") as string,
            fieldRotation: (f.field_rotation || 0) as 0 | 90 | 180 | 270,
            sortOrder: f.sort_order as number,
          }));
          setFields(mapped);
        }

        // PDFの読み込み
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
  }, [session, templateId, router, setFields]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!template) return;
    setSaving(true);
    try {
      await fetch(`/api/templates/${templateId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map((f, i) => ({
            id: f.id,
            label: f.label,
            content: f.content,
            positionXMm: f.positionXMm,
            positionYMm: f.positionYMm,
            widthMm: f.widthMm,
            fontSize: f.fontSize,
            fontFamily: f.fontFamily,
            direction: f.direction,
            color: f.color,
            fieldRotation: f.fieldRotation,
            sortOrder: i,
          })),
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [template, templateId, fields]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フォーカス中はショートカット無効
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (isInput) return;
        e.preventDefault();
        undo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        if (selectedFieldId) {
          e.preventDefault();
          deleteField(selectedFieldId);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, undo, selectedFieldId, deleteField]);

  if (sessionPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className="flex h-screen flex-col">
      {/* ヘッダー */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start gap-0.5">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← トップページ
            </button>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 1つ前に戻る
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-800">{template.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          {saved && (
            <button
              onClick={() => router.push(`/templates/${templateId}/print`)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              印刷プレビュー →
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左ペイン: 用紙キャンバス */}
        <div className="flex flex-1 flex-col">
          <PaperCanvas
            widthMm={template.paper_width_mm}
            heightMm={template.paper_height_mm}
            zoom={zoom}
            rotation={rotation}
            pdfDoc={pdfDoc}
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onMoveField={moveField}
            onCanvasClick={(xMm, yMm) => addField(xMm, yMm)}
          />

          {/* ズームコントロール */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2">
            <span className="text-xs text-gray-400">
              用紙: {template.paper_width_mm}mm × {template.paper_height_mm}mm
              {template.paper_preset && template.paper_preset !== "custom"
                ? ` (${template.paper_preset})`
                : ""}
            </span>
            <div className="flex items-center gap-3">
              {pdfDoc && (
                <button
                  onClick={() =>
                    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270)
                  }
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  title="PDF画像を90°回転"
                >
                  ↻ 回転
                </button>
              )}
              <ZoomControl zoom={zoom} onZoomChange={setZoom} />
            </div>
          </div>
        </div>

        {/* 右ペイン: フィールドパネル */}
        <div className="w-80 shrink-0">
          <TextFieldPanel
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onUpdateField={updateField}
            onDeleteField={deleteField}
            onDuplicateField={duplicateField}
            onAddField={() =>
              addFieldCenter(template.paper_width_mm, template.paper_height_mm)
            }
          />
        </div>
      </div>
    </div>
  );
}
