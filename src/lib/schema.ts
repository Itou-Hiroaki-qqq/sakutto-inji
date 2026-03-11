import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// --- Better Auth テーブル（テーブル名・カラム名はBetter Authデフォルト: camelCase）---

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: text("createdAt").notNull().default("datetime('now')"),
  updatedAt: text("updatedAt").notNull().default("datetime('now')"),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: text("createdAt").notNull().default("datetime('now')"),
  updatedAt: text("updatedAt").notNull().default("datetime('now')"),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: text("accessTokenExpiresAt"),
  refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: text("createdAt").notNull().default("datetime('now')"),
  updatedAt: text("updatedAt").notNull().default("datetime('now')"),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").notNull().default("datetime('now')"),
  updatedAt: text("updatedAt").notNull().default("datetime('now')"),
});

// --- アプリ固有テーブル ---

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  paperWidthMm: real("paper_width_mm").notNull(),
  paperHeightMm: real("paper_height_mm").notNull(),
  paperPreset: text("paper_preset"),
  scanPdfKey: text("scan_pdf_key"),
  printSettingsNote: text("print_settings_note"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
  updatedAt: text("updated_at").notNull().default("datetime('now')"),
});

export const textFields = sqliteTable("text_fields", {
  id: text("id").primaryKey(),
  templateId: text("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  label: text("label"),
  content: text("content").notNull().default(""),
  positionXMm: real("position_x_mm").notNull(),
  positionYMm: real("position_y_mm").notNull(),
  widthMm: real("width_mm"),
  fontSize: real("font_size").notNull().default(12),
  fontFamily: text("font_family").notNull().default("noto-sans-jp"),
  direction: text("direction").notNull().default("horizontal"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("datetime('now')"),
  updatedAt: text("updated_at").notNull().default("datetime('now')"),
});
