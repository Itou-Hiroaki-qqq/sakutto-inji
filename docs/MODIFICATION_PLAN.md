# さくっと印字 修正計画書（v2）

作成日: 2026-03-10
動作確認フィードバックに基づく修正計画

---

## 概要

動作確認で判明した問題点・改善要望を5つのフェーズに分けて対応する。
各フェーズ内のタスクは依存関係が少ないため、個別に実装・テスト可能。

---

## フェーズ1: 新規登録画面（`/templates/new`）

### 1-1. JPEG/PNG → PDF 自動変換

**対象ファイル:**
- `src/components/PdfUploader.tsx`

**現状:**
- `accept="application/pdf"` でPDFのみ受付
- JPEG/PNG を選択するとエラー「PDFファイルのみアップロードできます」

**修正内容:**
1. `accept` 属性に `image/jpeg, image/png` を追加
2. `validateAndSelect` 関数を修正:
   - ファイルタイプが `image/jpeg` or `image/png` の場合:
     - `pdf-lib` の `PDFDocument.create()` で空PDFを作成
     - 画像を `embedJpg()` or `embedPng()` で埋め込み
     - 画像サイズに合わせたページを追加
     - PDF の `Uint8Array` を `File` オブジェクトに変換
     - 変換後の File を `onFileSelected` に渡す
   - ファイルタイプが `application/pdf` の場合: 従来通り
   - それ以外: エラー表示
3. UIテキストを「PDFまたは画像（JPEG/PNG）を選択」に更新

**注意点:**
- `pdf-lib` は既にプロジェクトの依存関係に含まれている
- 画像の向き（EXIF Orientation）は考慮が必要な場合あり

---

### 1-2. 払込取扱票の名称・サイズ修正

**対象ファイル:**
- `src/lib/paper-presets.ts`

**現状:**
```typescript
{ id: "haraikomi", name: "払込取扱票", widthMm: 80, heightMm: 140 }
```

**修正内容:**
```typescript
{ id: "haraikomi", name: "ゆうちょ払込取扱票", widthMm: 114, heightMm: 180 }
```

**影響範囲:**
- 既存テンプレートのDBデータは `paper_width_mm` / `paper_height_mm` で個別保存されているため影響なし
- プリセットIDは `haraikomi` のまま変更不要

---

### 1-3. カスタム用紙サイズの保存機能

**対象ファイル:**
- `db/schema.sql` — 新テーブル追加
- `src/app/api/paper-sizes/route.ts` — 新規API（GET一覧, POST作成）
- `src/app/api/paper-sizes/[id]/route.ts` — 新規API（DELETE）
- `src/components/PaperSizeSelector.tsx` — カスタムサイズリスト表示
- `src/app/templates/new/page.tsx` — 保存確認ダイアログ追加
- `src/components/ConfirmDialog.tsx` — 既存の汎用ダイアログを流用

