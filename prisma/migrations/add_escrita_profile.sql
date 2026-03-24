-- Migration: add_escrita_profile
-- Run against Turso via: turso db shell <db-name> < prisma/migrations/add_escrita_profile.sql
--
-- Creates the PeritoEscritaProfile table for personalized AI document drafting.

CREATE TABLE IF NOT EXISTS "PeritoEscritaProfile" (
  "id"                TEXT     NOT NULL PRIMARY KEY,
  "userId"            TEXT     NOT NULL UNIQUE,
  "tom"               TEXT     NOT NULL DEFAULT 'formal',
  "estruturaLaudo"    TEXT     NOT NULL DEFAULT '[]',
  "estruturaProposta" TEXT     NOT NULL DEFAULT '[]',
  "templatesFavoritos" TEXT    NOT NULL DEFAULT '[]',
  "expressoes"        TEXT     NOT NULL DEFAULT '[]',
  "palavrasEvitar"    TEXT     NOT NULL DEFAULT '[]',
  "abreviaturas"      TEXT     NOT NULL DEFAULT '[]',
  "estiloConc"        TEXT     NOT NULL DEFAULT '',
  "formulaFecho"      TEXT     NOT NULL DEFAULT '',
  "notasIA"           TEXT     NOT NULL DEFAULT '',
  "contextoRegional"  TEXT     NOT NULL DEFAULT '',
  "criadoEm"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm"      DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "PeritoEscritaProfile_userId_idx" ON "PeritoEscritaProfile"("userId");
