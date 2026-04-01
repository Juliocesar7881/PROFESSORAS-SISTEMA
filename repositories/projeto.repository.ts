import { Plano } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

interface ListProjetoFilters {
  categoria?: string;
  faixaEtaria?: string;
  duracao?: string;
  busca?: string;
  salvos?: boolean;
}

export class ProjetoRepository extends BaseRepository {
  async list(userId: string, plano: Plano, filters: ListProjetoFilters) {
    if (filters.salvos) {
      return prisma.projeto.findMany({
        where: {
          salvosPor: {
            some: {
              userId,
            },
          },
        },
        include: {
          atividades: true,
          salvosPor: {
            where: {
              userId,
            },
          },
        },
      });
    }

    const where = {
      ...(filters.categoria ? { categoria: filters.categoria } : {}),
      ...(filters.faixaEtaria ? { faixaEtaria: filters.faixaEtaria } : {}),
      ...(filters.duracao ? { duracao: filters.duracao } : {}),
      ...(filters.busca
        ? {
            OR: [
              { titulo: { contains: filters.busca, mode: "insensitive" as const } },
              { descricao: { contains: filters.busca, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(plano === Plano.GRATUITO ? { premium: false } : {}),
    };

    if (plano === Plano.PRO) {
      return prisma.projeto.findMany({
        where,
        include: {
          atividades: true,
          salvosPor: {
            where: {
              userId,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    const total = await prisma.projeto.count({ where });
    const freeLimit = Math.max(1, Math.ceil(total * 0.2));

    return prisma.projeto.findMany({
      where,
      include: {
        atividades: true,
        salvosPor: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: freeLimit,
    });
  }

  async findById(id: string) {
    const projeto = await prisma.projeto.findUnique({
      where: { id },
      include: {
        atividades: true,
      },
    });

    return this.assertFound(projeto, "Projeto nao encontrado");
  }

  async save(userId: string, projetoId: string) {
    return prisma.projetoSalvo.upsert({
      where: {
        userId_projetoId: {
          userId,
          projetoId,
        },
      },
      create: {
        userId,
        projetoId,
      },
      update: {},
    });
  }

  async unsave(userId: string, projetoId: string) {
    return prisma.projetoSalvo.deleteMany({
      where: {
        userId,
        projetoId,
      },
    });
  }

  async isSaved(userId: string, projetoId: string) {
    const saved = await prisma.projetoSalvo.findUnique({
      where: {
        userId_projetoId: {
          userId,
          projetoId,
        },
      },
      select: {
        userId: true,
      },
    });

    return Boolean(saved);
  }
}
