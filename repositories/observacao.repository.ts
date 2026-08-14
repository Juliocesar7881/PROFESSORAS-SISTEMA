import { CategoriaObservacao } from "@prisma/client";

import type { CreateObservacaoInput } from "@/dtos/observacao.dto";
import { prisma } from "@/lib/prisma";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/constants";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";
import { BaseRepository } from "@/repositories/base.repository";

export class ObservacaoRepository extends BaseRepository {
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

  async create(userId: string, data: CreateObservacaoInput) {
    await this.assertAlunoOwnership(userId, data.alunoId);

    return prisma.observacao.create({
      data: {
        userId,
        texto: data.texto,
        categoria: data.categoria,
        alunoId: data.alunoId,
        dataRegistro: new Date(),
      },
    });
  }

  async attachPhoto(userId: string, observacaoId: string, storageKey: string) {
    const observacao = await prisma.observacao.findFirst({
      where: {
        id: observacaoId,
        aluno: {
          turma: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    this.assertFound(observacao, "Observacao nao encontrada");

    return prisma.fotoObservacao.create({
      data: {
        observacaoId,
        storageKey,
      },
    });
  }

  private async signedPhoto(storageKey: string) {
    const signed = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS);

    return signed.data?.signedUrl ?? null;
  }

  async listByAluno(userId: string, alunoId: string, categoria?: CategoriaObservacao, pagination: { cursor?: string; limit?: number } = {}) {
    await this.assertAlunoOwnership(userId, alunoId);
    const limit = Math.min(Math.max(pagination.limit ?? 20, 1), 30);
    const where = {
      alunoId,
      ...(categoria ? { categoria } : {}),
    };

    const total = await prisma.observacao.count({ where });
    const observacoes = await prisma.observacao.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(pagination.cursor
        ? {
            cursor: {
              id: pagination.cursor,
            },
            skip: 1,
          }
        : {}),
      include: {
        fotos: true,
      },
    });

    const hasNext = observacoes.length > limit;
    const visibleObservacoes = observacoes.slice(0, limit);

    return {
      items: await Promise.all(
        visibleObservacoes.map(async (observacao) => ({
        ...observacao,
        fotos: await Promise.all(
          observacao.fotos.map(async (foto) => {
            return {
              id: foto.id,
              storageKey: foto.storageKey,
              url: await this.signedPhoto(foto.storageKey),
            };
          }),
        ),
      })),
      ),
      nextCursor: hasNext ? visibleObservacoes.at(-1)?.id ?? null : null,
      total,
    };
  }

  async countByAluno(userId: string, alunoId: string) {
    await this.assertAlunoOwnership(userId, alunoId);

    return prisma.observacao.count({
      where: {
        alunoId,
      },
    });
  }

  async findOwnedById(userId: string, observacaoId: string) {
    const observacao = await prisma.observacao.findFirst({
      where: {
        id: observacaoId,
        aluno: {
          turma: {
            userId,
          },
        },
      },
      include: {
        fotos: {
          select: {
            id: true,
            storageKey: true,
          },
        },
      },
    });

    return this.assertFound(observacao, "Observacao nao encontrada");
  }

  async deleteById(observacaoId: string) {
    return prisma.observacao.delete({
      where: {
        id: observacaoId,
      },
    });
  }

  async countByUserSince(userId: string, since: Date) {
    return prisma.observacao.count({
      where: {
        createdAt: {
          gte: since,
        },
        aluno: {
          deletedAt: null,
          turma: {
            userId,
            deletedAt: null,
          },
        },
      },
    });
  }

  async listRecentByUser(userId: string, limit = 12) {
    return prisma.observacao.findMany({
      where: {
        aluno: {
          deletedAt: null,
          turma: {
            userId,
            deletedAt: null,
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

  async getTextByAluno(userId: string, alunoId: string) {
    await this.assertAlunoOwnership(userId, alunoId);

    return prisma.observacao.findMany({
      where: {
        alunoId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        texto: true,
        categoria: true,
        createdAt: true,
      },
    });
  }
}
