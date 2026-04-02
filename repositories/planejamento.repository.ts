import { addDays, startOfDay } from "date-fns";

import type { CreatePlanejamentoInput } from "@/dtos/planejamento.dto";
import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export class PlanejamentoRepository extends BaseRepository {
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

  async countByUser(userId: string) {
    return prisma.planejamento.count({
      where: {
        userId,
      },
    });
  }

  async existsByUserTurmaAndWeek(userId: string, turmaId: string, semanaInicio: Date) {
    const existing = await prisma.planejamento.findUnique({
      where: {
        userId_turmaId_semanaInicio: {
          userId,
          turmaId,
          semanaInicio: startOfDay(semanaInicio),
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(existing);
  }

  async create(userId: string, data: CreatePlanejamentoInput) {
    await this.assertTurmaOwnership(userId, data.turmaId);

    const weekStart = startOfDay(data.semanaInicio);
    const weekEnd = startOfDay(data.semanaFim);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.planejamento.findUnique({
        where: {
          userId_turmaId_semanaInicio: {
            userId,
            turmaId: data.turmaId,
            semanaInicio: weekStart,
          },
        },
        select: {
          id: true,
        },
      });

      const planejamentoId = existing
        ? (
            await tx.planejamento.update({
              where: {
                id: existing.id,
              },
              data: {
                semanaFim: weekEnd,
              },
              select: {
                id: true,
              },
            })
          ).id
        : (
            await tx.planejamento.create({
              data: {
                userId,
                turmaId: data.turmaId,
                semanaInicio: weekStart,
                semanaFim: weekEnd,
              },
              select: {
                id: true,
              },
            })
          ).id;

      await tx.planejamentoAtividade.deleteMany({
        where: {
          planejamentoId,
        },
      });

      await tx.planejamentoAtividade.createMany({
        data: data.atividades.map((item) => ({
          planejamentoId,
          atividadeId: item.atividadeId,
          diaSemana: item.diaSemana,
          horario: item.horario,
        })),
      });

      return tx.planejamento.findUnique({
        where: { id: planejamentoId },
        include: {
          atividades: {
            include: {
              atividade: true,
            },
          },
          turma: true,
        },
      });
    });
  }

  async listByUser(userId: string, turmaId?: string, semanaInicio?: Date) {
    return prisma.planejamento.findMany({
      where: {
        userId,
        ...(turmaId ? { turmaId } : {}),
        ...(semanaInicio ? { semanaInicio: startOfDay(semanaInicio) } : {}),
      },
      orderBy: {
        semanaInicio: "desc",
      },
      include: {
        turma: true,
        atividades: {
          include: {
            atividade: true,
          },
          orderBy: [{ diaSemana: "asc" }, { horario: "asc" }],
        },
      },
    });
  }

  async weeklyStreak(userId: string) {
    const planejamentos = await prisma.planejamento.findMany({
      where: { userId },
      select: {
        semanaInicio: true,
      },
      orderBy: {
        semanaInicio: "desc",
      },
    });

    if (!planejamentos.length) {
      return 0;
    }

    let streak = 1;
    let current = startOfDay(planejamentos[0].semanaInicio);

    for (let i = 1; i < planejamentos.length; i += 1) {
      const next = startOfDay(planejamentos[i].semanaInicio);
      const expected = addDays(current, -7);

      if (next.getTime() === expected.getTime()) {
        streak += 1;
        current = next;
      } else {
        break;
      }
    }

    return streak;
  }
}
