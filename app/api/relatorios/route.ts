import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from "@/lib/constants";
import { RelatorioController } from "@/controllers/relatorio.controller";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new RelatorioController();

export const GET = route(controller.list, [withAuth]);

export const POST = route(controller.generate, [
  withAuth,
  withRateLimit({
    keyPrefix: "ai:relatorio",
    by: "user",
    failOpen: true,
    planAware: {
      freeLimit: FREE_PLAN_LIMITS.AI_CALLS_PER_HOUR,
      proLimit: PRO_PLAN_LIMITS.AI_CALLS_PER_HOUR,
      window: "1 h",
    },
  }),
  withAudit({ action: "RELATORIO_GENERATE", resource: "avaliacao" }),
]);
