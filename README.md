# さくっと印字（sakutto-inji）

記入用紙をスキャンしてPDFとして取り込み、画面上でテキスト配置位置を指定し、ブランクの実物用紙に直接印字できるWebアプリケーション。

## 主な機能

- PDF/JPEG/PNGの用紙スキャン取り込み
- 画面上でのテキストフィールド配置（ドラッグ&ドロップ）
- フォント・サイズ・色・回転の個別設定
- 横書き/縦書き対応
- 印刷用PDF生成&ダウンロード
- テンプレートの保存・複製・エクスポート/インポート
- カスタム用紙サイズ対応（A4/B5/A5/はがき/払込取扱票 + ユーザー定義）
- ユーザー認証（新規登録/ログイン）

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + Tailwind CSS v4
- **認証**: Better Auth
- **DB**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2
- **ホスティング**: Cloudflare Workers (@opennextjs/cloudflare)
- **PDF表示**: pdfjs-dist v5
- **PDF生成**: pdf-lib + fontkit
- **フォント**: Noto Sans JP / Noto Serif JP

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.dev.vars.example`をコピーして`.dev.vars`を作成し、値を設定:

```bash
cp .dev.vars.example .dev.vars
```

### 3. ローカルDBの初期化

```bash
npx wrangler d1 execute sakutto-inji-db --local --file=db/schema.sql
```

### 4. フォントファイルの配置

`fonts/`ディレクトリに以下のファイルを配置:

- NotoSansJP-Regular.ttf
- NotoSansJP-Bold.ttf
- NotoSerifJP-Regular.ttf
- NotoSerifJP-Bold.ttf

フォントは[Google Fonts](https://fonts.google.com/noto)からダウンロードできます。

### 5. ローカルR2にフォントをアップロード

```bash
bash scripts/upload-fonts.sh
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 本番デプロイ

Cloudflare Workersにデプロイします。

```bash
# D1データベース作成
npx wrangler d1 create sakutto-inji-db

# スキーマ適用
npx wrangler d1 execute sakutto-inji-db --remote --file=db/schema.sql

# R2バケット作成&フォントアップロード
npx wrangler r2 bucket create sakutto-inji-r2
bash scripts/upload-fonts.sh --remote

# シークレット設定
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL

# ビルド&デプロイ
npx opennextjs-cloudflare build && npm run deploy
```

## ライセンス

Private