**新規テーブル:**
```sql
CREATE TABLE IF NOT EXISTS custom_paper_sizes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width_mm REAL NOT NULL,
  height_mm REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**修正内容:**
1. `handleSubmit` 実行時、`preset === "custom"` なら確認ダイアログ表示:
   - 「このサイズを保存しますか？」
   - 「はい」→ 用紙サイズ名の入力欄を表示 → POST `/api/paper-sizes`
   - 「いいえ」→ そのままテンプレート作成に進む
2. `PaperSizeSelector` のプリセットリストに、ユーザーの保存済みカスタムサイズを追加表示
3. APIエンドポイント:
   - `GET /api/paper-sizes` — ログインユーザーの保存済みサイズ一覧
   - `POST /api/paper-sizes` — 新規保存 `{ name, widthMm, heightMm }`
   - `DELETE /api/paper-sizes/:id` — 削除

---

## フェーズ2: 編集画面（`/templates/[id]/edit`）

### 2-1. ナビゲーションリンクの変更

**対象ファイル:**
- `src/app/templates/[id]/edit/page.tsx` (L182-186)

**修正内容:**
1. `← 一覧` → `← トップページ` に変更（遷移先は `/` のまま）
2. その下に `← 1つ前に戻る` リンクを追加
   - `onClick={() => router.back()}`
   - ブラウザの履歴を1つ戻る挙動

**変更前:**
```tsx
<button onClick={() => router.push("/")}>← 一覧</button>
```

**変更後:**
```tsx
<button onClick={() => router.push("/")}>← トップページ</button>
<button onClick={() => router.back()}>← 1つ前に戻る</button>
```

---

### 2-2. 「ラベル」フィールドの削除

**対象ファイル:**
- `src/components/TextFieldPanel.tsx` (L104-111, L91)

**現状:**
- 「ラベル」と「テキスト内容」の2つの入力欄がある
- 両方ともPDFにテキストが反映される同じ挙動
- ラベルはフィールド一覧のヘッダー表示に使用: `(1) {field.label || "テキスト"}`

**修正内容:**
1. ラベルの `<input>` を削除（L105-111）
2. ヘッダー表示を `(1) {field.content || "テキスト"}` に変更（L91）
   - content が長い場合は先頭20文字 + `...` でトランケート
3. `TextFieldData` 型の `label` プロパティは内部的に残す（DB互換性のため）
   - 新規フィールド作成時は `label: ""` のまま

---

### 2-3. テキスト色の選択機能

**対象ファイル:**
- `src/components/TextField.tsx` — `TextFieldData` 型に `color` 追加、スタイル反映
- `src/components/TextFieldPanel.tsx` — 色選択UIの追加
- `src/hooks/useTextFields.ts` — デフォルト色設定
- `src/lib/pdf-generator.ts` — PDF描画時の色反映
- `src/app/templates/[id]/edit/page.tsx` — 保存データに `color` 追加
- `src/app/templates/[id]/print/page.tsx` — 読み込みデータに `color` 追加
- `src/app/api/templates/[id]/fields/route.ts` — color カラム対応
- `src/app/api/templates/[id]/duplicate/route.ts` — 複製時 color コピー
- `src/app/api/templates/[id]/export/route.ts` — エクスポートに color 含む
- `src/app/api/templates/import/route.ts` — インポート時 color 対応
- `db/schema.sql` — `color` カラム追加

**データ変更:**
```typescript
// TextFieldData 型に追加
color: string; // デフォルト: "#000000"（黒）
```

```sql
-- text_fields テーブルに追加（ALTER TABLE）
ALTER TABLE text_fields ADD COLUMN color TEXT NOT NULL DEFAULT '#000000';
```

**色の選択肢（基本8色）:**
```typescript
const COLOR_OPTIONS = [
  { value: "#000000", label: "黒" },
  { value: "#333333", label: "濃灰" },
  { value: "#666666", label: "灰" },
  { value: "#DC2626", label: "赤" },
  { value: "#2563EB", label: "青" },
  { value: "#16A34A", label: "緑" },
  { value: "#9333EA", label: "紫" },
  { value: "#EA580C", label: "橙" },
];
```

**UI:**
- `TextFieldPanel` のフォント選択の下に色選択を追加
- 丸いカラードットのボタン群として表示（省スペース）

**PDF生成時:**
- `pdf-generator.ts` の `page.drawText` の `color` に反映
- HEX → `rgb()` 変換: `#DC2626` → `rgb(220/255, 38/255, 38/255)`

**デフォルト:**
- 新規フィールド作成時は `color: "#000000"`（黒）

---

### 2-4. 「この設定でコピー」ボタン + フィールド追加時の設定引継ぎ

**対象ファイル:**
- `src/components/TextFieldPanel.tsx` — コピーボタン追加
- `src/hooks/useTextFields.ts` — `duplicateField`, `addFieldWithDefaults` メソッド追加

**修正内容:**

