import { ChamadaController } from "@/controllers/chamada.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new ChamadaController();

export const GET = route(controller.list, [withAuth]);

export const POST = route(controller.create, [
  withAuth,
  withAudit({ action: "CHAMADA_SAVE", resource: "chamada" }),
]);
