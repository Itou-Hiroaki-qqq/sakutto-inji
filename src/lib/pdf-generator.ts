"use client";

import { PDFDocument, rgb, pushGraphicsState, popGraphicsState, translate, rotateDegrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mmToPt } from "./coordinates";
import { loadFont } from "./font-loader";
import { getVerticalCharInfo } from "./vertical-text";
import type { TextFieldData } from "@/components/TextField";

type GenerateOptions = {
  widthMm: number;
  heightMm: number;
  fields: TextFieldData[];
};

/** HEXカラー文字列をpdf-libのrgb()に変換 */
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/** テキストのみの印刷用PDFを生成 */
export async function generatePrintPdf({
  widthMm,
  heightMm,
  fields,
}: GenerateOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const pageWidth = mmToPt(widthMm);
  const pageHeight = mmToPt(heightMm);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // 使用されているフォントを収集して読み込み
  const fontIds = [...new Set(fields.map((f) => f.fontFamily))];
  const embeddedFonts: Record<string, Awaited<ReturnType<typeof pdfDoc.embedFont>>> = {};

  for (const fontId of fontIds) {
    try {
      const fontBytes = await loadFont(fontId);
      embeddedFonts[fontId] = await pdfDoc.embedFont(fontBytes);
    } catch (e) {
      console.warn(`フォント ${fontId} の読み込みに失敗:`, e);
    }
  }

  // テキストフィールドを描画
  for (const field of fields) {
    if (!field.content) continue;

    const font = embeddedFonts[field.fontFamily];
    if (!font) continue;

    const xPt = mmToPt(field.positionXMm);
    // PDF座標系はY軸が下から上なので反転
    const yPt = pageHeight - mmToPt(field.positionYMm) - field.fontSize;
    const color = hexToRgb(field.color || "#000000");
    const rotation = field.fieldRotation || 0;

    // 回転がある場合はグラフィックス状態を保存して回転変換を適用
    // 回転の原点はCSS同様 "top left"（PDF座標では左上 = (xPt, yPt + fontSize)）
    if (rotation !== 0) {
      const originX = xPt;
      const originY = yPt + field.fontSize;
      page.pushOperators(
        pushGraphicsState(),
        translate(originX, originY),
        rotateDegrees(-rotation),
        translate(-originX, -originY),
      );
    }

    if (field.direction === "vertical") {
      // 縦書き: 1文字ずつ配置（句読点・小書き文字の位置調整あり）
      const chars = [...field.content];
      let offsetY = 0;
      const lineHeight = field.fontSize * 1.2;
      for (const char of chars) {
        const info = getVerticalCharInfo(char);
        const cx = xPt + info.dxRatio * field.fontSize;
        const cy = yPt - offsetY + info.dyRatio * field.fontSize;
        page.drawText(info.char, {
          x: cx,
          y: cy,
          size: field.fontSize,
          font,
          color,
        });
        offsetY += lineHeight;
      }
    } else {
      // 横書き
      page.drawText(field.content, {
        x: xPt,
        y: yPt,
        size: field.fontSize,
        font,
        color,
        maxWidth: field.widthMm ? mmToPt(field.widthMm) : undefined,
      });
    }

    if (rotation !== 0) {
      page.pushOperators(popGraphicsState());
    }
  }

  return await pdfDoc.save();
}

/** 生成したPDFをBlobURLとして取得 */
export async function generatePrintPdfUrl(
  options: GenerateOptions
): Promise<string> {
  const pdfBytes = await generatePrintPdf(options);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
