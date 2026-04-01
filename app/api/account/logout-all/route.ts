import { AccountController } from "@/controllers/account.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new AccountController();

export const POST = route(controller.logoutEverywhere, [withAuth]);
