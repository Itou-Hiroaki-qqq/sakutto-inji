/**
 * 縦書きテキスト処理
 * PDF生成時に句読点・小書き文字の位置を調整するためのマッピング
 */

/** 句読点・記号の位置調整（右上に寄せる） */
const PUNCTUATION_OFFSET: Record<string, { dx: number; dy: number }> = {
  "、": { dx: 0.5, dy: -0.3 },
  "。": { dx: 0.5, dy: -0.3 },
  "，": { dx: 0.5, dy: -0.3 },
  "．": { dx: 0.5, dy: -0.3 },
  "・": { dx: 0, dy: 0 },
  "：": { dx: 0, dy: 0 },
  "；": { dx: 0, dy: 0 },
};

/** 小書き文字の位置調整（やや右上に寄せて小さく） */
const SMALL_KANA_OFFSET: Record<string, { dx: number; dy: number }> = {
  "っ": { dx: 0.2, dy: -0.15 },
  "ッ": { dx: 0.2, dy: -0.15 },
  "ゃ": { dx: 0.15, dy: -0.1 },
  "ャ": { dx: 0.15, dy: -0.1 },
  "ゅ": { dx: 0.15, dy: -0.1 },
  "ュ": { dx: 0.15, dy: -0.1 },
  "ょ": { dx: 0.15, dy: -0.1 },
  "ョ": { dx: 0.15, dy: -0.1 },
  "ぁ": { dx: 0.15, dy: -0.1 },
  "ァ": { dx: 0.15, dy: -0.1 },
  "ぃ": { dx: 0.15, dy: -0.1 },
  "ィ": { dx: 0.15, dy: -0.1 },
  "ぅ": { dx: 0.15, dy: -0.1 },
  "ゥ": { dx: 0.15, dy: -0.1 },
  "ぇ": { dx: 0.15, dy: -0.1 },
  "ェ": { dx: 0.15, dy: -0.1 },
  "ぉ": { dx: 0.15, dy: -0.1 },
  "ォ": { dx: 0.15, dy: -0.1 },
  "ゎ": { dx: 0.15, dy: -0.1 },
};

/** 長音記号は縦棒に回転するため別途描画が必要 */
const ROTATED_CHARS = new Set(["ー", "〜", "～"]);

export type VerticalCharInfo = {
  char: string;
  /** フォントサイズに対する X オフセット比率 */
  dxRatio: number;
  /** フォントサイズに対する Y オフセット比率 */
  dyRatio: number;
  /** 回転が必要か（長音記号など） */
  rotate: boolean;
};

/** 縦書き用の文字情報を取得 */
export function getVerticalCharInfo(char: string): VerticalCharInfo {
  if (PUNCTUATION_OFFSET[char]) {
    return {
      char,
      dxRatio: PUNCTUATION_OFFSET[char].dx,
      dyRatio: PUNCTUATION_OFFSET[char].dy,
      rotate: false,
    };
  }

  if (SMALL_KANA_OFFSET[char]) {
    return {
      char,
      dxRatio: SMALL_KANA_OFFSET[char].dx,
      dyRatio: SMALL_KANA_OFFSET[char].dy,
      rotate: false,
    };
  }

  if (ROTATED_CHARS.has(char)) {
    return {
      char: "|",  // 長音記号は縦棒で代用（pdf-libでの回転は複雑なため）
      dxRatio: 0.3,
      dyRatio: 0,
      rotate: false,
    };
  }

  return { char, dxRatio: 0, dyRatio: 0, rotate: false };
}
