import type { Prisma } from "@prisma/client";

import { type EtapaTurma, matchesEtapa } from "@/lib/etapa";
import { PROJECT_CATALOG } from "@/lib/project-catalog";
import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

interface ListProjetoFilters {
  categoria?: string;
  faixaEtaria?: string;
  etapa?: EtapaTurma;
  turmaId?: string;
  duracao?: string;
  busca?: string;
  salvos?: boolean;
}

let catalogSynced = false;

export class ProjetoRepository extends BaseRepository {
  private async ensureCatalog() {
    if (catalogSynced) {
      return;
    }

    const existing = await prisma.projeto.findMany({
      select: {
        titulo: true,
      },
    });

    const existingTitles = new Set(existing.map((item) => item.titulo));

    for (const projeto of PROJECT_CATALOG) {
      if (existingTitles.has(projeto.titulo)) {
        continue;
      }

      await prisma.projeto.create({
        data: {
          titulo: projeto.titulo,
          descricao: projeto.descricao,
          categoria: projeto.categoria,
          faixaEtaria: projeto.faixaEtaria,
          duracao: projeto.duracao,
          bnccObjetivos: projeto.bnccObjetivos,
          premium: false,
          atividades: {
            create: projeto.atividades,
          },
        },
      });
    }

    await prisma.projeto.updateMany({
      where: {
        premium: true,
      },
      data: {
        premium: false,
      },
    });

    catalogSynced = true;
  }

  async list(userId: string, filters: ListProjetoFilters) {
    await this.ensureCatalog();

    const where: Prisma.ProjetoWhereInput = {
      ...(filters.categoria ? { categoria: filters.categoria } : {}),
      ...(filters.duracao ? { duracao: filters.duracao } : {}),
      ...(filters.busca
        ? {
            OR: [
              { titulo: { contains: filters.busca, mode: "insensitive" as const } },
              { descricao: { contains: filters.busca, mode: "insensitive" as const } },
              {
                atividades: {
                  some: {
                    OR: [
                      { titulo: { contains: filters.busca, mode: "insensitive" as const } },
                      { descricao: { contains: filters.busca, mode: "insensitive" as const } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      ...(filters.salvos
        ? {
            salvosPor: {
              some: {
                userId,
              },
            },
          }
        : {}),
    };

    const projetos = await prisma.projeto.findMany({
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

    return projetos
      .filter((projeto) => (filters.faixaEtaria ? projeto.faixaEtaria.toLowerCase().includes(filters.faixaEtaria.toLowerCase()) : true))
      .filter((projeto) => (filters.etapa ? matchesEtapa(projeto.faixaEtaria, filters.etapa) : true))
      .map((projeto) => ({
        ...projeto,
        premium: false,
        premiumBloqueado: false,
      }));
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
