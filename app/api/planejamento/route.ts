import { PlanejamentoController } from "@/controllers/planejamento.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new PlanejamentoController();

export const GET = route(controller.list, [withAuth]);
export const POST = route(controller.create, [
  withAuth,
  withAudit({ action: "PLANEJAMENTO_CREATE", resource: "planejamento" }),
]);
