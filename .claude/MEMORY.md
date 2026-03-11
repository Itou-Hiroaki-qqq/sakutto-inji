# さくっと印字（sakutto-inji）

## プロジェクト概要
記入用紙をスキャンしてPDFとして取り込み、画面上でテキスト配置位置を指定し、ブランクの実物用紙に直接印字できるWebアプリケーション。テンプレートの保存・再利用が可能。

## 技術スタック
- Next.js 15.5.12 (App Router) + Tailwind CSS v4
- 認証: Better Auth（built-in Kyselyアダプター、D1直接接続）
- DB: Cloudflare D1 + Drizzle ORM
- ストレージ: Cloudflare R2
- ホスティング: Cloudflare Workers（@opennextjs/cloudflare）
- PDF表示: pdfjs-dist v5.5 / PDF生成: pdf-lib
- フォント: Noto Sans JP / Noto Serif JP
- PC専用（スマホ対応なし）

## 設計上の注意点
- pdfjs-dist v5: render()にcanvasプロパティ必須
- API RoutesのJSON bodyは型アサーション必須（strict mode）
- pdf-libのUint8Array→BlobはBlobPart型キャスト必要
- CloudflareEnv型定義はenv.d.tsで管理
- Better Authのテーブル名は単数形+camelCase（user, session, account, verification）
- アプリ固有テーブル（templates, text_fields）はsnake_case
- Windows環境ではwrangler devの`resvg.wasm?module`エラーが出る→`next dev`を使用
- next.config.tsに`initOpenNextCloudflareForDev()`追加で`next dev`でもD1/R2利用可能
- `opennextjs-cloudflare`のCLIはサブコマンド必須（build, preview, deploy）
- .dev.varsのBETTER_AUTH_URLはdev時`http://localhost:3000`、本番時は本番URL

## 作業内容
- 2026-03-09: 開発計画書策定、レビュー完了、計画確定
- 2026-03-09: **Phase 1完了** - プロジェクト初期化・基盤構築
- 2026-03-09: **Phase 2完了** - PDF読み込み・テキスト配置のコア機能
- 2026-03-09: **Phase 3完了** - 印刷用PDF生成・印刷機能
- 2026-03-09: **Phase 4完了** - テンプレート一覧・管理
  - テンプレート複製API（/api/templates/[id]/duplicate）R2 PDFもコピー
  - TemplateCard（編集/印刷/複製/削除メニュー付き）
  - ConfirmDialog（削除確認ダイアログ）
  - useTemplatesフック（検索・並び替え・削除・複製）
  - ホーム画面をカード形式テンプレート一覧に改修
  - ビルド成功確認済み
- 2026-03-09: **Phase 5完了** - エクスポート/インポート・UX改善
  - エクスポートAPI（/api/templates/[id]/export）JSON+任意base64 PDF
  - インポートAPI（/api/templates/import）JSON復元+R2 PDF復元
  - ExportDialog / ImportDialog コンポーネント
  - TemplateCardにエクスポートメニュー追加
  - ホーム画面にインポートボタン追加
  - 縦書きテキスト改善: vertical-text.ts（句読点・小書き文字・長音記号の位置調整）
  - pdf-generator.tsがvertical-text.tsを使用するよう更新
  - キーボードショートカット: Delete（フィールド削除）、Ctrl+Z（アンドゥ最大30回）
  - useTextFieldsにundo stack追加
  - ビルド成功確認済み（全17ルート）

- 2026-03-09: **ローカル環境構築・動作確認**
  - Better Authテーブル名をデフォルト（単数形+camelCase）に修正
  - db/schema.sql・src/lib/schema.ts両方更新
  - package.jsonスクリプト修正（cf:build→build, cf:dev→wrangler dev）
  - next.config.tsにinitOpenNextCloudflareForDev()追加
  - .dev.vars設定、ローカルD1初期化、R2フォントアップロード完了
  - PWAアイコン（icon-192.png, icon-512.png）生成・配置
  - 新規登録・ログイン動作確認OK

