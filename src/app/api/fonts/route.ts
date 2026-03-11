import { NextResponse } from "next/server";

const AVAILABLE_FONTS = [
  {
    id: "noto-sans-jp",
    name: "Noto Sans JP（ゴシック）",
    key: "NotoSansJP-Regular.ttf",
  },
  {
    id: "noto-sans-jp-bold",
    name: "Noto Sans JP Bold",
    key: "NotoSansJP-Bold.ttf",
  },
  {
    id: "noto-serif-jp",
    name: "Noto Serif JP（明朝）",
    key: "NotoSerifJP-Regular.ttf",
  },
  {
    id: "noto-serif-jp-bold",
    name: "Noto Serif JP Bold",
    key: "NotoSerifJP-Bold.ttf",
  },
];

// GET /api/fonts - 利用可能フォント一覧
export async function GET() {
  return NextResponse.json({ fonts: AVAILABLE_FONTS });
}
