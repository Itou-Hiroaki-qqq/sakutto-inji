"use client";

import { useCallback, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

type Props = {
  onFileSelected: (file: File) => void;
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** 画像ファイルをPDFに変換 */
async function imageFileToPdf(file: File): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const bytes = new Uint8Array(await file.arrayBuffer());

  let image;
  if (file.type === "image/jpeg") {
    image = await pdfDoc.embedJpg(bytes);
  } else {
    image = await pdfDoc.embedPng(bytes);
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const pdfBytes = await pdfDoc.save();
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([pdfBytes as unknown as BlobPart], `${baseName}.pdf`, {
    type: "application/pdf",
  });
}

export function PdfUploader({ onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);

  const validateAndSelect = useCallback(
    async (file: File) => {
      setError("");

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("PDF、JPEG、PNGファイルのみアップロードできます");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(
          "ファイルサイズは10MB以下にしてください。スキャン解像度を150〜200dpiに下げて再スキャンしてください。"
        );
        return;
      }

      // 画像の場合はPDFに変換
      if (file.type === "image/jpeg" || file.type === "image/png") {
        setConverting(true);
        try {
          const pdfFile = await imageFileToPdf(file);
          onFileSelected(pdfFile);
        } catch {
          setError("画像のPDF変換に失敗しました");
        } finally {
          setConverting(false);
        }
        return;
      }

      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        スキャンPDF / 画像
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <p className="text-sm text-gray-600">
          {converting
            ? "画像をPDFに変換中..."
            : "クリックしてファイルを選択、またはドラッグ&ドロップ"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          PDF / JPEG / PNG（10MB以下）
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndSelect(file);
        }}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
