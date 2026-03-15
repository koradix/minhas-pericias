-- CreateTable
CREATE TABLE "DocumentoGerado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "periciaNum" TEXT,
    "modeloId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerado',
    "conteudo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
