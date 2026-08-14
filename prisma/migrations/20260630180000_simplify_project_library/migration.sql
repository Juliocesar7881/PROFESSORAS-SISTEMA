-- Make AI evaluations independent from registered students while preserving legacy links.
ALTER TABLE "Avaliacao"
ADD COLUMN "userId" TEXT,
ADD COLUMN "nomeCrianca" TEXT,
ADD COLUMN "contexto" TEXT,
ADD COLUMN "descricaoBase" TEXT;

UPDATE "Avaliacao" AS a
SET
  "userId" = t."userId",
  "nomeCrianca" = al."nome",
  "contexto" = t."nome"
FROM "Aluno" AS al
JOIN "Turma" AS t ON t."id" = al."turmaId"
WHERE a."alunoId" = al."id";

ALTER TABLE "Avaliacao"
ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Avaliacao"
DROP CONSTRAINT "Avaliacao_alunoId_fkey";

ALTER TABLE "Avaliacao"
ALTER COLUMN "alunoId" DROP NOT NULL;

ALTER TABLE "Avaliacao"
ADD CONSTRAINT "Avaliacao_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Avaliacao"
ADD CONSTRAINT "Avaliacao_alunoId_fkey"
FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Avaliacao_userId_createdAt_idx" ON "Avaliacao"("userId", "createdAt");

-- Allow weekly planning without a registered class.
ALTER TABLE "Planejamento"
ADD COLUMN "grupoNome" TEXT;

UPDATE "Planejamento" AS p
SET "grupoNome" = t."nome"
FROM "Turma" AS t
WHERE p."turmaId" = t."id";

ALTER TABLE "Planejamento"
DROP CONSTRAINT "Planejamento_turmaId_fkey";

ALTER TABLE "Planejamento"
ALTER COLUMN "turmaId" DROP NOT NULL;

ALTER TABLE "Planejamento"
ADD CONSTRAINT "Planejamento_turmaId_fkey"
FOREIGN KEY ("turmaId") REFERENCES "Turma"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Planejamento_userId_semanaInicio_idx" ON "Planejamento"("userId", "semanaInicio");
