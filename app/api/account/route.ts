import { AccountController } from "@/controllers/account.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new AccountController();

export const DELETE = route(controller.deleteAccount, [withAuth]);