#### A. 「この設定でコピー」ボタン
1. 各フィールドカードの「削除」ボタンの隣（またはカード下部）に「この設定でコピー」ボタンを追加
2. クリック時の挙動:
   - 同じフィールドの全設定（content, fontSize, fontFamily, direction, color, widthMm）をコピー
   - 位置は元のフィールドのY座標 + 10mm 下にずらす
   - フィールド一覧では元のフィールドのすぐ下（sortOrder）に挿入
   - 新しいフィールドが選択状態になる

#### B. 「フィールドを追加」時の設定引継ぎ
1. `addFieldCenter` （パネル下部の「+ フィールドを追加」）実行時:
   - フィールドが1つ以上存在する場合、最後のフィールドの設定を引き継ぐ
   - 引き継ぐ項目: `fontSize`, `fontFamily`, `direction`, `color`, `widthMm`
   - 引き継がない項目: `content`（空）, `positionXMm/YMm`（中央配置）

**新規メソッド（useTextFields.ts）:**
```typescript
// フィールド複製
const duplicateField = useCallback((sourceId: string) => {
  const source = fields.find(f => f.id === sourceId);
  if (!source) return;
  const newField: TextFieldData = {
    ...source,
    id: uuidv4(),
    positionYMm: source.positionYMm + 10,
    sortOrder: source.sortOrder + 1,
  };
  // source の直後に挿入し、以降の sortOrder を +1
  pushUndo(fields);
  setFields(prev => {
    const idx = prev.findIndex(f => f.id === sourceId);
    const updated = [...prev];
    updated.splice(idx + 1, 0, newField);
    return updated.map((f, i) => ({ ...f, sortOrder: i }));
  });
  setSelectedFieldId(newField.id);
}, [fields, pushUndo]);

// 直前のフィールド設定を引き継いで追加
const addFieldWithDefaults = useCallback((xMm: number, yMm: number) => {
  const lastField = fields[fields.length - 1];
  const newField: TextFieldData = {
    id: uuidv4(),
    label: "",
    content: "",
    positionXMm: xMm,
    positionYMm: yMm,
    widthMm: lastField?.widthMm ?? null,
    fontSize: lastField?.fontSize ?? 12,
    fontFamily: lastField?.fontFamily ?? "noto-sans-jp",
    direction: lastField?.direction ?? "horizontal",
    color: lastField?.color ?? "#000000",
    sortOrder: fields.length,
  };
  pushUndo(fields);
  setFields(prev => [...prev, newField]);
  setSelectedFieldId(newField.id);
}, [fields, pushUndo]);
```

---

### 2-5. 新フィールド追加時のスクロール＆フォーカス

**対象ファイル:**
- `src/components/TextFieldPanel.tsx`

**修正内容:**
1. 各フィールドカードに `ref` を付与（`data-field-id={field.id}` 属性を使用）
2. `selectedFieldId` が変更されたとき（新フィールド追加時）:
   - 該当フィールドカードまでスクロール（`scrollIntoView({ behavior: 'smooth', block: 'nearest' })`）
   - テキスト内容の `textarea` にフォーカス
3. `useEffect` で `selectedFieldId` の変更を監視:
   ```typescript
   useEffect(() => {
     if (!selectedFieldId) return;
     const el = document.querySelector(`[data-field-id="${selectedFieldId}"]`);
     if (el) {
       el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
       const textarea = el.querySelector('textarea');
       textarea?.focus();
     }
   }, [selectedFieldId]);
   ```

---

### 2-6. Canvas 重複 render() エラー + pdfjs-dist SSR エラーの修正

**対象ファイル:**
- `src/components/PaperCanvas.tsx` (L39-53)
- `src/lib/pdf-renderer.ts` (L44-64)
- `src/app/templates/[id]/print/page.tsx` (L6)

**現状のエラー（2つ）:**

#### エラーA: Canvas 重複 render
```
Uncaught (in promise) Error: Cannot use the same canvas during multiple render() operations.
Use different canvas or ensure previous operations were cancelled or completed.
```

