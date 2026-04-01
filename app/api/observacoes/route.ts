import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from "@/lib/constants";
import { ObservacaoController } from "@/controllers/observacao.controller";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new ObservacaoController();

export const GET = route(controller.list, [withAuth]);

export const POST = route(controller.create, [
  withAuth,
  withRateLimit({
    keyPrefix: "upload:photo",
    by: "user",
    planAware: {
      freeLimit: FREE_PLAN_LIMITS.PHOTO_UPLOADS_PER_HOUR,
      proLimit: PRO_PLAN_LIMITS.PHOTO_UPLOADS_PER_HOUR,
      window: "1 h",
    },
  }),
  withAudit({ action: "OBSERVACAO_CREATE", resource: "observacao" }),
]);
