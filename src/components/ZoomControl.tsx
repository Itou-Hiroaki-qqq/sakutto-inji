"use client";

type Props = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const STEP = 0.25;

export function ZoomControl({ zoom, onZoomChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - STEP))}
        disabled={zoom <= MIN_ZOOM}
        className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-30 hover:bg-gray-100"
      >
        -
      </button>
      <input
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={STEP}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="w-32"
      />
      <span className="min-w-[3rem] text-center text-sm text-gray-600">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + STEP))}
        disabled={zoom >= MAX_ZOOM}
        className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-30 hover:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}
