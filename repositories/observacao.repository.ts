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
        texto: data.texto,
        categoria: data.categoria,
        alunoId: data.alunoId,
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

  async listByAluno(userId: string, alunoId: string, categoria?: CategoriaObservacao) {
    await this.assertAlunoOwnership(userId, alunoId);

    const observacoes = await prisma.observacao.findMany({
      where: {
        alunoId,
        ...(categoria ? { categoria } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        fotos: true,
      },
    });

    return Promise.all(
      observacoes.map(async (observacao) => ({
        ...observacao,
        fotos: await Promise.all(
          observacao.fotos.map(async (foto) => {
            const signed = await supabaseAdmin.storage
              .from(env.SUPABASE_STORAGE_BUCKET)
              .createSignedUrl(foto.storageKey, SIGNED_URL_TTL_SECONDS);

            return {
              id: foto.id,
              storageKey: foto.storageKey,
              url: signed.data?.signedUrl ?? null,
            };
          }),
        ),
      })),
    );
  }

  async countByAluno(userId: string, alunoId: string) {
    await this.assertAlunoOwnership(userId, alunoId);

    return prisma.observacao.count({
      where: {
        alunoId,
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
