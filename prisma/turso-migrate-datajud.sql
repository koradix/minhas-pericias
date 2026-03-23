-- Migration: add_datajud_nomeacoes
-- Apply via: turso db shell <db-name> < prisma/turso-migrate-datajud.sql
-- Or via Turso console (Execute SQL tab)

CREATE TABLE IF NOT EXISTS "Processo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "numeroProcesso" TEXT NOT NULL,
  "tribunal" TEXT NOT NULL,
  "classe" TEXT,
  "assunto" TEXT,
  "orgaoJulgador" TEXT,
  "dataDistribuicao" TEXT,
  "dataUltimaAtu" TEXT,
  "partes" TEXT NOT NULL DEFAULT '[]',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Processo_numeroProcesso_key" ON "Processo"("numeroProcesso");

CREATE TABLE IF NOT EXISTS "Nomeacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "peritoId" TEXT NOT NULL,
  "processoId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'novo',
  "scoreMatch" INTEGER NOT NULL DEFAULT 0,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Nomeacao_peritoId_processoId_key" ON "Nomeacao"("peritoId", "processoId");
