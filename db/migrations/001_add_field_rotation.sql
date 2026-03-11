-- フィールド個別回転カラム追加
ALTER TABLE text_fields ADD COLUMN "field_rotation" INTEGER NOT NULL DEFAULT 0;
