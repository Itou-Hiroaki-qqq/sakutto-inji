"use client";

import { useState } from "react";

type Props = {
  templateId: string;
  initialNote: string;
};

export function PrintSettingsNote({ templateId, initialNote }: Props) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printSettingsNote: note }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-gray-700">印刷設定メモ</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="例: Canon TS3530: 後トレイ手差し、用紙サイズ80×140mm、余白なし"
        rows={3}
        className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {saving ? "保存中..." : "メモを保存"}
        </button>
        {saved && <span className="text-sm text-green-600">保存しました</span>}
      </div>
    </div>
  );
}
