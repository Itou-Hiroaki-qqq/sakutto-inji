export type PaperPreset = {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
};

export const PAPER_PRESETS: PaperPreset[] = [
  { id: "a4", name: "A4", widthMm: 210, heightMm: 297 },
  { id: "b5", name: "B5", widthMm: 182, heightMm: 257 },
  { id: "a5", name: "A5", widthMm: 148, heightMm: 210 },
  { id: "hagaki", name: "はがき", widthMm: 100, heightMm: 148 },
  { id: "haraikomi", name: "ゆうちょ払込取扱票", widthMm: 114, heightMm: 180 },
  { id: "custom", name: "カスタム", widthMm: 0, heightMm: 0 },
];

export function getPresetById(id: string): PaperPreset | undefined {
  return PAPER_PRESETS.find((p) => p.id === id);
}
