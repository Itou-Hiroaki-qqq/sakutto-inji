"use client";

const FONT_CACHE_NAME = "sakutto-inji-fonts-v1";

const FONT_KEY_MAP: Record<string, string> = {
  "noto-sans-jp": "NotoSansJP-Regular.ttf",
  "noto-sans-jp-bold": "NotoSansJP-Bold.ttf",
  "noto-serif-jp": "NotoSerifJP-Regular.ttf",
  "noto-serif-jp-bold": "NotoSerifJP-Bold.ttf",
};

/** フォントファイルをCache API経由で取得。キャッシュがあればキャッシュから返す */
export async function loadFont(fontId: string): Promise<ArrayBuffer> {
  const key = FONT_KEY_MAP[fontId];
  if (!key) throw new Error(`未知のフォントID: ${fontId}`);

  const url = `/api/fonts/${key}`;

  // Cache API が利用可能ならキャッシュを試みる
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(FONT_CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        return await cached.arrayBuffer();
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`フォント取得失敗: ${response.status}`);

      // キャッシュに保存
      cache.put(url, response.clone());
      return await response.arrayBuffer();
    } catch {
      // Cache APIが失敗した場合はfallthrough
    }
  }

  // フォールバック: 直接fetch
  const response = await fetch(url);
  if (!response.ok) throw new Error(`フォント取得失敗: ${response.status}`);
  return await response.arrayBuffer();
}
