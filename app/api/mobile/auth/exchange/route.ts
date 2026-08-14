import { MobileAuthController } from "@/controllers/mobile-auth.controller";
import { route, withRateLimit } from "@/middleware/api";

const controller = new MobileAuthController();

export const POST = route(controller.exchange, [
  withRateLimit({ keyPrefix: "mobile:exchange", by: "ip", fixed: { points: 20, window: "1 h" } }),
]);
