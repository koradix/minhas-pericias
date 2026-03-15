-- CreateTable
CREATE TABLE "PeritoPerfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telefone" TEXT,
    "formacao" TEXT,
    "registro" TEXT,
    "especialidades" TEXT NOT NULL DEFAULT '[]',
    "cursos" TEXT NOT NULL DEFAULT '[]',
    "tribunais" TEXT NOT NULL DEFAULT '[]',
    "cidade" TEXT,
    "estado" TEXT,
    "areaAtuacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PeritoPerfil_userId_key" ON "PeritoPerfil"("userId");