#### エラーB: SSR 時の DOMMatrix エラー（500 Internal Server Error）
```
⨯ ReferenceError: DOMMatrix is not defined
    at module evaluation (pdf.js/src/display/canvas.js:64:22)
    at module evaluation (src\lib\pdf-renderer.ts:3:1)
    at module evaluation (src\app\templates\[id]\print\page.tsx:6:1)
```

**原因:**

- **エラーA:** `useEffect` で PDF の render が呼ばれるが、前回の render が完了する前に新しい render が開始される。React StrictMode の二重実行や、zoom 変更時の連続呼び出しで発生。
- **エラーB:** `pdfjs-dist` はブラウザ専用ライブラリだが、`pdf-renderer.ts` の先頭で `import * as pdfjsLib from "pdfjs-dist"` として静的にインポートしている。Next.js の SSR 時にこのモジュールが評価され、`DOMMatrix`（ブラウザAPI）が存在しないためエラーが発生。印刷プレビューページ（`print/page.tsx`）が `pdf-renderer.ts` をインポートしているため、そのページのSSRが500エラーになる。

**修正内容:**

#### エラーB の修正（pdfjs-dist の動的インポート化）:

`pdf-renderer.ts` の `pdfjs-dist` インポートを静的インポートから動的インポートに変更:

```typescript
// 変更前（静的インポート → SSR時にエラー）
import * as pdfjsLib from "pdfjs-dist";

// 変更後（動的インポート → ブラウザでのみ読み込み）
async function getPdfjsLib() {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }
  return pdfjsLib;
}
```

各関数（`loadPdf`, `getPageInfo`, `renderPageToCanvas`）の冒頭で `const pdfjsLib = await getPdfjsLib()` を呼ぶように変更。

型のインポートは `import type { PDFDocumentProxy } from "pdfjs-dist"` として残す（型のみのインポートはSSRに影響しない）。

#### エラーA の修正（Canvas render キャンセル）:

1. `pdf-renderer.ts` の `renderPageToCanvas` を修正:
   - `RenderTask` オブジェクトを返すように変更（キャンセル可能に）
   ```typescript
   export async function renderPageToCanvas(
     pdf: PDFDocumentProxy,
     canvas: HTMLCanvasElement,
     pageNum: number = 1,
     scale: number = 1
   ): Promise<{ cancel: () => void }> {
     const page = await pdf.getPage(pageNum);
     const viewport = page.getViewport({ scale });
     canvas.width = viewport.width;
     canvas.height = viewport.height;
     const ctx = canvas.getContext("2d");
     if (!ctx) return { cancel: () => {} };

     const renderTask = page.render({ canvasContext: ctx, viewport });
     await renderTask.promise;
     return { cancel: () => renderTask.cancel() };
   }
   ```

2. `PaperCanvas.tsx` の `useEffect` を修正:
   - cleanup 関数で前回の renderTask をキャンセル
   ```typescript
   useEffect(() => {
     if (!pdfDoc || !canvasRef.current) return;
     let cancelled = false;
     let renderTask: { cancel: () => void } | null = null;

     pdfDoc.getPage(1).then((page) => {
       if (cancelled) return;
       const viewport = page.getViewport({ scale: 1 });
       const scale = paperWidthPx / viewport.width;
       renderPageToCanvas(pdfDoc, canvasRef.current!, 1, scale)
         .then(task => { renderTask = task; });
     });

     return () => {
       cancelled = true;
       renderTask?.cancel();
     };
   }, [pdfDoc, paperWidthPx]);
   ```

---

### 2-7. PDF 画像の回転機能

**対象ファイル:**
- `src/app/templates/[id]/edit/page.tsx` — 回転状態の管理、UIボタン
- `src/components/PaperCanvas.tsx` — 回転表示ロジック

**修正内容:**
1. `EditTemplatePage` に `rotation` state を追加（`0 | 90 | 180 | 270`）
2. ヘッダーまたはズームコントロール付近に「回転」ボタンを追加
   - クリックで 90° ずつ回転（0 → 90 → 180 → 270 → 0）
