import { endOfMonth, startOfDay, startOfMonth } from "date-fns";

import type { CreateChamadaInput } from "@/dtos/chamada.dto";
import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export class ChamadaRepository extends BaseRepository {
  private async assertTurmaOwnership(userId: string, turmaId: string) {
    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        userId,
      },
      select: {
        id: true,
      },
    });

    this.assertFound(turma, "Turma nao encontrada");
  }

  async save(userId: string, payload: CreateChamadaInput) {
    await this.assertTurmaOwnership(userId, payload.turmaId);

    const attendanceDate = startOfDay(payload.data);

    return prisma.$transaction(async (tx) => {
      const chamada = await tx.chamada.upsert({
        where: {
          turmaId_data: {
            turmaId: payload.turmaId,
            data: attendanceDate,
          },
        },
        create: {
          turmaId: payload.turmaId,
          data: attendanceDate,
        },
        update: {},
      });

      await tx.presenca.deleteMany({
        where: {
          chamadaId: chamada.id,
        },
      });

      await tx.presenca.createMany({
        data: payload.presencas.map((item) => ({
          chamadaId: chamada.id,
          alunoId: item.alunoId,
          presente: item.presente,
          justificativa: item.justificativa,
        })),
      });

      return tx.chamada.findUnique({
        where: {
          id: chamada.id,
        },
        include: {
          presencas: {
            include: {
              aluno: true,
            },
          },
        },
      });
    });
  }

  async listByMonth(userId: string, turmaId: string, mes: number, ano: number) {
    await this.assertTurmaOwnership(userId, turmaId);

    const start = startOfMonth(new Date(ano, mes - 1, 1));
    const end = endOfMonth(start);

    return prisma.chamada.findMany({
      where: {
        turmaId,
        data: {
          gte: start,
          lte: end,
        },
      },
      include: {
        presencas: {
          include: {
            aluno: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
    });
  }

  async absenceRateByAluno(userId: string, turmaId: string, mes: number, ano: number) {
    const chamadas = await this.listByMonth(userId, turmaId, mes, ano);
    const counters = new Map<string, { nome: string; total: number; faltas: number }>();

    chamadas.forEach((chamada) => {
      chamada.presencas.forEach((presenca) => {
        const previous = counters.get(presenca.alunoId) ?? {
          nome: presenca.aluno.nome,
          total: 0,
          faltas: 0,
        };

        previous.total += 1;

        if (!presenca.presente) {
          previous.faltas += 1;
        }

        counters.set(presenca.alunoId, previous);
      });
    });

    return Array.from(counters.entries()).map(([alunoId, value]) => ({
      alunoId,
      nome: value.nome,
      taxaFalta: value.total === 0 ? 0 : value.faltas / value.total,
      totalAulas: value.total,
    }));
  }
}
