-- Migration: add_template_fields
-- Run against Turso via: turso db shell <db-name> < prisma/migrations/add_template_fields.sql
--
-- Adds new columns to ModeloBase for the document intelligence layer.
-- All columns are nullable / have defaults so existing rows are unaffected.

ALTER TABLE "ModeloBase" ADD COLUMN "especialidade"    TEXT;
ALTER TABLE "ModeloBase" ADD COLUMN "subEspecialidade" TEXT;
ALTER TABLE "ModeloBase" ADD COLUMN "uploadedById"     TEXT;
ALTER TABLE "ModeloBase" ADD COLUMN "versao"           INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ModeloBase" ADD COLUMN "versaoPaiId"      TEXT;
ALTER TABLE "ModeloBase" ADD COLUMN "isActive"         INTEGER NOT NULL DEFAULT 1;   -- SQLite boolean
ALTER TABLE "ModeloBase" ADD COLUMN "preferido"        INTEGER NOT NULL DEFAULT 0;   -- SQLite boolean
ALTER TABLE "ModeloBase" ADD COLUMN "mimeType"         TEXT;
ALTER TABLE "ModeloBase" ADD COLUMN "tamanhoBytes"     INTEGER;
ALTER TABLE "ModeloBase" ADD COLUMN "textoExtraido"    TEXT;
ALTER TABLE "ModeloBase" ADD COLUMN "tokenCount"       INTEGER;
ALTER TABLE "ModeloBase" ADD COLUMN "processadoEm"     DATETIME;

-- Optional index for fast lookup by tipo + isActive (used by getTemplatePreferido)
CREATE INDEX IF NOT EXISTS "ModeloBase_tipo_isActive_idx" ON "ModeloBase"("tipo", "isActive");

-- Optional index for version chain lookup
CREATE INDEX IF NOT EXISTS "ModeloBase_versaoPaiId_idx" ON "ModeloBase"("versaoPaiId");
