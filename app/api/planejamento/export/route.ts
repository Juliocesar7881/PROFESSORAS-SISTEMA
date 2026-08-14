import { PlanejamentoController } from "@/controllers/planejamento.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new PlanejamentoController();

export const GET = route(controller.exportDocument, [withAuth]);
