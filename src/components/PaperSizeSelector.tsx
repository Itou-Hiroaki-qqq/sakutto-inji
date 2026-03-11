"use client";

import { useEffect, useState } from "react";
import { PAPER_PRESETS, type PaperPreset } from "@/lib/paper-presets";

type CustomPaperSize = {
  id: string;
  name: string;
  width_mm: number;
  height_mm: number;
};

type Props = {
  selectedPreset: string;
  widthMm: number;
  heightMm: number;
  onPresetChange: (preset: PaperPreset) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
};

export function PaperSizeSelector({
  selectedPreset,
  widthMm,
  heightMm,
  onPresetChange,
  onWidthChange,
  onHeightChange,
}: Props) {
  const [customSizes, setCustomSizes] = useState<CustomPaperSize[]>([]);
  const isCustom =
    selectedPreset === "custom" ||
    customSizes.some((s) => s.id === selectedPreset);

  // カスタムサイズ一覧を取得
  useEffect(() => {
    fetch("/api/paper-sizes")
      .then((res) => (res.ok ? res.json() : { paperSizes: [] }))
      .then((data: unknown) => {
        const d = data as { paperSizes: CustomPaperSize[] };
        setCustomSizes(d.paperSizes || []);
      })
      .catch(() => {});
  }, []);

  const handleChange = (value: string) => {
    // 標準プリセットから検索
    const preset = PAPER_PRESETS.find((p) => p.id === value);
    if (preset) {
      onPresetChange(preset);
      return;
    }
    // カスタム保存済みサイズから検索
    const custom = customSizes.find((s) => s.id === value);
    if (custom) {
      onPresetChange({
        id: custom.id,
        name: custom.name,
        widthMm: custom.width_mm,
        heightMm: custom.height_mm,
      });
    }
  };

  // カスタム保存済みサイズを選択中かどうかで入力のdisabledを制御
  const isEditable =
    selectedPreset === "custom" ||
    customSizes.some((s) => s.id === selectedPreset);

  const selectedCustom = customSizes.find((s) => s.id === selectedPreset);

  const handleDeleteCustomSize = async (sizeId: string) => {
    try {
      await fetch(`/api/paper-sizes/${sizeId}`, { method: "DELETE" });
      setCustomSizes((prev) => prev.filter((s) => s.id !== sizeId));
      // 削除したサイズが選択中ならカスタムに切替
      if (selectedPreset === sizeId) {
        const customPreset = PAPER_PRESETS.find((p) => p.id === "custom");
        if (customPreset) onPresetChange(customPreset);
      }
    } catch {
      // 削除失敗は無視
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">用紙サイズ</label>

      <select
        value={selectedPreset}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {PAPER_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.id !== "custom" ? ` (${p.widthMm}×${p.heightMm}mm)` : ""}
          </option>
        ))}
        {customSizes.length > 0 && (
          <optgroup label="保存済みカスタムサイズ">
            {customSizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.width_mm}×{s.height_mm}mm)
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {selectedCustom && (
        <button
          type="button"
          onClick={() => handleDeleteCustomSize(selectedCustom.id)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          「{selectedCustom.name}」を削除
        </button>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">幅 (mm)</label>
          <input
            type="number"
            value={widthMm || ""}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            disabled={!isEditable}
            min={1}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <span className="mt-5 text-gray-400">×</span>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">高さ (mm)</label>
          <input
            type="number"
            value={heightMm || ""}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            disabled={!isEditable}
            min={1}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
