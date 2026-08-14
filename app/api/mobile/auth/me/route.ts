import { MobileAuthController } from "@/controllers/mobile-auth.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new MobileAuthController();
export const GET = route(controller.me, [withAuth]);
