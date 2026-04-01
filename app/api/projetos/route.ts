import { ProjetoController } from "@/controllers/projeto.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new ProjetoController();

export const GET = route(controller.list, [withAuth]);
export const POST = route(controller.save, [withAuth]);
export const DELETE = route(controller.unsave, [withAuth]);
