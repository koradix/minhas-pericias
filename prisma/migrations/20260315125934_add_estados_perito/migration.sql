-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PeritoPerfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telefone" TEXT,
    "formacao" TEXT,
    "registro" TEXT,
    "especialidades" TEXT NOT NULL DEFAULT '[]',
    "cursos" TEXT NOT NULL DEFAULT '[]',
    "tribunais" TEXT NOT NULL DEFAULT '[]',
    "estados" TEXT NOT NULL DEFAULT '[]',
    "cidade" TEXT,
    "estado" TEXT,
    "areaAtuacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PeritoPerfil" ("areaAtuacao", "cidade", "createdAt", "cursos", "especialidades", "estado", "formacao", "id", "registro", "telefone", "tribunais", "updatedAt", "userId") SELECT "areaAtuacao", "cidade", "createdAt", "cursos", "especialidades", "estado", "formacao", "id", "registro", "telefone", "tribunais", "updatedAt", "userId" FROM "PeritoPerfil";
DROP TABLE "PeritoPerfil";
ALTER TABLE "new_PeritoPerfil" RENAME TO "PeritoPerfil";
CREATE UNIQUE INDEX "PeritoPerfil_userId_key" ON "PeritoPerfil"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
