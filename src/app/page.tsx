"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/Header";
import { TemplateCard } from "@/components/TemplateCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { useTemplates } from "@/hooks/useTemplates";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const {
    templates,
    loading,
    query,
    setQuery,
    sort,
    setSort,
    deleteTemplate,
    refresh,
  } = useTemplates();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!session) return null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTemplate(deleteTarget);
    setDeleteTarget(null);
  };

  const exportTemplate = exportTarget
    ? templates.find((t) => t.id === exportTarget)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* ヘッダー行 */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">テンプレート一覧</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              インポート
            </button>
            <button
              onClick={() => router.push("/templates/new")}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              + 新規作成
            </button>
          </div>
        </div>

        {/* 検索・並び替え */}
        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="テンプレートを検索..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "updated_at" | "name")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="updated_at">更新日順</option>
            <option value="name">名前順</option>
          </select>
        </div>

        {/* テンプレート一覧 */}
        {loading ? (
          <div className="mt-8 text-center text-gray-400">読み込み中...</div>
        ) : templates.length === 0 ? (
          <div className="mt-8 text-center text-gray-400">
            <p>テンプレートはまだありません。</p>
            <p className="mt-1 text-sm">
              「新規作成」からテンプレートを作成してください。
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onDelete={setDeleteTarget}
                onExport={setExportTarget}
              />
            ))}
          </div>
        )}
      </main>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="テンプレートを削除"
        message="このテンプレートを削除しますか？この操作は取り消せません。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* エクスポートダイアログ */}
      {exportTemplate && (
        <ExportDialog
          open={!!exportTarget}
          templateId={exportTemplate.id}
          templateName={exportTemplate.name}
          hasPdf={!!exportTemplate.scan_pdf_key}
          paperWidthMm={exportTemplate.paper_width_mm}
          paperHeightMm={exportTemplate.paper_height_mm}
          onClose={() => setExportTarget(null)}
        />
      )}

      {/* インポートダイアログ */}
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </div>
  );
}
