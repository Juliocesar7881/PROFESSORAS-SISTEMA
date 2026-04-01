-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('GRATUITO', 'PRO');

-- CreateEnum
CREATE TYPE "CategoriaObservacao" AS ENUM ('APRENDIZAGEM', 'LINGUAGEM', 'SOCIAL', 'MOTOR', 'CRIATIVIDADE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "plano" "Plano" NOT NULL DEFAULT 'GRATUITO',
    "stripeId" TEXT,
    "stripeSubId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "faixaEtaria" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNasc" TIMESTAMP(3) NOT NULL,
    "fotoKey" TEXT,
    "deletedAt" TIMESTAMP(3),
    "turmaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observacao" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "categoria" "CategoriaObservacao" NOT NULL,
    "alunoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoObservacao" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "observacaoId" TEXT NOT NULL,

    CONSTRAINT "FotoObservacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "faixaEtaria" TEXT NOT NULL,
    "duracao" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "bnccObjetivos" TEXT[],
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "duracao" INTEGER NOT NULL,
    "materiais" TEXT[],
    "bnccCodigos" TEXT[],
    "projetoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planejamento" (
    "id" TEXT NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "semanaFim" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planejamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanejamentoAtividade" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horario" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "planejamentoId" TEXT NOT NULL,

    CONSTRAINT "PlanejamentoAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoSalvo" (
    "userId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetoSalvo_pkey" PRIMARY KEY ("userId","projetoId")
);

-- CreateTable
CREATE TABLE "Chamada" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "turmaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chamada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "justificativa" TEXT,
    "alunoId" TEXT NOT NULL,
    "chamadaId" TEXT NOT NULL,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeId_key" ON "User"("stripeId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Turma_userId_idx" ON "Turma"("userId");

-- CreateIndex
CREATE INDEX "Turma_deletedAt_idx" ON "Turma"("deletedAt");

-- CreateIndex
CREATE INDEX "Aluno_turmaId_idx" ON "Aluno"("turmaId");

-- CreateIndex
CREATE INDEX "Aluno_deletedAt_idx" ON "Aluno"("deletedAt");

-- CreateIndex
CREATE INDEX "Observacao_alunoId_createdAt_idx" ON "Observacao"("alunoId", "createdAt");

-- CreateIndex
CREATE INDEX "FotoObservacao_observacaoId_idx" ON "FotoObservacao"("observacaoId");

-- CreateIndex
CREATE INDEX "Avaliacao_alunoId_createdAt_idx" ON "Avaliacao"("alunoId", "createdAt");

-- CreateIndex
CREATE INDEX "Projeto_categoria_idx" ON "Projeto"("categoria");

-- CreateIndex
CREATE INDEX "Projeto_premium_idx" ON "Projeto"("premium");

-- CreateIndex
CREATE INDEX "Atividade_projetoId_idx" ON "Atividade"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "Planejamento_shareToken_key" ON "Planejamento"("shareToken");

-- CreateIndex
CREATE INDEX "Planejamento_userId_idx" ON "Planejamento"("userId");

-- CreateIndex
CREATE INDEX "Planejamento_turmaId_idx" ON "Planejamento"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "Planejamento_userId_turmaId_semanaInicio_key" ON "Planejamento"("userId", "turmaId", "semanaInicio");

-- CreateIndex
CREATE INDEX "PlanejamentoAtividade_planejamentoId_idx" ON "PlanejamentoAtividade"("planejamentoId");

-- CreateIndex
CREATE INDEX "PlanejamentoAtividade_atividadeId_idx" ON "PlanejamentoAtividade"("atividadeId");

-- CreateIndex
CREATE INDEX "Chamada_turmaId_idx" ON "Chamada"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "Chamada_turmaId_data_key" ON "Chamada"("turmaId", "data");

-- CreateIndex
CREATE INDEX "Presenca_chamadaId_idx" ON "Presenca"("chamadaId");

-- CreateIndex
CREATE UNIQUE INDEX "Presenca_alunoId_chamadaId_key" ON "Presenca"("alunoId", "chamadaId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_processedAt_idx" ON "StripeWebhookEvent"("processedAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observacao" ADD CONSTRAINT "Observacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoObservacao" ADD CONSTRAINT "FotoObservacao_observacaoId_fkey" FOREIGN KEY ("observacaoId") REFERENCES "Observacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planejamento" ADD CONSTRAINT "Planejamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planejamento" ADD CONSTRAINT "Planejamento_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanejamentoAtividade" ADD CONSTRAINT "PlanejamentoAtividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanejamentoAtividade" ADD CONSTRAINT "PlanejamentoAtividade_planejamentoId_fkey" FOREIGN KEY ("planejamentoId") REFERENCES "Planejamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoSalvo" ADD CONSTRAINT "ProjetoSalvo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoSalvo" ADD CONSTRAINT "ProjetoSalvo_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamada" ADD CONSTRAINT "Chamada_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_chamadaId_fkey" FOREIGN KEY ("chamadaId") REFERENCES "Chamada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
