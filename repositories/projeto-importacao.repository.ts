import type { ConfirmarImportacaoProjetoInput, ProjetoImportadoDraft } from "@/dtos/projeto.dto";
import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export class ProjetoImportacaoRepository extends BaseRepository {
  async create(userId: string, file: { storageKey: string; fileName: string; mimeType: string; size: number }) {
    return prisma.projetoImportacao.create({
      data: {
        userId,
        storageKey: file.storageKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async markReady(userId: string, id: string, data: ProjetoImportadoDraft) {
    return prisma.projetoImportacao.updateMany({
      where: { id, userId, status: "PROCESSANDO" },
      data: { status: "PRONTO", dadosExtraidos: data, erro: null },
    });
  }

  async markFailed(userId: string, id: string, error: string) {
    return prisma.projetoImportacao.updateMany({
      where: { id, userId },
      data: { status: "FALHOU", erro: error.slice(0, 1000) },
    });
  }

  async findOwned(userId: string, id: string) {
    const item = await prisma.projetoImportacao.findFirst({ where: { id, userId } });
    return this.assertFound(item, "Importacao nao encontrada");
  }

  async confirm(userId: string, payload: ConfirmarImportacaoProjetoInput) {
    return prisma.$transaction(async (tx) => {
      const importacao = await tx.projetoImportacao.findFirst({
        where: { id: payload.importacaoId, userId, status: "PRONTO", projetoId: null },
      });
      this.assertFound(importacao, "Importacao nao encontrada ou ja confirmada");
      const ownedImportacao = importacao!;

      const projeto = await tx.projeto.create({
        data: {
          ownerId: userId,
          origem: "IMPORTADO",
          titulo: payload.titulo,
          descricao: payload.descricao,
          categoria: payload.categoria,
          faixaEtaria: payload.faixaEtaria,
          duracao: payload.duracao,
          bnccObjetivos: payload.bnccObjetivos,
          problema: payload.problema || null,
          justificativa: payload.justificativa || null,
          objetivoGeral: payload.objetivoGeral || null,
          objetivosEspecificos: payload.objetivosEspecificos,
          camposExperiencia: payload.camposExperiencia,
          metodologia: payload.metodologia,
          cronograma: payload.cronograma || null,
          avaliacao: payload.avaliacao,
          premium: false,
          atividades: {
            create: payload.atividades.map((atividade, ordem) => ({
              titulo: atividade.titulo,
              descricao: atividade.descricao,
              objetivoTexto: atividade.objetivoTexto || null,
              categoria: payload.categoria,
              duracao: 0,
              materiais: atividade.materiais,
              bnccCodigos: [],
              ordem,
            })),
          },
        },
        include: { atividades: { orderBy: { ordem: "asc" } } },
      });

      await tx.projetoImportacao.update({
        where: { id: ownedImportacao.id },
        data: {
          status: "CONFIRMADO",
          projetoId: projeto.id,
          dadosExtraidos: payload,
          expiresAt: null,
        },
      });

      return projeto;
    });
  }
}
