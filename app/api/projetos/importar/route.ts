import { ProjetoImportacaoController } from "@/controllers/projeto-importacao.controller";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new ProjetoImportacaoController();

export const maxDuration = 60;

export const POST = route(controller.import, [
  withAuth,
  withRateLimit({ keyPrefix: "projeto:import", by: "user", failOpen: true, fixed: { points: 10, window: "1 h" } }),
  withAudit({ action: "PROJETO_IMPORT", resource: "projeto" }),
]);
