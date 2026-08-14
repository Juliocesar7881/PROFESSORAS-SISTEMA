import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from "@/lib/constants";
import { RegistroController } from "@/controllers/registro.controller";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new RegistroController();

export const POST = route(controller.transcribe, [
  withAuth,
  withRateLimit({
    keyPrefix: "ai:transcription",
    by: "user",
    failOpen: true,
    planAware: {
      freeLimit: FREE_PLAN_LIMITS.AI_CALLS_PER_HOUR,
      proLimit: PRO_PLAN_LIMITS.AI_CALLS_PER_HOUR,
      window: "1 h",
    },
  }),
  withAudit({ action: "REGISTRO_TRANSCRIBE", resource: "registro" }),
]);
