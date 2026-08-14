import type { Prisma } from "@prisma/client";

import { SIGNED_URL_TTL_SECONDS } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BaseRepository } from "@/repositories/base.repository";

export type ArtesImpressaoPhotoRecord = Prisma.FotoObservacaoGetPayload<{
  include: {
    observacao: {
      select: {
        createdAt: true;
        texto: true;
        aluno: {
          select: {
            id: true;
            nome: true;
            turma: {
              select: {
                id: true;
                nome: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export class ArtesImpressaoRepository extends BaseRepository {
  private async signedPhoto(storageKey: string) {
    const signed = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS);

    return signed.data?.signedUrl ?? null;
  }

  private buildPhotoWhere(
    userId: string,
    filters: {
      turmaId?: string;
      alunoId?: string;
      since?: Date;
    },
  ): Prisma.FotoObservacaoWhereInput {
    return {
      observacao: {
        ...(filters.since ? { createdAt: { gte: filters.since } } : {}),
        aluno: {
          deletedAt: null,
          ...(filters.alunoId ? { id: filters.alunoId } : {}),
          turma: {
            userId,
            deletedAt: null,
            ...(filters.turmaId ? { id: filters.turmaId } : {}),
          },
        },
      },
    };
  }

  async listPhotos(
    userId: string,
    filters: {
      turmaId?: string;
      alunoId?: string;
      since?: Date;
      limit?: number;
    },
  ) {
    const limit = Math.min(Math.max(filters.limit ?? 80, 1), 120);
    const photos = await prisma.fotoObservacao.findMany({
      where: this.buildPhotoWhere(userId, filters),
      orderBy: [
        {
          observacao: {
            createdAt: "desc",
          },
        },
        { id: "desc" },
      ],
      take: limit,
      include: {
        observacao: {
          select: {
            createdAt: true,
            texto: true,
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
        },
      },
    });

    return Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        url: await this.signedPhoto(photo.storageKey),
        createdAt: photo.observacao.createdAt,
        aluno: {
          id: photo.observacao.aluno.id,
          nome: photo.observacao.aluno.nome,
        },
        turma: {
          id: photo.observacao.aluno.turma.id,
          nome: photo.observacao.aluno.turma.nome,
        },
      })),
    );
  }

  async findOwnedPhotosByIds(userId: string, ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));

    if (!uniqueIds.length) {
      return [] as ArtesImpressaoPhotoRecord[];
    }

    return prisma.fotoObservacao.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
        observacao: {
          aluno: {
            deletedAt: null,
            turma: {
              userId,
              deletedAt: null,
            },
          },
        },
      },
      include: {
        observacao: {
          select: {
            createdAt: true,
            texto: true,
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
        },
      },
    });
  }
}
