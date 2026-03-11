"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  paper_width_mm: number;
  paper_height_mm: number;
  paper_preset: string | null;
  updated_at: string;
};

type Props = {
  template: Template & { scan_pdf_key?: string | null };
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
};

export function TemplateCard({ template, onDelete, onExport }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const updatedDate = new Date(template.updated_at).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });

  const paperLabel =
    template.paper_preset && template.paper_preset !== "custom"
      ? template.paper_preset
      : `${template.paper_width_mm}×${template.paper_height_mm}mm`;

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md">
      <h3 className="truncate font-bold text-gray-800">{template.name}</h3>
      <p className="mt-1 text-xs text-gray-400">{paperLabel}</p>
      <p className="mt-1 text-xs text-gray-400">更新: {updatedDate}</p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => router.push(`/templates/${template.id}/edit`)}
          className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
        >
          編集
        </button>
        <button
          onClick={() => router.push(`/templates/${template.id}/print`)}
          className="rounded bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
        >
          印刷
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:bg-gray-200"
          >
            ...
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onExport(template.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  エクスポート
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(template.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
