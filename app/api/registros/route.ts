import { RECORD_CREATES_PER_HOUR } from "@/lib/constants";
import { RegistroController } from "@/controllers/registro.controller";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new RegistroController();

export const GET = route(controller.list, [withAuth]);
export const POST = route(controller.create, [
  withAuth,
  withRateLimit({
    keyPrefix: "registro:create",
    by: "user",
    failOpen: true,
    fixed: { points: RECORD_CREATES_PER_HOUR, window: "1 h" },
  }),
  withAudit({ action: "REGISTRO_CREATE", resource: "registro" }),
]);
