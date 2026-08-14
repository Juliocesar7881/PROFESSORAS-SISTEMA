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
  origem?: "CATALOGO" | "IMPORTADO";
  includeAtividades?: boolean;
  cursor?: string;
  limit?: number;
}

const CATALOG_TITLES = PROJECT_CATALOG.map((projeto) => projeto.titulo);

function clampLimit(value: number | undefined) {
  if (!value || Number.isNaN(value)) {
    return 60;
  }

  return Math.min(Math.max(value, 1), 80);
}

function etapaTitles(etapa?: EtapaTurma) {
  if (!etapa) {
    return CATALOG_TITLES;
  }

  return PROJECT_CATALOG.filter((projeto) => matchesEtapa(projeto.faixaEtaria, etapa)).map((projeto) => projeto.titulo);
}

function mapListItem<T extends { premium: boolean; salvosPor: Array<{ userId: string }>; _count?: { atividades: number } }>(projeto: T) {
  return {
    ...projeto,
    atividadesCount: projeto._count?.atividades ?? 0,
    salvo: Boolean(projeto.salvosPor.length),
    premium: false,
    premiumBloqueado: false,
  };
}

export class ProjetoRepository extends BaseRepository {
  private buildWhere(userId: string, filters: ListProjetoFilters): Prisma.ProjetoWhereInput {
    const allowedTitles = etapaTitles(filters.etapa);

    return {
      AND: [
        {
          OR: [
            { ownerId: userId, origem: "IMPORTADO" },
            { ownerId: null, origem: "CATALOGO", titulo: { in: allowedTitles } },
          ],
        },
        ...(filters.busca
          ? [{
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
            }]
          : []),
      ],
      ...(filters.origem ? { origem: filters.origem } : {}),
      ...(filters.categoria ? { categoria: filters.categoria } : {}),
      ...(filters.duracao ? { duracao: filters.duracao } : {}),
      ...(filters.faixaEtaria ? { faixaEtaria: { contains: filters.faixaEtaria, mode: "insensitive" } } : {}),
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
  }

  async listPaginated(userId: string, filters: ListProjetoFilters) {
    const limit = clampLimit(filters.limit);
    const where = this.buildWhere(userId, filters);
    const includeAtividades = filters.includeAtividades === true;

    const total = await prisma.projeto.count({ where });
    const projetos = await prisma.projeto.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        descricao: true,
        categoria: true,
        faixaEtaria: true,
        duracao: true,
        thumbnailKey: true,
        origem: true,
        ownerId: true,
        bnccObjetivos: true,
        problema: true,
        justificativa: true,
        objetivoGeral: true,
        objetivosEspecificos: true,
        camposExperiencia: true,
        metodologia: true,
        cronograma: true,
        avaliacao: true,
        premium: true,
        createdAt: true,
        updatedAt: true,
        ...(includeAtividades
          ? {
              atividades: {
                orderBy: {
                  createdAt: "asc" as const,
                },
                select: {
                  id: true,
                  titulo: true,
                  descricao: true,
                  categoria: true,
                  duracao: true,
                  materiais: true,
                  bnccCodigos: true,
                  objetivoTexto: true,
                  ordem: true,
                },
              },
            }
          : {}),
        _count: {
          select: {
            atividades: true,
          },
        },
        salvosPor: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor
        ? {
            cursor: {
              id: filters.cursor,
            },
            skip: 1,
          }
        : {}),
    });

    const hasNext = projetos.length > limit;
    const items = projetos.slice(0, limit);

    return {
      items: items.map(mapListItem),
      nextCursor: hasNext ? items.at(-1)?.id ?? null : null,
      total,
    };
  }

  async list(userId: string, filters: ListProjetoFilters) {
    const page = await this.listPaginated(userId, filters);
    return page.items;
  }

  async listSavedSummaries(userId: string, take = 6) {
    const projetos = await prisma.projeto.findMany({
      where: this.buildWhere(userId, { salvos: true }),
      select: {
        id: true,
        titulo: true,
        descricao: true,
        categoria: true,
        faixaEtaria: true,
        duracao: true,
        premium: true,
        _count: {
          select: {
            atividades: true,
          },
        },
        salvosPor: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take,
    });

    return projetos.map(mapListItem);
  }

  async findById(userId: string, id: string) {
    const projeto = await prisma.projeto.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId, origem: "IMPORTADO" },
          { ownerId: null, origem: "CATALOGO", titulo: { in: CATALOG_TITLES } },
        ],
      },
      include: {
        atividades: {
          orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
        },
        importacao: { select: { id: true, fileName: true, mimeType: true } },
      },
    });

    return this.assertFound(projeto, "Projeto nao encontrado");
  }

  async save(userId: string, projetoId: string) {
    await this.assertVisibleProject(userId, projetoId);

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

  private async assertVisibleProject(userId: string, projetoId: string) {
    const projeto = await prisma.projeto.findFirst({
      where: {
        id: projetoId,
        OR: [
          { ownerId: userId, origem: "IMPORTADO" },
          { ownerId: null, origem: "CATALOGO", titulo: { in: CATALOG_TITLES } },
        ],
      },
      select: {
        id: true,
      },
    });

    this.assertFound(projeto, "Projeto nao encontrado");
  }
}
