CREATE TYPE "CategoriaComunidade" AS ENUM ('DUVIDA', 'IDEIA', 'DESABAFO', 'MATERIAL');

CREATE TABLE "ComunidadePost" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "categoria" "CategoriaComunidade" NOT NULL,
    "turma" TEXT,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComunidadePost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComunidadeComentario" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComunidadeComentario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComunidadeVoto" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunidadeVoto_pkey" PRIMARY KEY ("postId","userId")
);

CREATE TABLE "ComunidadeAnexo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunidadeAnexo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComunidadePost_createdAt_idx" ON "ComunidadePost"("createdAt");
CREATE INDEX "ComunidadePost_categoria_idx" ON "ComunidadePost"("categoria");
CREATE INDEX "ComunidadePost_userId_idx" ON "ComunidadePost"("userId");
CREATE INDEX "ComunidadePost_deletedAt_idx" ON "ComunidadePost"("deletedAt");

CREATE INDEX "ComunidadeComentario_postId_createdAt_idx" ON "ComunidadeComentario"("postId", "createdAt");
CREATE INDEX "ComunidadeComentario_userId_idx" ON "ComunidadeComentario"("userId");
CREATE INDEX "ComunidadeComentario_deletedAt_idx" ON "ComunidadeComentario"("deletedAt");

CREATE INDEX "ComunidadeVoto_userId_idx" ON "ComunidadeVoto"("userId");
CREATE INDEX "ComunidadeAnexo_postId_idx" ON "ComunidadeAnexo"("postId");

ALTER TABLE "ComunidadePost" ADD CONSTRAINT "ComunidadePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComunidadeComentario" ADD CONSTRAINT "ComunidadeComentario_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComunidadePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComunidadeComentario" ADD CONSTRAINT "ComunidadeComentario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComunidadeVoto" ADD CONSTRAINT "ComunidadeVoto_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComunidadePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComunidadeVoto" ADD CONSTRAINT "ComunidadeVoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComunidadeAnexo" ADD CONSTRAINT "ComunidadeAnexo_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComunidadePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
