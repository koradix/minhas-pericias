-- ============================================================
-- TURSO MIGRATIONS — aplicar via "turso db shell <db-name>"
-- ou no console Turso → SQL Editor
-- Execute bloco a bloco (cada CREATE/ALTER separado)
-- ============================================================

-- ── 1. Colunas faltando em RotaPericia ───────────────────────
ALTER TABLE "RotaPericia" ADD COLUMN "pericoId" TEXT;

-- ── 2. Colunas faltando em Checkpoint ────────────────────────
ALTER TABLE "Checkpoint" ADD COLUMN "pericoId" TEXT;
ALTER TABLE "Checkpoint" ADD COLUMN "tribunalSigla" TEXT;
ALTER TABLE "Checkpoint" ADD COLUMN "varaNome" TEXT;

-- ── 3. CheckpointMidia (câmera / evidências) ─────────────────
CREATE TABLE IF NOT EXISTS "CheckpointMidia" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "checkpointId" TEXT NOT NULL,
  "tipo"         TEXT NOT NULL,
  "url"          TEXT,
  "texto"        TEXT,
  "descricao"    TEXT,
  "criadoEm"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. VaraContato ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "VaraContato" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "peritoId"           TEXT NOT NULL,
  "tribunalSigla"      TEXT NOT NULL,
  "varaNome"           TEXT NOT NULL,
  "telefone"           TEXT,
  "email"              TEXT,
  "juizNome"           TEXT,
  "secretarioNome"     TEXT,
  "secretarioLinkedin" TEXT,
  "observacoes"        TEXT,
  "updatedAt"          DATETIME NOT NULL,
  "criadoEm"           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "VaraContato_peritoId_tribunalSigla_varaNome_key"
  ON "VaraContato"("peritoId", "tribunalSigla", "varaNome");

-- ── 5. Processo (DataJud) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Processo" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "numeroProcesso"   TEXT NOT NULL,
  "tribunal"         TEXT NOT NULL,
  "classe"           TEXT,
  "assunto"          TEXT,
  "orgaoJulgador"    TEXT,
  "dataDistribuicao" TEXT,
  "dataUltimaAtu"    TEXT,
  "partes"           TEXT NOT NULL DEFAULT '[]',
  "criadoEm"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm"     DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Processo_numeroProcesso_key"
  ON "Processo"("numeroProcesso");

-- ── 6. Nomeacao (DataJud) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Nomeacao" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "peritoId"     TEXT NOT NULL,
  "processoId"   TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'novo',
  "scoreMatch"   INTEGER NOT NULL DEFAULT 0,
  "criadoEm"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Nomeacao_peritoId_processoId_key"
  ON "Nomeacao"("peritoId", "processoId");

-- ── 7. Coluna tribunalVaraId em NomeacaoCitacao (se existir) ──
-- Execute só se a tabela NomeacaoCitacao já existir no seu Turso:
-- ALTER TABLE "NomeacaoCitacao" ADD COLUMN "tribunalVaraId" TEXT;

-- ── 8. Colunas de endereço em TribunalVara (se existir) ───────
-- Execute só se a tabela TribunalVara já existir no seu Turso:
-- ALTER TABLE "TribunalVara" ADD COLUMN "enderecoTexto" TEXT;
-- ALTER TABLE "TribunalVara" ADD COLUMN "latitude" REAL;
-- ALTER TABLE "TribunalVara" ADD COLUMN "longitude" REAL;
-- ALTER TABLE "TribunalVara" ADD COLUMN "sincronizadoEm" DATETIME;
