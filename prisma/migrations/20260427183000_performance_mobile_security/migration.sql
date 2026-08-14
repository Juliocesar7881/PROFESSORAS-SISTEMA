CREATE INDEX "ComunidadePost_deletedAt_createdAt_idx" ON "ComunidadePost"("deletedAt", "createdAt");
CREATE INDEX "ComunidadePost_categoria_deletedAt_createdAt_idx" ON "ComunidadePost"("categoria", "deletedAt", "createdAt");
CREATE INDEX "ComunidadeComentario_postId_deletedAt_createdAt_idx" ON "ComunidadeComentario"("postId", "deletedAt", "createdAt");
