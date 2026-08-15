import { AccountController } from "@/controllers/account.controller";
import { route, withAuth, withRateLimit } from "@/middleware/api";

const controller = new AccountController();

export const POST = route(controller.deleteAccount, [
  withAuth,
  withRateLimit({
    keyPrefix: "account:delete",
    by: "user",
    fixed: { points: 3, window: "1 h" },
  }),
]);
