#!/bin/bash
# ローカルD1データベースを初期化するスクリプト
# 使い方: bash scripts/init-local-db.sh

echo ">>> ローカルD1にスキーマを適用します"
npx wrangler d1 execute sakutto-inji-db --local --file db/schema.sql
echo "完了"
