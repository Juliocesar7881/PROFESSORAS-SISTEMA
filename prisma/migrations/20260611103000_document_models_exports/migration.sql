-- Add document-style fields to projects.
ALTER TABLE "Projeto"
ADD COLUMN "problema" TEXT,
ADD COLUMN "justificativa" TEXT,
ADD COLUMN "objetivoGeral" TEXT,
ADD COLUMN "objetivosEspecificos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "camposExperiencia" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "metodologia" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "cronograma" TEXT,
ADD COLUMN "avaliacao" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Add universal weekly-planning document metadata.
ALTER TABLE "Planejamento"
ADD COLUMN "projetoBaseId" TEXT,
ADD COLUMN "camposExperiencia" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "direitosAprendizagem" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "nomeInstituicao" TEXT,
ADD COLUMN "nomeProfessora" TEXT;

-- Allow planning rows to be either project activities or fully manual text.
ALTER TABLE "PlanejamentoAtividade"
ADD COLUMN "objetivosTexto" TEXT,
ADD COLUMN "atividadeTexto" TEXT;

ALTER TABLE "PlanejamentoAtividade"
DROP CONSTRAINT "PlanejamentoAtividade_atividadeId_fkey";

ALTER TABLE "PlanejamentoAtividade"
ALTER COLUMN "atividadeId" DROP NOT NULL;

ALTER TABLE "PlanejamentoAtividade"
ADD CONSTRAINT "PlanejamentoAtividade_atividadeId_fkey"
FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Planejamento_projetoBaseId_idx" ON "Planejamento"("projetoBaseId");

ALTER TABLE "Planejamento"
ADD CONSTRAINT "Planejamento_projetoBaseId_fkey"
FOREIGN KEY ("projetoBaseId") REFERENCES "Projeto"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
