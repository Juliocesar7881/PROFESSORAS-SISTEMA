import { Plano } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class StripeRepository {
  async hasProcessedEvent(eventId: string) {
    const event = await prisma.stripeWebhookEvent.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
      },
    });

    return Boolean(event);
  }

  async markEventProcessed(eventId: string, payload?: unknown, userId?: string) {
    return prisma.stripeWebhookEvent.create({
      data: {
        id: eventId,
        userId,
        payload: payload as object | undefined,
      },
    });
  }

  async setUserPlan(params: { userId: string; plan: Plano; stripeId?: string | null; stripeSubId?: string | null }) {
    return prisma.user.update({
      where: {
        id: params.userId,
      },
      data: {
        plano: params.plan,
        stripeId: params.stripeId,
        stripeSubId: params.stripeSubId,
      },
    });
  }

  async findUserByStripeCustomer(customerId: string) {
    return prisma.user.findFirst({
      where: {
        stripeId: customerId,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
}
