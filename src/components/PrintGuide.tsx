"use client";

// プリンター設定で選択できる標準用紙サイズ名のマッピング
const STANDARD_SIZE_NAMES: Record<string, string> = {
  a4: "A4",
  a5: "A5",
  b5: "B5",
};

type Props = {
  widthMm: number;
  heightMm: number;
  paperPreset: string | null;
};

export function PrintGuide({ widthMm, heightMm, paperPreset }: Props) {
  // 標準サイズ（A4, B5, A5）はプリンター設定の名前で表示
  // それ以外（はがき、払込取扱票、カスタム等）はサイズ数値で表示
  const standardName = paperPreset ? STANDARD_SIZE_NAMES[paperPreset] : null;
  const paperSizeLabel = standardName
    ? `「${standardName}」`
    : `「ユーザー定義」で ${widthMm}mm × ${heightMm}mm`;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-700">印刷方法</h3>

      <p className="text-sm text-gray-600">
        上の「PDFをダウンロード」ボタンでPDFファイルを保存し、以下の手順で印刷してください。
      </p>

      <ol className="list-inside list-decimal space-y-3 text-sm text-gray-600">
        <li>
          ダウンロードしたPDFを開き、印刷ダイアログを表示する
        </li>
        <li>
          用紙サイズを{" "}
          <span className="font-medium text-gray-800">{paperSizeLabel}</span>{" "}
          に設定する
        </li>
        <li>
          余白を{" "}
          <span className="font-medium text-gray-800">「なし」</span>{" "}
          に設定する
        </li>
        <li>
          拡大/縮小を{" "}
          <span className="font-medium text-gray-800">「100%（実際のサイズ）」</span>{" "}
          に設定する（「合わせる」は使わない）
        </li>
        <li>
          まず<span className="font-medium text-gray-800">普通紙でテスト印刷</span>し、
          位置がずれていないか確認してから本番用紙に印刷する
        </li>
      </ol>

      <p className="text-xs text-gray-500">
        ※実際の印刷位置はプレビューとやや異なる場合があります。テスト印刷でよく位置を確認してから本番印刷に入ってください。
      </p>

      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
        プリンターによって設定項目の名称が異なる場合があります。
        詳しくはプリンターのマニュアルを参照してください。
      </div>
    </div>
  );
}
