import { CategoriaObservacao } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

type CreateRelatorioPayload = {
  alunoId?: string;
  periodo: string;
  texto: string;
  nomeCrianca?: string;
  contexto?: string;
  descricaoBase?: string;
  descricaoObservacao?: string;
  modeloIa?: string;
  registroIds?: string[];
};

type UpdateRelatorioPayload = {
  texto: string;
  nomeCrianca?: string;
  contexto?: string;
  periodo: string;
};

export class RelatorioRepository extends BaseRepository {
  private async assertAlunoOwnership(userId: string, alunoId: string) {
    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        turma: {
          userId,
        },
      },
      select: {
        id: true,
        nome: true,
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.assertFound(aluno, "Aluno nao encontrado");
  }

  async countByUserCurrentMonth(userId: string) {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    return prisma.avaliacao.count({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  async create(userId: string, payload: CreateRelatorioPayload) {
    return this.createWithOptionalObservation(userId, payload);
  }

  async createWithOptionalObservation(userId: string, payload: CreateRelatorioPayload) {
    const aluno = payload.alunoId ? await this.assertAlunoOwnership(userId, payload.alunoId) : null;

    return prisma.$transaction(async (tx) => {
      if (payload.descricaoObservacao && payload.alunoId) {
        await tx.observacao.create({
          data: {
            userId,
            alunoId: payload.alunoId,
            categoria: CategoriaObservacao.APRENDIZAGEM,
            texto: payload.descricaoObservacao,
            dataRegistro: new Date(),
          },
        });
      }

      const relatorio = await tx.avaliacao.create({
        data: {
          userId,
          alunoId: payload.alunoId ?? null,
          periodo: payload.periodo,
          texto: payload.texto,
          nomeCrianca: payload.nomeCrianca || aluno?.nome || null,
          contexto: payload.contexto || aluno?.turma.nome || null,
          descricaoBase: payload.descricaoBase || payload.descricaoObservacao || null,
          modeloIa: payload.modeloIa || null,
          registros: payload.registroIds?.length
            ? {
                create: payload.registroIds.map((registroId) => ({ registroId })),
              }
            : undefined,
        },
      });

      return {
        ...relatorio,
        descricaoObservacaoSalva: Boolean(payload.descricaoObservacao && payload.alunoId),
      };
    });
  }

  async listByAluno(userId: string, alunoId: string) {
    await this.assertAlunoOwnership(userId, alunoId);

    return prisma.avaliacao.findMany({
      where: {
        userId,
        alunoId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async listRecentByUser(userId: string, limit = 20) {
    return prisma.avaliacao.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            turma: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });
  }

  async findOwnedById(userId: string, relatorioId: string) {
    const relatorio = await prisma.avaliacao.findFirst({
      where: {
        id: relatorioId,
        userId,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            turma: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    return this.assertFound(relatorio, "Relatorio nao encontrado");
  }

  async deleteOwnedById(userId: string, relatorioId: string) {
    const relatorio = await this.findOwnedById(userId, relatorioId);

    return prisma.avaliacao.delete({
      where: {
        id: relatorio.id,
      },
    });
  }

  async updateOwnedById(userId: string, relatorioId: string, payload: UpdateRelatorioPayload) {
    const relatorio = await this.findOwnedById(userId, relatorioId);

    return prisma.avaliacao.update({
      where: {
        id: relatorio.id,
      },
      data: {
        texto: payload.texto,
        periodo: payload.periodo,
        nomeCrianca: payload.nomeCrianca?.trim() || null,
        contexto: payload.contexto?.trim() || null,
      },
    });
  }
}
