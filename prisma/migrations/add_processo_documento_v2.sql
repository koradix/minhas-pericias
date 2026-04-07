-- Migration: add chaveV2 to ProcessoDocumento, make escavadorDocId optional
-- Run: apply via Supabase SQL editor or psql

-- 1. Make escavadorDocId nullable
ALTER TABLE "ProcessoDocumento" ALTER COLUMN "escavadorDocId" DROP NOT NULL;

-- 2. Add chaveV2 column
ALTER TABLE "ProcessoDocumento" ADD COLUMN IF NOT EXISTS "chaveV2" TEXT;

-- 3. Add unique constraint for (processoId, chaveV2) — partial, excludes NULLs automatically in Postgres
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessoDocumento_processoId_chaveV2_key"
  ON "ProcessoDocumento" ("processoId", "chaveV2")
  WHERE "chaveV2" IS NOT NULL;
