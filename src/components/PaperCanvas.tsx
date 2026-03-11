"use client";

import { useCallback, useEffect, useRef } from "react";
import { mmToPx, pxToMm } from "@/lib/coordinates";
import { startRenderToCanvas } from "@/lib/pdf-renderer";
import { TextField, type TextFieldData } from "./TextField";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Props = {
  widthMm: number;
  heightMm: number;
  zoom: number;
  rotation?: 0 | 90 | 180 | 270;
  pdfDoc: PDFDocumentProxy | null;
  fields: TextFieldData[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onMoveField: (id: string, xMm: number, yMm: number) => void;
  onCanvasClick: (xMm: number, yMm: number) => void;
};

export function PaperCanvas({
  widthMm,
  heightMm,
  zoom,
  rotation = 0,
  pdfDoc,
  fields,
  selectedFieldId,
  onSelectField,
  onMoveField,
  onCanvasClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const paperWidthPx = mmToPx(widthMm, zoom);
  const paperHeightPx = mmToPx(heightMm, zoom);

  // PDF背景の描画
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    // 前回のレンダリングを即座にキャンセル
    cancelRef.current?.();
    cancelRef.current = null;

    const canvas = canvasRef.current;
    // canvasをクリア
    canvas.width = 0;
    canvas.height = 0;

    let currentCancel: (() => void) | null = null;
    let cleanedUp = false;

    pdfDoc.getPage(1).then((page) => {
      if (cleanedUp) return;

      const viewport = page.getViewport({ scale: 1 });
      const scale = paperWidthPx / viewport.width;
      const task = startRenderToCanvas(pdfDoc, canvas, 1, scale);
      currentCancel = task.cancel;
      cancelRef.current = task.cancel;
    });

    // cleanup用
    cancelRef.current = () => {
      cleanedUp = true;
      currentCancel?.();
    };

    return () => {
      cleanedUp = true;
      currentCancel?.();
      cancelRef.current = null;
      // canvasをクリアして前回の描画が残らないようにする
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [pdfDoc, paperWidthPx]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // TextFieldのmouseDownでstopPropagationされるので、
      // ここに来るのは用紙の空白部分クリックのみ
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // 回転に応じてクリック座標を用紙座標に変換
      const isSwap = rotation === 90 || rotation === 270;
      const oW = isSwap ? paperHeightPx : paperWidthPx;
      const oH = isSwap ? paperWidthPx : paperHeightPx;

      const rad = (-rotation * Math.PI) / 180;
      const dx = clickX - oW / 2;
      const dy = clickY - oH / 2;
      const xPx = dx * Math.cos(rad) - dy * Math.sin(rad) + paperWidthPx / 2;
      const yPx = dx * Math.sin(rad) + dy * Math.cos(rad) + paperHeightPx / 2;

      const xMm = pxToMm(xPx, zoom);
      const yMm = pxToMm(yPx, zoom);

      if (xMm >= 0 && xMm <= widthMm && yMm >= 0 && yMm <= heightMm) {
        onCanvasClick(xMm, yMm);
      }
    },
    [zoom, widthMm, heightMm, onCanvasClick, rotation, paperWidthPx, paperHeightPx]
  );

  // 回転時に外側コンテナのサイズを調整
  const isSwapped = rotation === 90 || rotation === 270;
  const outerW = isSwapped ? paperHeightPx : paperWidthPx;
  const outerH = isSwapped ? paperWidthPx : paperHeightPx;

  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-8">
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        className="relative mx-auto"
        style={{
          width: outerW,
          height: outerH,
        }}
      >
        {/* 回転する用紙全体（背景 + フィールド） */}
        <div
          className="absolute bg-white shadow-lg"
          style={{
            width: paperWidthPx,
            height: paperHeightPx,
            transformOrigin: "center center",
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
            left: (outerW - paperWidthPx) / 2,
            top: (outerH - paperHeightPx) / 2,
          }}
        >
          {/* PDF背景 */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute left-0 top-0"
            style={{ width: paperWidthPx, height: paperHeightPx }}
          />

          {/* テキストフィールド */}
          {fields.map((field) => (
            <TextField
              key={field.id}
              field={field}
              zoom={zoom}
              rotation={rotation}
              isSelected={field.id === selectedFieldId}
              onSelect={() => onSelectField(field.id)}
              onMove={(xMm, yMm) => onMoveField(field.id, xMm, yMm)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