3. `PaperCanvas` に `rotation` prop を追加:
   - canvas（PDF背景画像）に CSS `transform: rotate(${rotation}deg)` を適用
   - 回転時にcanvasの幅・高さを入れ替え（90°/270°の場合）
4. テキストフィールドの座標は用紙基準（mm）のまま変わらない
   - 回転は表示のみの変更で、保存データに影響しない
5. フィールドの表示位置は回転に追従:
   - 回転した状態でもフィールドが正しい相対位置に表示される
   - CSS transform-origin と座標変換で対応

**印刷プレビューへの影響:**
- 印刷プレビューでは回転なし（常にトップページで設定した用紙サイズの向き）で表示
- `rotation` はテンプレートデータとしてDBには保存しない（編集画面のみの一時的な表示設定）

---

### 2-8. 編集画面に戻った時の PDF 表示不具合修正

**対象ファイル:**
- `src/components/PaperCanvas.tsx`
- `src/app/templates/[id]/edit/page.tsx`

**現象:**
- 印刷プレビューから編集画面に戻ると、PDF画像が逆向き・サイズが小さく表示される
- 拡大縮小ボタンを押すと元に戻る
- 新規登録画面から来た時にも時々発生

**原因の推定:**
1. `useEffect` の依存配列に `zoom` が含まれていないため、コンポーネント再マウント時に前回のzoom値でrenderされない
2. canvas の width/height がスタイル上のサイズと実際のピクセルサイズで不一致になっている
3. React StrictMode での cleanup 不足による render 競合（2-6 と同根）

**修正内容:**
1. 2-6 の修正（render キャンセル）が根本対策
2. `useEffect` の依存配列に必要な値を全て含める:
   ```typescript
   useEffect(() => {
     // ... render logic
   }, [pdfDoc, paperWidthPx, paperHeightPx, widthMm, heightMm]);
   ```
3. canvas サイズを render 前に確実にリセット:
   ```typescript
   // render 前に canvas をクリア
   const ctx = canvas.getContext("2d");
   if (ctx) {
     canvas.width = 0;
     canvas.height = 0;
   }
   ```
4. 印刷プレビューの `canvasRef` callback でも同様の修正を適用

---

## フェーズ3: 印刷プレビュー画面（`/templates/[id]/print`）

### 3-1. 「スキャン画像を重ねて表示」チェックボックスの位置変更

**対象ファイル:**
- `src/app/templates/[id]/print/page.tsx` (L191-201)

**現状:**
- チェックボックスがプレビュー白枠の下に配置されている
- 用紙サイズが大きいとチェックボックスが画面外に行ってしまう

**修正内容:**
- チェックボックスをプレビュー白枠の上（プレビューエリアの先頭）に移動

**変更後のレイアウト:**
```tsx
<div className="flex flex-1 flex-col items-center overflow-auto bg-gray-200 p-8">
  {/* チェックボックス（プレビューの上） */}
  {pdfDoc && (
    <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
      <input type="checkbox" ... />
      スキャン画像を重ねて表示
    </label>
  )}
  {/* プレビュー白枠 */}
  <div className="relative bg-white shadow-lg" style={{ ... }}>
    ...
  </div>
</div>
```

---

### 3-2. プレビュー白枠のサイズ修正

**対象ファイル:**
- `src/app/templates/[id]/print/page.tsx` (L163-188)

**現状:**
- 白枠の `height` が `paperHeightPx` で設定されているが、画面の高さ制限で下部が切れる

**修正内容:**
1. プレビュー白枠の高さが確実に `paperHeightPx` になるよう確認
2. 親コンテナの `overflow-auto` で全体がスクロール可能であることを確認
3. 白枠に `shrink-0` を追加して、Flexboxによる縮小を防止:
   ```tsx
   <div
     className="relative shrink-0 bg-white shadow-lg"
     style={{ width: paperWidthPx, height: paperHeightPx }}
   >
   ```

---

### 3-3. 縦書きフィールドの印刷プレビュー・印刷PDF での表示修正

