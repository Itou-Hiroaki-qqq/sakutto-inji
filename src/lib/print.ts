"use client";

/** iframe経由でPDFを印刷 */
export function printPdfFromUrl(pdfUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUrl;

    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } catch {
        // クロスオリジンの場合はwindow.openにフォールバック
        window.open(pdfUrl, "_blank");
      }
      // 印刷ダイアログが閉じた後にクリーンアップ
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
        resolve();
      }, 1000);
    };

    document.body.appendChild(iframe);
  });
}
