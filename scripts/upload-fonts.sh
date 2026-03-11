#!/bin/bash
# R2バケットにフォントファイルをアップロードするスクリプト
# 使い方: bash scripts/upload-fonts.sh [--remote]
#
# 事前準備:
#   fonts/ ディレクトリに以下のファイルを配置してください
#   - NotoSansJP-Regular.ttf
#   - NotoSansJP-Bold.ttf
#   - NotoSerifJP-Regular.ttf
#   - NotoSerifJP-Bold.ttf
#
# フォントのダウンロード元:
#   https://fonts.google.com/noto/specimen/Noto+Sans+JP
#   https://fonts.google.com/noto/specimen/Noto+Serif+JP

FONT_DIR="./fonts"
BUCKET="sakutto-inji-r2"

# --remote フラグがあれば本番R2に、なければローカルR2にアップロード
if [ "$1" = "--remote" ]; then
  LOCAL_FLAG="--remote"
  echo ">>> 本番R2バケットにアップロードします"
else
  LOCAL_FLAG="--local"
  echo ">>> ローカルR2にアップロードします"
fi

FONTS=(
  "NotoSansJP-Regular.ttf"
  "NotoSansJP-Bold.ttf"
  "NotoSerifJP-Regular.ttf"
  "NotoSerifJP-Bold.ttf"
)

for font in "${FONTS[@]}"; do
  if [ -f "$FONT_DIR/$font" ]; then
    echo "アップロード中: $font"
    npx wrangler r2 object put "$BUCKET/fonts/$font" --file "$FONT_DIR/$font" $LOCAL_FLAG
  else
    echo "スキップ（ファイルなし）: $FONT_DIR/$font"
  fi
done

echo "完了"