**対象ファイル:**
- `src/components/TextField.tsx` — プレビュー表示の確認
- `src/lib/pdf-generator.ts` — 縦書きPDF描画の修正

**現象:**
- 編集画面では縦書きが正しく表示されるが、印刷プレビューでは横書きで右→左に流れる

**原因の推定:**
- 印刷プレビューでも同じ `TextField` コンポーネントを使用しているため、CSS上は同じはず
- zoom=1 での表示時に `writingMode` が正しく適用されているか確認が必要
- もしくは印刷PDF生成時の問題（pdf-generator.ts の縦書き処理）

**修正内容:**
1. `TextField.tsx` の縦書きスタイルを確認・修正:
   - `writing-mode: vertical-rl` + `text-orientation: upright` が必要
   ```tsx
   style={{
     writingMode: isVertical ? "vertical-rl" : undefined,
     textOrientation: isVertical ? "upright" : undefined,
   }}
   ```
2. `pdf-generator.ts` の縦書き描画を検証:
   - 1文字ずつの Y オフセット計算が正しいか
   - `getVerticalCharInfo` の補正値が適切か

---

### 3-4. 印刷時に何も表示されない問題（フォント404エラー）

**対象ファイル:**
- `src/lib/font-loader.ts`
- `src/app/api/fonts/[key]/route.ts`
- `scripts/upload-fonts.sh`

**現象:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
/api/fonts/NotoSansJP-Regular.ttf
フォント noto-sans-jp の読み込みに失敗: Error: フォント取得失敗: 404
```

**原因:**
- フォントファイルは `fonts/` ディレクトリにあるが、ローカルR2にアップロードされていない
- フォントAPIは R2 からフォントを取得する設計のため、R2にファイルがないと404

**修正方針（案B: R2にアップロードするスクリプトで対応）:**

1. **ローカル開発時の対応:**
   - `scripts/upload-fonts.sh` をローカルR2に実行:
     ```bash
     bash scripts/upload-fonts.sh
     ```
   - これにより `wrangler r2 object put ... --local` が実行され、ローカルR2にフォントが格納される

2. **本番環境の対応:**
   - デプロイ時に `--remote` フラグ付きで実行:
     ```bash
     bash scripts/upload-fonts.sh --remote
     ```

3. **フォールバック追加（推奨）:**
   - `api/fonts/[key]/route.ts` に、R2にフォントがない場合 `fonts/` ディレクトリから読み込むフォールバックを追加:
     ```typescript
     // R2 にない場合、ローカルファイルシステムから読み込み（開発用）
     if (!object) {
       // Node.js fs でフォールバック（開発環境のみ）
       // 本番では R2 にアップロード済みのはず
     }
     ```
   - ただし Cloudflare Workers 環境ではファイルシステムアクセスが制限されるため、
     代替案として `public/fonts/` にコピーして `fetch` でアクセスする方法も検討

**ユーザーへの案内:**
- フォントのR2アップロードが必要なことを README / MEMORY.md に明記

---

### 3-5. 印刷方式の改善（案C: 印刷 + PDFダウンロード 両方提供）

**対象ファイル:**
- `src/app/templates/[id]/print/page.tsx` — UIに「PDFダウンロード」ボタン追加
- `src/lib/print.ts` — 印刷処理の改善
- `src/lib/pdf-generator.ts` — PDF生成時に `@page` CSS 情報を含む

**修正内容:**

#### A. 「PDFをダウンロード」ボタン追加
```tsx
<div className="flex gap-2">
  <button onClick={handlePrint}>印刷する</button>
  <button onClick={handleDownloadPdf}>PDFをダウンロード</button>
