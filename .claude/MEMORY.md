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
- SSRでrouter.push()を呼ぶと`location is not defined`エラー→useEffect内で実行すること
- Better AuthのuseSession()はisPendingでローディング中を判定、!session && !isPendingで未ログイン判定
- pdf-libでフォント埋め込みするには`pdfDoc.registerFontkit(fontkit)`が必須
- Canvas描画の競合防止: startRenderToCanvas()で即座にcancel()を返すパターンを使用
- PaperCanvasのフィールド追加はonMouseDown（onClickだとTextFieldのstopPropagationが効かない）
- Next.js 16.xは@opennextjs/cloudflareと非互換（ComponentMod.handler is not a function）→15.x系を使用
- Windowsではwrangler deployで`resvg.wasm?module`エラー→wrangler最新版で解消
- WSLからのデプロイはnode_modulesのネイティブバイナリ不一致で失敗→Windows側で実行
- npm install時のEBUSYエラー→`taskkill /F /IM node.exe`でNodeプロセス停止後に実行
- R2アップロード時は`--remote`フラグ必須、出力の`Resource location: remote`を確認

## 作業履歴
- 2026-03-09: 開発計画策定→Phase 1〜5完了（基盤構築〜エクスポート/インポート・UX改善）
- 2026-03-09: ローカル環境構築・動作確認
- 2026-03-10: MODIFICATION_PLAN.md全タスク実装完了（UI改善・機能追加・バグ修正）
- 2026-03-10〜11: 動作確認フィードバック対応（2回分、多数のバグ修正・機能改善）
- 2026-03-11: 本番デプロイ完了（https://sakutto-inji.chiteijin315.workers.dev）
- 2026-03-23: ポートフォリオ用データ作成・移植完了

## ステータス
**開発完了・本番稼働中** — ポートフォリオへの掲載も完了
