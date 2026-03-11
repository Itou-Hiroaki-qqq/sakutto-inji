"use client";

import { useState } from "react";
import { generatePrintPdf } from "@/lib/pdf-generator";
import type { TextFieldData } from "./TextField";

type Props = {
  open: boolean;
  templateId: string;
  templateName: string;
  hasPdf: boolean;
  paperWidthMm: number;
  paperHeightMm: number;
  onClose: () => void;
};

export function ExportDialog({
  open,
  templateId,
  templateName,
  hasPdf,
  paperWidthMm,
  paperHeightMm,
  onClose,
}: Props) {
  const [includePdf, setIncludePdf] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "pdf">("json");
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const handleExportJson = async () => {
    const params = new URLSearchParams();
    if (includePdf) params.set("includePdf", "true");

    const res = await fetch(`/api/templates/${templateId}/export?${params}`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    // テンプレートのフィールド情報を取得
    const res = await fetch(`/api/templates/${templateId}`);
    if (!res.ok) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as { template: any; textFields: any[] };

    const fields: TextFieldData[] = (data.textFields || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => ({
        id: f.id,
        label: f.label || "",
        content: f.content || "",
        positionXMm: f.position_x_mm,
        positionYMm: f.position_y_mm,
        widthMm: f.width_mm,
        fontSize: f.font_size,
        fontFamily: f.font_family,
        direction: f.direction,
        color: f.color || "#000000",
        fieldRotation: f.field_rotation || 0,
        sortOrder: f.sort_order,
      })
    );

    const pdfBytes = await generatePrintPdf({
      widthMm: paperWidthMm,
      heightMm: paperHeightMm,
      fields,
    });

    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (exportFormat === "pdf") {
        await handleExportPdf();
      } else {
        await handleExportJson();
      }
      onClose();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800">テンプレートをエクスポート</h3>
        <p className="mt-2 text-sm text-gray-600">{templateName}</p>

        {/* エクスポート形式 */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">エクスポート形式</p>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportFormat === "json"}
                onChange={() => setExportFormat("json")}
              />
              JSON（バックアップ用）
            </label>
            {exportFormat === "json" && hasPdf && (
              <label className="ml-6 mt-1 flex items-center gap-2 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={includePdf}
                  onChange={(e) => setIncludePdf(e.target.checked)}
                  className="rounded"
                />
                スキャンPDFを含める
              </label>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={exportFormat === "pdf"}
              onChange={() => setExportFormat("pdf")}
            />
            PDF（印刷用テキストのみ）
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? "エクスポート中..." : "ダウンロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
