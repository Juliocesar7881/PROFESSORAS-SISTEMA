import { FREE_PLAN_LIMITS } from "@/lib/constants";
import { route, withRateLimit } from "@/middleware/api";

const handler = async () => Response.json({ ok: true });

export const POST = route(handler, [
  withRateLimit({
    keyPrefix: "login:ip",
    by: "ip",
    failOpen: true,
    fixed: {
      points: FREE_PLAN_LIMITS.LOGIN_ATTEMPTS_PER_IP_HOUR,
      window: "1 h",
    },
  }),
]);