</div>
```

`handleDownloadPdf`:
```typescript
const handleDownloadPdf = async () => {
  const pdfUrl = await generatePrintPdfUrl({ widthMm, heightMm, fields });
  const a = document.createElement("a");
  a.href = pdfUrl;
  a.download = `${template.name}_印刷用.pdf`;
  a.click();
  URL.revokeObjectURL(pdfUrl);
};
```

#### B. 印刷処理の改善
- 現在の `iframe.contentWindow?.print()` 方式に加えて:
  - 印刷ガイドに「余白: なし」「拡大/縮小: 100%」に設定するよう明記
  - `@page` CSS で `margin: 0` と用紙サイズを指定

#### C. 印刷ガイダンスの強化
- `PrintGuide` コンポーネントに以下を追記:
  - 「印刷ダイアログでの設定」セクション:
    - 余白: なし
    - 拡大/縮小: 100%（実際のサイズ）
    - 用紙サイズ: （テンプレートの設定値）mm
  - 「うまくいかない場合は『PDFをダウンロード』から Adobe Reader 等で印刷してください」

---

### 3-6. 「トップページ」リンク追加

**対象ファイル:**
- `src/app/templates/[id]/print/page.tsx` (L143-148)

**修正内容:**
- 「← 編集に戻る」の下に「← トップページ」リンクを追加

```tsx
<div className="flex flex-col items-start gap-1">
  <button onClick={() => router.push(`/templates/${templateId}/edit`)}>
    ← 編集に戻る
  </button>
  <button onClick={() => router.push("/")}>
    ← トップページ
  </button>
</div>
```

---

## フェーズ4: トップページ（`/`）

### 4-1. 複製機能の修正

**対象ファイル:**
- `src/components/TemplateCard.tsx` (L69-74)
- `src/hooks/useTemplates.ts`

**現象:**
- 「複製」をクリックしても何も起きない

**原因調査ポイント:**
1. `TemplateCard` の `onDuplicate(template.id)` は呼ばれているか（console.log で確認）
2. `useTemplates.duplicateTemplate` の `fetch` が成功しているか
3. API `POST /api/templates/:id/duplicate` のレスポンスを確認
4. `request.json()` — 空のbodyを送っているが、`{ name?: string }` として解析できるか
   - `request.json()` が空 body でエラーになっている可能性あり

**修正内容（可能性が高い修正）:**
- `duplicate/route.ts` L26: `const body = await request.json()` が空bodyでエラーになっている場合:
  ```typescript
  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    // bodyが空の場合は無視
  }
  ```
- `useTemplates.ts` L53: `body: JSON.stringify({})` — 空オブジェクトを送信しているが問題ないはず
  - ただし `Content-Type` が設定されているか確認

---

### 4-2. エクスポートで PDF 出力対応

**対象ファイル:**
- `src/components/ExportDialog.tsx` — エクスポート形式の選択UI
- `src/lib/pdf-generator.ts` — 既存の `generatePrintPdf` を流用

**修正内容:**

1. エクスポートダイアログに「エクスポート形式」のラジオボタンを追加:
   - JSON（現在の形式）
   - PDF（印刷用PDF）

2. JSON 選択時: 従来通りの動作

3. PDF 選択時:
   - テンプレートのフィールド情報を取得
   - `generatePrintPdf` でPDFを生成
   - ダウンロードリンクで `{テンプレート名}.pdf` としてダウンロード

4. フィールド情報の取得:
   - `ExportDialog` に `templateId` が渡されているので、`GET /api/templates/:id` からフィールドを取得
   - または親コンポーネントからフィールドデータを props で渡す

---

## フェーズ5: フォント問題の根本対策

### 5-1. フォントの R2 アップロード確認・フォールバック

**対象ファイル:**
- `scripts/upload-fonts.sh` （既存、変更なし）
- `src/app/api/fonts/[key]/route.ts` — フォールバック追加
- `README.md` — セットアップ手順に記載

**修正内容:**

1. ローカル開発時のセットアップ手順を明確化:
   ```bash
   # ローカル R2 にフォントをアップロード（初回のみ）
   bash scripts/upload-fonts.sh
   ```

2. フォント API にフォールバック追加（開発便宜のため）:
   - R2 にフォントがない場合、`fonts/` ディレクトリからの読み込みを試みる
   - Next.js dev モード（`npm run dev`）ではファイルシステムアクセスが可能なため

3. README のセットアップセクションにフォントアップロード手順を追記

---

## 修正の優先度と依存関係

```
フェーズ5 (フォント) ← 最優先：印刷機能の前提条件
  ↓
