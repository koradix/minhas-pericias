-- CreateTable
CREATE TABLE "ModeloBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "area" TEXT,
    "nomeArquivo" TEXT,
    "caminhoArq" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "totalUsos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
