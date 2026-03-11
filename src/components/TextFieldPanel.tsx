"use client";

import { useEffect, useRef } from "react";
import type { TextFieldData } from "./TextField";

const COLOR_OPTIONS = [
  { value: "#000000", label: "黒" },
  { value: "#333333", label: "濃灰" },
  { value: "#666666", label: "灰" },
  { value: "#DC2626", label: "赤" },
  { value: "#2563EB", label: "青" },
  { value: "#16A34A", label: "緑" },
  { value: "#9333EA", label: "紫" },
  { value: "#EA580C", label: "橙" },
];

type Props = {
  fields: TextFieldData[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, updates: Partial<TextFieldData>) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  onAddField: () => void;
};

export function TextFieldPanel({
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onAddField,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // 選択フィールド変更時にスクロール＆フォーカス
  useEffect(() => {
    if (!selectedFieldId || !listRef.current) return;
    // 少し遅延させてDOMが更新された後にスクロール
    const timer = setTimeout(() => {
      const el = listRef.current?.querySelector(
        `[data-field-id="${selectedFieldId}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const textarea = el.querySelector("textarea");
        textarea?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedFieldId]);

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-700">フィールド一覧</h3>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        {fields.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            用紙上をクリックしてフィールドを追加
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={index}
                isSelected={field.id === selectedFieldId}
                onSelect={() => onSelectField(field.id)}
                onUpdate={(updates) => onUpdateField(field.id, updates)}
                onDelete={() => onDeleteField(field.id)}
                onDuplicate={() => onDuplicateField(field.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-3">
        <button
          onClick={onAddField}
          className="w-full rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          + フィールドを追加
        </button>
        <p className="mt-1 text-center text-xs text-gray-400">
          用紙上をクリックでも追加可
        </p>
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  field: TextFieldData;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextFieldData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const displayLabel =
    field.content.length > 20
      ? field.content.slice(0, 20) + "..."
      : field.content || "テキスト";

  return (
    <div
      data-field-id={field.id}
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border p-3 text-sm ${
        isSelected
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-gray-700">
          ({index + 1}) {displayLabel}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-xs text-red-400 hover:text-red-600"
        >
          削除
        </button>
      </div>

      <div className="space-y-2">
        <textarea
          placeholder="テキスト内容"
          value={field.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={2}
          className="w-full resize-none rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400">サイズ(pt)</label>
            <input
              type="number"
              value={field.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              min={4}
              max={200}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400">幅(mm)</label>
            <input
              type="number"
              value={field.widthMm || ""}
              onChange={(e) =>
                onUpdate({ widthMm: e.target.value ? Number(e.target.value) : null })
              }
              min={1}
              placeholder="自動"
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400">フォント</label>
            <select
              value={field.fontFamily}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
            >
              <option value="noto-sans-jp">ゴシック</option>
              <option value="noto-serif-jp">明朝</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400">方向</label>
            <select
              value={field.direction}
              onChange={(e) =>
                onUpdate({ direction: e.target.value as "horizontal" | "vertical" })
              }
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
            >
              <option value="horizontal">横書き</option>
              <option value="vertical">縦書き</option>
            </select>
          </div>
        </div>

        {/* 色選択 */}
        <div>
          <label className="text-xs text-gray-400">色</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ color: opt.value });
                }}
                className={`h-5 w-5 rounded-full border-2 ${
                  (field.color || "#000000") === opt.value
                    ? "border-blue-500 ring-1 ring-blue-300"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: opt.value }}
              />
            ))}
          </div>
        </div>

        {/* フィールド回転 */}
        <div>
          <label className="text-xs text-gray-400">回転</label>
          <div className="mt-1 flex gap-1">
            {([0, 90, 180, 270] as const).map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ fieldRotation: deg });
                }}
                className={`rounded border px-2 py-0.5 text-xs ${
                  (field.fieldRotation || 0) === deg
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* この設定でコピー */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600"
      >
        この設定でコピー
      </button>
    </div>
  );
}
