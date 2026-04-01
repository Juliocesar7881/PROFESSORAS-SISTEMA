import { StripeController } from "@/controllers/stripe.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new StripeController();

export const POST = route(controller.checkout, [withAuth]);
