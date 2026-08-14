import { Plano } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export class UserRepository extends BaseRepository {
  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async hasAnyTurma(userId: string) {
    const count = await prisma.turma.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async updatePlan(userId: string, params: { plano: Plano; stripeId?: string | null; stripeSubId?: string | null }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        plano: params.plano,
        stripeId: params.stripeId,
        stripeSubId: params.stripeSubId,
      },
    });
  }

  async setStripeCustomerId(userId: string, stripeId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        stripeId,
      },
    });
  }

  async findByStripeCustomerId(stripeId: string) {
    return prisma.user.findFirst({
      where: {
        stripeId,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async deleteAccount(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  async listOwnedStorageKeys(userId: string) {
    const [photos, imports, children, projects] = await Promise.all([
      prisma.fotoObservacao.findMany({
        where: { observacao: { userId } },
        select: { storageKey: true },
      }),
      prisma.projetoImportacao.findMany({
        where: { userId },
        select: { storageKey: true },
      }),
      prisma.aluno.findMany({
        where: { userId, fotoKey: { not: null } },
        select: { fotoKey: true },
      }),
      prisma.projeto.findMany({
        where: { ownerId: userId, thumbnailKey: { not: null } },
        select: { thumbnailKey: true },
      }),
    ]);

    return [...new Set([
      ...photos.map((item) => item.storageKey),
      ...imports.map((item) => item.storageKey),
      ...children.map((item) => item.fotoKey),
      ...projects.map((item) => item.thumbnailKey),
    ].filter((key): key is string => Boolean(key)))];
  }

  async deleteAllSessions(userId: string) {
    return prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  }
}
