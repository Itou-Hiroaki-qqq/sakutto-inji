"use client";

import { useCallback, useRef, useState } from "react";
import { mmToPx, pxToMm } from "@/lib/coordinates";

export type TextFieldData = {
  id: string;
  label: string;
  content: string;
  positionXMm: number;
  positionYMm: number;
  widthMm: number | null;
  fontSize: number;
  fontFamily: string;
  direction: "horizontal" | "vertical";
  color: string;
  fieldRotation: 0 | 90 | 180 | 270;
  sortOrder: number;
};

type Props = {
  field: TextFieldData;
  zoom: number;
  rotation?: 0 | 90 | 180 | 270;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (xMm: number, yMm: number) => void;
};

/** 画面上のドラッグ差分を用紙座標系の差分に変換 */
function transformDelta(
  dxPx: number,
  dyPx: number,
  rotation: number
): { dx: number; dy: number } {
  const rad = (-rotation * Math.PI) / 180;
  return {
    dx: dxPx * Math.cos(rad) - dyPx * Math.sin(rad),
    dy: dxPx * Math.sin(rad) + dyPx * Math.cos(rad),
  };
}

export function TextField({ field, zoom, rotation = 0, isSelected, onSelect, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, startXMm: 0, startYMm: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        startXMm: field.positionXMm,
        startYMm: field.positionYMm,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const rawDx = ev.clientX - dragStart.current.x;
        const rawDy = ev.clientY - dragStart.current.y;
        // 回転の逆変換を適用
        const { dx, dy } = transformDelta(rawDx, rawDy, rotation);
        const dxMm = pxToMm(dx, zoom);
        const dyMm = pxToMm(dy, zoom);
        onMove(
          dragStart.current.startXMm + dxMm,
          dragStart.current.startYMm + dyMm
        );
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [field.positionXMm, field.positionYMm, zoom, rotation, onSelect, onMove]
  );

  const x = mmToPx(field.positionXMm, zoom);
  const y = mmToPx(field.positionYMm, zoom);
  const fontSizePx = field.fontSize * zoom;
  const widthPx = field.widthMm ? mmToPx(field.widthMm, zoom) : undefined;

  const isVertical = field.direction === "vertical";

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      className={`absolute cursor-move select-none ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${dragging ? "opacity-80" : ""}`}
      style={{
        left: x,
        top: y,
        fontSize: fontSizePx,
        color: field.color || "#000000",
        width: isVertical ? fontSizePx * 1.5 : widthPx,
        writingMode: isVertical ? "vertical-rl" : undefined,
        textOrientation: isVertical ? "upright" : undefined,
        transform: field.fieldRotation ? `rotate(${field.fieldRotation}deg)` : undefined,
        transformOrigin: "top left",
        fontFamily:
          field.fontFamily === "noto-serif-jp"
            ? '"Noto Serif JP", serif'
            : '"Noto Sans JP", sans-serif',
        lineHeight: 1.4,
      }}
    >
      <div className="whitespace-pre-wrap break-all rounded-sm border border-transparent px-0.5 hover:border-blue-300">
        {field.content || (
          <span className="text-gray-300">
            {field.label || "テキスト"}
          </span>
        )}
      </div>
    </div>
  );
}
