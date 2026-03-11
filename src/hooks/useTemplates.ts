"use client";

import { useCallback, useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  paper_width_mm: number;
  paper_height_mm: number;
  paper_preset: string | null;
  scan_pdf_key: string | null;
  updated_at: string;
};

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updated_at" | "name">("updated_at");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("sort", sort);
      params.set("order", sort === "name" ? "asc" : "desc");

      const res = await fetch(`/api/templates?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { templates: Template[] };
        setTemplates(data.templates);
      }
    } finally {
      setLoading(false);
    }
  }, [query, sort]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(
    async (id: string) => {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );

  const duplicateTemplate = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/templates/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchTemplates();
      }
    },
    [fetchTemplates]
  );

  return {
    templates,
    loading,
    query,
    setQuery,
    sort,
    setSort,
    deleteTemplate,
    duplicateTemplate,
    refresh: fetchTemplates,
  };
}
