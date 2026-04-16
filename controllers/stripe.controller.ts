import type Stripe from "stripe";

import { ValidationError } from "@/dtos/errors";
import { createCheckoutSchema } from "@/dtos/stripe.dto";
import { fail, ok } from "@/lib/http";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import type { RequestContext } from "@/middleware/api";
import { StripeService } from "@/services/stripe.service";

export class StripeController {
  private readonly stripeService = new StripeService();

  checkout = async (request: Request, context: RequestContext) => {
    try {
      const payload = createCheckoutSchema.parse(await request.json());
      const result = await this.stripeService.createCheckout(context.userId!, payload.ciclo);
      return ok(result, 201);
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
