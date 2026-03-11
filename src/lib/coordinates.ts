// 定数
const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;
const MM_TO_PT = PT_PER_INCH / MM_PER_INCH; // ≈ 2.8346

// 画面上で1mmを何pxで表示するかの基準値（96dpi / 25.4mm）
const BASE_DPI = 96 / MM_PER_INCH; // ≈ 3.78

/** mm → pt（PDF生成時に使用） */
export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

/** pt → mm */
export function ptToMm(pt: number): number {
  return pt / MM_TO_PT;
}

/** mm → px（画面表示時に使用） */
export function mmToPx(mm: number, zoom: number): number {
  return mm * BASE_DPI * zoom;
}

/** px → mm（画面クリック位置をmm座標に変換） */
export function pxToMm(px: number, zoom: number): number {
  return px / (BASE_DPI * zoom);
}

/** 画面座標(mm) → PDF座標(pt) の変換（Y軸反転） */
export function toPdfCoords(xMm: number, yMm: number, pageHeightMm: number) {
  return {
    x: mmToPt(xMm),
    y: mmToPt(pageHeightMm - yMm),
  };
}
