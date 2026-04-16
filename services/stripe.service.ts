import { Plano } from "@prisma/client";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { MONTHLY_PRICE_CENTS, YEARLY_PRICE_CENTS } from "@/lib/subscription";
import { StripeRepository } from "@/repositories/stripe.repository";
import { UserRepository } from "@/repositories/user.repository";
import { NotFoundError } from "@/dtos/errors";

export class StripeService {
  private readonly stripeRepository = new StripeRepository();

  private readonly userRepository = new UserRepository();

  async createCheckout(userId: string, ciclo: "mensal" | "anual") {
    const user = await this.userRepository.findById(userId);

    if (!user?.email) {
      throw new NotFoundError("Usuario sem email para checkout");
    }

    let customerId = user.stripeId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;
      await this.userRepository.setStripeCustomerId(userId, customer.id);
    }

    const unitAmount = ciclo === "anual" ? YEARLY_PRICE_CENTS : MONTHLY_PRICE_CENTS;
    const recurringInterval: "month" | "year" = ciclo === "anual" ? "year" : "month";
    const productName = ciclo === "anual" ? "Planejei Pro - Anual" : "Planejei Pro - Mensal";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes?checkout=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes?checkout=canceled`,
      line_items: [
        {
          price_data: {
            currency: "brl",
            recurring: {
              interval: recurringInterval,
            },
            unit_amount: unitAmount,
            product_data: {
              name: productName,
              description: "Acesso completo ao Planejei para gestão pedagógica.",
            },
          },
          quantity: 1,
        },
      ],
      locale: "pt-BR",
      metadata: {
        userId,
        ciclo,
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async processWebhook(event: Stripe.Event) {
    if (await this.stripeRepository.hasProcessedEvent(event.id)) {
      return { duplicate: true };
    }

    switch (event.type) {
      case "checkout.session.completed": {
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }

    await this.stripeRepository.markEventProcessed(event.id, event);

    return { duplicate: false };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;

    if (!userId) {
      return;
    }

    await this.stripeRepository.setUserPlan({
      userId,
      plan: Plano.PRO,
      stripeId: typeof session.customer === "string" ? session.customer : undefined,
      stripeSubId: typeof session.subscription === "string" ? session.subscription : undefined,
    });
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

    if (!customerId) {
      return;
    }

    const user = await this.stripeRepository.findUserByStripeCustomer(customerId);

    if (!user) {
      return;
    }

    const active = ["active", "trialing", "past_due"].includes(subscription.status);

    await this.stripeRepository.setUserPlan({
      userId: user.id,
      plan: active ? Plano.PRO : Plano.GRATUITO,
      stripeId: customerId,
      stripeSubId: subscription.id,
    });
  }
}
