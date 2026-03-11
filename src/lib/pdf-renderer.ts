"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

export type PdfPageInfo = {
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
};

const PT_TO_MM = 25.4 / 72;

// pdfjs-dist を動的にインポート（SSR時のDOMMatrixエラーを回避）
let pdfjsLibCache: typeof import("pdfjs-dist") | null = null;

async function getPdfjsLib() {
  if (pdfjsLibCache) return pdfjsLibCache;
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }
  pdfjsLibCache = pdfjsLib;
  return pdfjsLib;
}

/** PDFファイルを読み込み、ページ情報を取得 */
export async function loadPdf(data: ArrayBuffer) {
  const pdfjsLib = await getPdfjsLib();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  return pdf;
}

/** PDFのページサイズを取得 */
export async function getPageInfo(
  pdf: PDFDocumentProxy,
  pageNum: number = 1
): Promise<PdfPageInfo> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  return {
    widthPt: viewport.width,
    heightPt: viewport.height,
    widthMm: viewport.width * PT_TO_MM,
    heightMm: viewport.height * PT_TO_MM,
  };
}

/**
 * PDFページをCanvasに描画（非同期・キャンセル可能）
 * renderTask を即座に返し、呼び出し側がキャンセルできるようにする
 */
export function startRenderToCanvas(
  pdf: PDFDocumentProxy,
  canvas: HTMLCanvasElement,
  pageNum: number = 1,
  scale: number = 1
): { promise: Promise<void>; cancel: () => void } {
  let cancelled = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let renderTask: any = null;

  const cancel = () => {
    cancelled = true;
    if (renderTask) {
      try {
        renderTask.cancel();
      } catch {
        // already cancelled
      }
    }
  };

  const promise = (async () => {
    const page = await pdf.getPage(pageNum);
    if (cancelled) return;

    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx || cancelled) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderTask = page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any);

    try {
      await renderTask.promise;
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        (e.message.includes("Rendering cancelled") ||
          e.message.includes("cancelled"))
      ) {
        return;
      }
      throw e;
    }
  })();

  return { promise, cancel };
}

/** 後方互換: 旧API（await完了後にcancel返却） */
export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
  canvas: HTMLCanvasElement,
  pageNum: number = 1,
  scale: number = 1
): Promise<{ cancel: () => void }> {
  const task = startRenderToCanvas(pdf, canvas, pageNum, scale);
  await task.promise;
  return { cancel: task.cancel };
}
