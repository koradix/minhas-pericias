-- CreateTable
CREATE TABLE "DemandaParceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "prazo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandaId" TEXT NOT NULL,
    "demandaTitulo" TEXT NOT NULL,
    "peritoId" TEXT NOT NULL,
    "peritoNome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enviada',
    "mensagem" TEXT,
    "valorProposto" REAL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
