-- Better Auth が管理するテーブル（テーブル名・カラム名はBetter Authのデフォルト: camelCase）
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TEXT,
  "refreshTokenExpiresAt" TEXT,
  "scope" TEXT,
  "idToken" TEXT,
  "password" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- アプリ固有のテーブル
CREATE TABLE IF NOT EXISTS "templates" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "paper_width_mm" REAL NOT NULL,
  "paper_height_mm" REAL NOT NULL,
  "paper_preset" TEXT,
  "scan_pdf_key" TEXT,
  "print_settings_note" TEXT,
  "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
  "updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "text_fields" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "template_id" TEXT NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
  "label" TEXT,
  "content" TEXT NOT NULL DEFAULT '',
  "position_x_mm" REAL NOT NULL,
  "position_y_mm" REAL NOT NULL,
  "width_mm" REAL,
  "font_size" REAL NOT NULL DEFAULT 12,
  "font_family" TEXT NOT NULL DEFAULT 'noto-sans-jp',
  "direction" TEXT NOT NULL DEFAULT 'horizontal',
  "color" TEXT NOT NULL DEFAULT '#000000',
  "field_rotation" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
  "updated_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- カスタム用紙サイズ
CREATE TABLE IF NOT EXISTS "custom_paper_sizes" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "width_mm" REAL NOT NULL,
  "height_mm" REAL NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT (datetime('now'))
);
