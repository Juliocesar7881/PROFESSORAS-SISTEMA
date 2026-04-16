-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjetoSalvo_projetoId_idx" ON "ProjetoSalvo"("projetoId");

-- DropIndex
DROP INDEX IF EXISTS "Session_sessionToken_key";