import type Stripe from "stripe";

import { ValidationError } from "@/dtos/errors";
import { fail, ok } from "@/lib/http";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import type { RequestContext } from "@/middleware/api";
import { StripeService } from "@/services/stripe.service";

export class StripeController {
  private readonly stripeService = new StripeService();

  checkout = async (request: Request, context: RequestContext) => {
    void request;
    void context;

    try {
      return ok({ checkoutUrl: null, freeAccess: true, message: "Assinaturas desativadas. O Pequenos Passos está gratuito." });
    } catch (error) {
      return fail(error);
    }
  };

  webhook = async (request: Request) => {
    try {
      const signature = request.headers.get("stripe-signature");

      if (!signature) {
        return fail(new ValidationError("Assinatura Stripe ausente"));
      }

      const rawBody = await request.text();
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET) as Stripe.Event;
      } catch {
        return fail(new ValidationError("Assinatura Stripe inválida"));
      }

      const result = await this.stripeService.processWebhook(event);

      return ok(result);
    } catch (error) {
      return fail(error);
    }
  };
}
