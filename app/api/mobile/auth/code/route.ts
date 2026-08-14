import { MobileAuthController } from "@/controllers/mobile-auth.controller";
import { route, withAuth, withRateLimit } from "@/middleware/api";

const controller = new MobileAuthController();

export const POST = route(controller.createCode, [
  withAuth,
  withRateLimit({ keyPrefix: "mobile:code", by: "user", fixed: { points: 10, window: "1 h" } }),
]);
