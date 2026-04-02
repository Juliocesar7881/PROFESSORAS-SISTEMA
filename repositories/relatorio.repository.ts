import { endOfMonth, startOfMonth } from "date-fns";

import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

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
      },
    });

    this.assertFound(aluno, "Aluno nao encontrado");
  }

  async countByUserCurrentMonth(userId: string) {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    return prisma.avaliacao.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        aluno: {
          turma: {
            userId,
          },
        },
      },
    });
  }

  async create(userId: string, payload: { alunoId: string; periodo: string; texto: string }) {
    await this.assertAlunoOwnership(userId, payload.alunoId);

    return prisma.avaliacao.create({
      data: {
        alunoId: payload.alunoId,
        periodo: payload.periodo,
        texto: payload.texto,
      },
    });
  }

  async listByAluno(userId: string, alunoId: string) {
    await this.assertAlunoOwnership(userId, alunoId);

    return prisma.avaliacao.findMany({
      where: {
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
        aluno: {
          turma: {
            userId,
          },
        },
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
}
