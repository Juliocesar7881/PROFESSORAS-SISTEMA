CREATE TYPE "OrigemProjeto" AS ENUM ('CATALOGO', 'IMPORTADO');
CREATE TYPE "StatusImportacaoProjeto" AS ENUM ('PROCESSANDO', 'PRONTO', 'FALHOU', 'CONFIRMADO');

ALTER TABLE "Turma"
ALTER COLUMN "faixaEtaria" DROP NOT NULL,
ALTER COLUMN "ano" DROP NOT NULL,
ADD COLUMN "turno" TEXT,
ADD COLUMN "instituicao" TEXT;

ALTER TABLE "Aluno"
ALTER COLUMN "dataNasc" DROP NOT NULL,
ADD COLUMN "contexto" TEXT,
ADD COLUMN "userId" TEXT;

UPDATE "Aluno" AS aluno
SET "userId" = turma."userId"
FROM "Turma" AS turma
WHERE aluno."turmaId" = turma."id";

ALTER TABLE "Aluno" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Aluno"
ADD CONSTRAINT "Aluno_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Aluno_userId_nome_idx" ON "Aluno"("userId", "nome");

ALTER TABLE "Observacao"
ADD COLUMN "userId" TEXT,
ADD COLUMN "dataRegistro" DATE,
ADD COLUMN "clientMutationId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Observacao" AS registro
SET
  "userId" = aluno."userId",
  "dataRegistro" = registro."createdAt"::date
FROM "Aluno" AS aluno
WHERE registro."alunoId" = aluno."id";

ALTER TABLE "Observacao"
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "dataRegistro" SET NOT NULL;

ALTER TABLE "Observacao"
ADD CONSTRAINT "Observacao_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Observacao_userId_dataRegistro_createdAt_idx"
ON "Observacao"("userId", "dataRegistro", "createdAt");
CREATE INDEX "Observacao_userId_deletedAt_idx" ON "Observacao"("userId", "deletedAt");
CREATE UNIQUE INDEX "Observacao_userId_clientMutationId_key"
ON "Observacao"("userId", "clientMutationId");

ALTER TABLE "FotoObservacao"
ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "AvaliacaoRegistro" (
  "avaliacaoId" TEXT NOT NULL,
  "registroId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvaliacaoRegistro_pkey" PRIMARY KEY ("avaliacaoId", "registroId")
);

CREATE INDEX "AvaliacaoRegistro_registroId_idx" ON "AvaliacaoRegistro"("registroId");
ALTER TABLE "AvaliacaoRegistro"
ADD CONSTRAINT "AvaliacaoRegistro_avaliacaoId_fkey"
FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvaliacaoRegistro"
ADD CONSTRAINT "AvaliacaoRegistro_registroId_fkey"
FOREIGN KEY ("registroId") REFERENCES "Observacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Projeto"
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "origem" "OrigemProjeto" NOT NULL DEFAULT 'CATALOGO';

CREATE INDEX "Projeto_ownerId_origem_idx" ON "Projeto"("ownerId", "origem");
ALTER TABLE "Projeto"
ADD CONSTRAINT "Projeto_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjetoImportacao" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projetoId" TEXT,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "status" "StatusImportacaoProjeto" NOT NULL DEFAULT 'PROCESSANDO',
  "dadosExtraidos" JSONB,
  "erro" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjetoImportacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjetoImportacao_projetoId_key" ON "ProjetoImportacao"("projetoId");
CREATE INDEX "ProjetoImportacao_userId_createdAt_idx" ON "ProjetoImportacao"("userId", "createdAt");
CREATE INDEX "ProjetoImportacao_status_expiresAt_idx" ON "ProjetoImportacao"("status", "expiresAt");
ALTER TABLE "ProjetoImportacao"
ADD CONSTRAINT "ProjetoImportacao_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjetoImportacao"
ADD CONSTRAINT "ProjetoImportacao_projetoId_fkey"
FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Atividade"
ADD COLUMN "objetivoTexto" TEXT,
ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "projetoId" ORDER BY "createdAt", "id") - 1 AS position
  FROM "Atividade"
)
UPDATE "Atividade" AS atividade
SET "ordem" = ordered.position
FROM ordered
WHERE atividade."id" = ordered."id";

ALTER TABLE "PlanejamentoAtividade"
ALTER COLUMN "horario" DROP NOT NULL,
ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "planejamentoId", "diaSemana" ORDER BY "horario", "id") - 1 AS position
  FROM "PlanejamentoAtividade"
)
UPDATE "PlanejamentoAtividade" AS item
SET "ordem" = ordered.position
FROM ordered
WHERE item."id" = ordered."id";

CREATE TABLE "MobileSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "deviceName" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileSession_tokenHash_key" ON "MobileSession"("tokenHash");
CREATE INDEX "MobileSession_userId_revokedAt_idx" ON "MobileSession"("userId", "revokedAt");
CREATE INDEX "MobileSession_expiresAt_idx" ON "MobileSession"("expiresAt");
ALTER TABLE "MobileSession"
ADD CONSTRAINT "MobileSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MobileLoginCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileLoginCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileLoginCode_codeHash_key" ON "MobileLoginCode"("codeHash");
CREATE INDEX "MobileLoginCode_expiresAt_usedAt_idx" ON "MobileLoginCode"("expiresAt", "usedAt");
ALTER TABLE "MobileLoginCode"
ADD CONSTRAINT "MobileLoginCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
