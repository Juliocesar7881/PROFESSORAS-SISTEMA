import { StripeController } from "@/controllers/stripe.controller";

const controller = new StripeController();

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return controller.webhook(request);
}