- 2026-03-10: **MODIFICATION_PLAN.md全タスク実装完了**
  - 2-6: Canvas renderエラー修正（キャンセルパターン）+ pdfjs-dist SSR修正（動的インポート化）
  - 2-8: 編集画面PDF表示不具合修正
  - 1-2: 払込取扱票→ゆうちょ払込取扱票 114×180mm
  - 2-1: ナビゲーション「← トップページ」「← 1つ前に戻る」
  - 2-2: ラベルフィールド削除、ヘッダーにcontent表示
  - 2-3: テキスト色選択（8色、DB colorカラム追加）
  - 2-4: 「この設定でコピー」ボタン＋フィールド追加時の設定引継ぎ
  - 2-5: 新フィールド追加時のスクロール＆フォーカス
  - 2-7: PDF画像の回転機能（CSS transform、編集画面のみ）
  - 3-1: チェックボックスをプレビュー上部に移動
  - 3-2: プレビュー白枠にshrink-0追加
  - 3-3: 縦書きtext-orientation: upright追加
  - 3-5: 「PDFをダウンロード」ボタン追加
  - 3-6: 印刷プレビューに「← トップページ」追加
  - 4-1: 複製機能修正（request.json()のtry/catch）
  - 4-2: エクスポートPDF対応（JSON/PDF選択）
  - 1-1: JPEG/PNG→PDF自動変換（pdf-lib使用）
  - 1-3: カスタム用紙サイズ保存（custom_paper_sizesテーブル＋API）
  - エクスポート/インポートにcolorフィールド対応追加
  - TypeScriptビルドエラー修正（BlobPart型、RenderParameters型）
  - SSR `location is not defined`エラー修正（3ページ: print/edit/new）
    - render中のrouter.push→useEffect内に移動、sessionPending中はローディング表示

- 2026-03-10〜11: **動作確認フィードバック対応（2回分）**
  - fontkit登録修正（pdf-lib PDF出力が白紙だった問題）
  - Canvas renderレースコンディション修正（startRenderToCanvas即キャンセル可能に）
  - PDF背景の二重表示修正（canvas.width=0でクリア）
  - 用紙クリックでフィールド追加できない不具合修正（e.target!==e.currentTarget削除）
  - R2ストリーム→arrayBuffer()変換修正（duplicate 500エラー）
  - 複製機能をトップページ「...」メニューから削除
  - エクスポートダイアログのPDF含むチェックボックス位置修正
  - カスタム用紙サイズ削除機能追加（API + PaperSizeSelector UI）
  - フィールド個別回転機能（0/90/180/270°、DB field_rotationカラム、全API対応、PDF出力対応）
  - 新規フィールド追加時に前フィールドの回転設定を引き継ぎ
  - 印刷プレビュー画面リニューアル（「印刷する」ボタン削除→「PDFをダウンロード」のみ）
  - PrintGuide書き換え（5ステップ手動印刷ガイド + テスト印刷注記）
  - 用紙サイズ表示修正（A4/B5/A5は大文字名、はがき/払込取扱票はサイズ数値表示）
  - フィールドクリック/ドラッグ時の新規フィールド誤発生修正（onClick→onMouseDown）
  - 保存前の印刷プレビュー遷移防止（saved state管理）
  - ローカルDB field_rotationマイグレーション適用済み

## 設計上の注意点（追記）
- SSRでrouter.push()を呼ぶと`location is not defined`エラー→useEffect内で実行すること
- Better AuthのuseSession()はisPendingでローディング中を判定、!session && !isPendingで未ログイン判定
- pdf-libでフォント埋め込みするには`pdfDoc.registerFontkit(fontkit)`が必須
- Canvas描画の競合防止: startRenderToCanvas()で即座にcancel()を返すパターンを使用
- PaperCanvasのフィールド追加はonMouseDown（onClickだとTextFieldのstopPropagationが効かない）

- 2026-03-11: **本番デプロイ完了**
  - Cloudflare D1作成（sakutto-inji-db / id: a63f0745-9a0e-4ccc-a53b-0e1a4469b85d）
  - Cloudflare R2作成（sakutto-inji-r2）、フォント4ファイルアップロード済み
  - 本番DBスキーマ適用済み（field_rotation含む全テーブル）
  - BETTER_AUTH_SECRET、BETTER_AUTH_URL設定済み
  - Next.js 16→15.5.12にダウングレード（16.xは@opennextjs/cloudflare 1.17.1と非互換）
  - upload-fonts.shの--remoteフラグバグ修正
  - 本番URL: https://sakutto-inji.chiteijin315.workers.dev
  - ログイン動作確認OK

## 設計上の注意点（追記2）
- Next.js 16.xは@opennextjs/cloudflareと非互換（ComponentMod.handler is not a function）→15.x系を使用
- Windowsではwrangler deployで`resvg.wasm?module`エラー→wrangler最新版で解消
- WSLからのデプロイはnode_modulesのネイティブバイナリ不一致で失敗→Windows側で実行
- npm install時のEBUSYエラー→`taskkill /F /IM node.exe`でNodeプロセス停止後に実行
- R2アップロード時は`--remote`フラグ必須、出力の`Resource location: remote`を確認

## 次のステップ
- 実機テスト（実際のプリンターで印刷位置の確認）
- 必要に応じてカスタムドメイン設定