フェーズ1 (新規登録)
  ↓
フェーズ2 (編集画面) ← 2-6 を先に（他の修正にも影響）
  ↓
フェーズ3 (印刷プレビュー) ← フォント修正後に確認
  ↓
フェーズ4 (トップページ)
```

**推奨実装順:**
1. **5-1** フォントR2アップロード確認 → これで印刷のフォント問題が解決するか確認
2. **2-6** Canvas render エラー修正 + **2-8** PDF表示不具合修正（根本が同じ）
3. **1-2** 払込取扱票の名称・サイズ修正（即座に完了）
4. **2-1** ナビゲーションリンク変更（即座に完了）
5. **3-1, 3-6** チェックボックス位置・リンク追加（即座に完了）
6. **2-2** ラベル削除
7. **2-3** テキスト色選択（DB変更あり）
8. **1-3** カスタム用紙サイズ保存（DB変更あり）
9. **2-4** コピーボタン・設定引継ぎ
10. **2-5** スクロール＆フォーカス
11. **3-2, 3-3** プレビュー白枠・縦書き修正
12. **3-4, 3-5** 印刷改善・PDFダウンロード
13. **4-1** 複製機能修正
14. **4-2** エクスポートPDF対応
15. **2-7** 回転機能
16. **1-1** JPEG/PNG自動変換

---

## DB マイグレーション一覧

本計画で必要なDBスキーマ変更:

```sql
-- 1-3: カスタム用紙サイズテーブル
CREATE TABLE IF NOT EXISTS custom_paper_sizes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width_mm REAL NOT NULL,
  height_mm REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2-3: テキスト色カラム追加
ALTER TABLE text_fields ADD COLUMN color TEXT NOT NULL DEFAULT '#000000';
```

---

## チェックリスト

各タスク完了時に確認すべき項目:

- [ ] 1-1: JPEG/PNG をアップロードしてPDFに変換され、編集画面で表示される
- [ ] 1-2: プリセットに「ゆうちょ払込取扱票 (114×180mm)」が表示される
- [ ] 1-3: カスタムサイズで保存確認ダイアログが出る、保存後プリセットに表示される
- [ ] 2-1: 「← トップページ」と「← 1つ前に戻る」が表示・動作する
- [ ] 2-2: ラベル入力欄が非表示、ヘッダーにcontent先頭が表示される
- [ ] 2-3: 色選択ボタンが表示され、選択した色がPDF上・印刷PDFに反映される（デフォルト黒）
- [ ] 2-4: 「この設定でコピー」でフィールドが複製される、「フィールドを追加」で設定が引き継がれる
- [ ] 2-5: PDFクリック時に右パネルがスクロールしテキスト欄にフォーカスする
- [ ] 2-6: コンソールに canvas render エラーが出ない
- [ ] 2-7: 回転ボタンでPDF画像が回転し、フィールドも追従する
- [ ] 2-8: 印刷プレビューから戻ってもPDF画像が正しく表示される
- [ ] 3-1: チェックボックスがプレビュー白枠の上に配置されている
- [ ] 3-2: 白枠が用紙サイズ通りの大きさで表示される
- [ ] 3-3: 縦書きフィールドがプレビュー・印刷PDFでも縦書きで表示される
- [ ] 3-4: フォントが正しく読み込まれ、印刷時にテキストが表示される
- [ ] 3-5: 「PDFをダウンロード」ボタンでPDFがダウンロードできる
- [ ] 3-6: 「← トップページ」リンクが表示・動作する
- [ ] 4-1: 「複製」クリックでテンプレートが複製され一覧に表示される
- [ ] 4-2: エクスポートダイアログで「PDF」を選択しPDFがダウンロードされる
- [ ] 5-1: `/api/fonts/NotoSansJP-Regular.ttf` が200で返る
