CREATE TYPE "StatusFotoObservacao" AS ENUM ('PENDENTE', 'PRONTA', 'FALHOU');

ALTER TABLE "FotoObservacao"
ADD COLUMN "clientUploadId" TEXT,
ADD COLUMN "status" "StatusFotoObservacao" NOT NULL DEFAULT 'PRONTA',
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "tamanhoBytes" INTEGER,
ADD COLUMN "erroCodigo" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "FotoObservacao_observacaoId_clientUploadId_key"
ON "FotoObservacao"("observacaoId", "clientUploadId");

CREATE INDEX "FotoObservacao_status_updatedAt_idx"
ON "FotoObservacao"("status", "updatedAt");

CREATE INDEX "FotoObservacao_deletedAt_idx"
ON "FotoObservacao"("deletedAt");
