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

  async deleteAllSessions(userId: string) {
    return prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  }
}
