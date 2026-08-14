import { AlunoController } from "@/controllers/aluno.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new AlunoController();

export const GET = route(controller.list, [withAuth]);
export const POST = route(controller.create, [
  withAuth,
  withAudit({ action: "CRIANCA_CREATE", resource: "crianca" }),
]);
