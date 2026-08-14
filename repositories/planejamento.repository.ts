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

  private async assertProjetoBase(userId: string, projetoBaseId?: string | null) {
    if (!projetoBaseId) {
      return;
    }

    const projeto = await prisma.projeto.findFirst({
      where: {
        id: projetoBaseId,
        OR: [{ ownerId: null, origem: "CATALOGO" }, { ownerId: userId, origem: "IMPORTADO" }],
      },
      select: {
        id: true,
      },
    });

    this.assertFound(projeto, "Projeto base nao encontrado");
  }

  async countByUser(userId: string) {
    return prisma.planejamento.count({
      where: {
        userId,
      },
    });
  }

  async countByUserBetween(userId: string, start: Date, end: Date) {
    return prisma.planejamento.count({
      where: {
        userId,
        semanaInicio: {
          gte: startOfDay(start),
          lte: startOfDay(end),
        },
      },
    });
  }

  async listRecentByUser(userId: string, take = 6) {
    return prisma.planejamento.findMany({
      where: {
        userId,
      },
      orderBy: {
        semanaInicio: "desc",
      },
      take,
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async existsByUserTurmaAndWeek(userId: string, turmaId: string | undefined, semanaInicio: Date) {
    const existing = await prisma.planejamento.findFirst({
      where: {
        userId,
        turmaId: turmaId ?? null,
        semanaInicio: startOfDay(semanaInicio),
      },
      select: {
        id: true,
      },
    });

    return Boolean(existing);
  }

  async create(userId: string, data: CreatePlanejamentoInput) {
    if (data.turmaId) {
      await this.assertTurmaOwnership(userId, data.turmaId);
    }
    await this.assertProjetoBase(userId, data.projetoBaseId);

    const weekStart = startOfDay(data.semanaInicio);
    const weekEnd = startOfDay(data.semanaFim);
    const planejamentoData = {
      semanaFim: weekEnd,
      projetoBaseId: data.projetoBaseId ?? null,
      camposExperiencia: data.camposExperiencia,
      direitosAprendizagem: data.direitosAprendizagem,
      grupoNome: data.grupoNome || null,
      nomeInstituicao: data.nomeInstituicao || null,
      nomeProfessora: data.nomeProfessora || null,
    };

    return prisma.$transaction(async (tx) => {
      const existing = await tx.planejamento.findFirst({
        where: {
          userId,
          turmaId: data.turmaId ?? null,
          semanaInicio: weekStart,
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
                ...planejamentoData,
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
                turmaId: data.turmaId ?? null,
                semanaInicio: weekStart,
                ...planejamentoData,
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
          atividadeId: item.atividadeId ?? null,
          diaSemana: item.diaSemana,
          horario: item.horario || null,
          ordem: item.ordem,
          objetivosTexto: item.objetivosTexto || null,
          atividadeTexto: item.atividadeTexto || null,
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
          projetoBase: true,
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
        projetoBase: true,
        atividades: {
          include: {
            atividade: true,
          },
          orderBy: [{ diaSemana: "asc" }, { ordem: "asc" }, { horario: "asc" }],
        },
      },
    });
  }

  async findOwnedById(userId: string, planejamentoId: string) {
    const planejamento = await prisma.planejamento.findFirst({
      where: {
        id: planejamentoId,
        userId,
      },
      include: {
        turma: true,
        user: {
          select: {
            name: true,
          },
        },
        projetoBase: {
          include: {
            atividades: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        atividades: {
          include: {
            atividade: true,
          },
          orderBy: [{ diaSemana: "asc" }, { ordem: "asc" }, { horario: "asc" }],
        },
      },
    });

    return this.assertFound(planejamento, "Planejamento nao encontrado");
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
      take: 80,
    });

    if (!planejamentos.length) {
      return 0;
    }

    const uniqueWeeks = Array.from(
      new Map(
        planejamentos.map((planejamento) => {
          const start = startOfDay(planejamento.semanaInicio);
          return [start.toISOString(), start] as const;
        }),
      ).values(),
    );

    let streak = 1;
    let current = uniqueWeeks[0];

    for (let i = 1; i < uniqueWeeks.length; i += 1) {
      const next = uniqueWeeks[i];
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
