"use client";

import { useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export function ImportDialog({ open, onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/templates/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "インポートに失敗しました");
      }

      onImported();
      onClose();
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800">テンプレートをインポート</h3>

        <div className="mt-4">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-600 hover:border-gray-400"
          >
            {file ? file.name : "JSONファイルを選択"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setError("");
            }}
            className="hidden"
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              setFile(null);
              setError("");
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? "インポート中..." : "インポート"}
          </button>
        </div>
      </div>
    </div>
  );
}
