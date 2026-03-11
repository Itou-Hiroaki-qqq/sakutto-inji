"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PaperSizeSelector } from "@/components/PaperSizeSelector";
import { PdfUploader } from "@/components/PdfUploader";
import type { PaperPreset } from "@/lib/paper-presets";

export default function NewTemplatePage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [name, setName] = useState("");
  const [preset, setPreset] = useState("a4");
  const [widthMm, setWidthMm] = useState(210);
  const [heightMm, setHeightMm] = useState(297);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // カスタムサイズ保存ダイアログ
  const [showSaveSize, setShowSaveSize] = useState(false);
  const [sizeName, setSizeName] = useState("");

  // 未ログイン時リダイレクト
  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  const handlePresetChange = (p: PaperPreset) => {
    setPreset(p.id);
    if (p.id !== "custom") {
      setWidthMm(p.widthMm);
      setHeightMm(p.heightMm);
    }
  };

  const createTemplate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          paperWidthMm: widthMm,
          paperHeightMm: heightMm,
          paperPreset: preset,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "作成に失敗しました");
      }

      const { template } = (await res.json()) as {
        template: { id: string };
      };

      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        await fetch(`/api/templates/${template.id}/pdf`, {
          method: "POST",
          body: formData,
        });
      }

      router.push(`/templates/${template.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("テンプレート名を入力してください");
      return;
    }
    if (!widthMm || !heightMm) {
      setError("用紙サイズを設定してください");
      return;
    }

    // カスタムサイズの場合、保存するか確認
    if (preset === "custom") {
      setShowSaveSize(true);
      return;
    }

    await createTemplate();
  };

  const handleSaveSize = async (save: boolean) => {
    setShowSaveSize(false);
    if (save && sizeName.trim()) {
      try {
        await fetch("/api/paper-sizes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sizeName.trim(),
            widthMm,
            heightMm,
          }),
        });
      } catch {
        // 保存失敗してもテンプレート作成は続行
      }
    }
    await createTemplate();
  };

  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
        <button
          onClick={() => router.push("/")}
          className="mr-4 text-sm text-gray-500 hover:text-gray-700"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold text-gray-800">新しいテンプレート</h1>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              テンプレート名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ゆうちょ払込取扱票_家賃"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <PdfUploader onFileSelected={(file) => setPdfFile(file)} />
          {pdfFile && (
            <p className="text-sm text-green-600">
              選択済み: {pdfFile.name} (
              {(pdfFile.size / 1024 / 1024).toFixed(1)}MB)
            </p>
          )}

          <PaperSizeSelector
            selectedPreset={preset}
            widthMm={widthMm}
            heightMm={heightMm}
            onPresetChange={handlePresetChange}
            onWidthChange={setWidthMm}
            onHeightChange={setHeightMm}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "作成中..." : "作成して編集画面へ →"}
          </button>
        </div>
      </main>

      {/* カスタムサイズ保存ダイアログ */}
      {showSaveSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800">
              このサイズを保存しますか？
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {widthMm}mm × {heightMm}mm
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-sm text-gray-700">
                用紙サイズ名
              </label>
              <input
                type="text"
                value={sizeName}
                onChange={(e) => setSizeName(e.target.value)}
                placeholder="例: 払込取扱票"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleSaveSize(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                保存せず作成
              </button>
              <button
                onClick={() => handleSaveSize(true)}
                disabled={!sizeName.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                保存して作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
