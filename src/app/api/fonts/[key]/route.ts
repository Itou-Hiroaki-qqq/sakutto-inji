import { NextRequest, NextResponse } from "next/server";
import { getR2 } from "@/lib/db";

type Params = { params: Promise<{ key: string }> };

// GET /api/fonts/:key - フォントファイル取得（長期キャッシュ）
export async function GET(_request: NextRequest, { params }: Params) {
  const { key } = await params;

  // セキュリティ: fonts/ ディレクトリ配下のみ許可
  const allowedKeys = [
    "NotoSansJP-Regular.ttf",
    "NotoSansJP-Bold.ttf",
    "NotoSerifJP-Regular.ttf",
    "NotoSerifJP-Bold.ttf",
  ];

  if (!allowedKeys.includes(key)) {
    return NextResponse.json({ error: "フォントが見つかりません" }, { status: 404 });
  }

  const r2 = await getR2();
  const object = await r2.get(`fonts/${key}`);

  if (!object) {
    return NextResponse.json({ error: "フォントファイルが見つかりません" }, { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "font/ttf",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
