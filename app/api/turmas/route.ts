import { TurmaController } from "@/controllers/turma.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new TurmaController();

export const GET = route(controller.list, [withAuth]);
export const POST = route(controller.create, [
	withAuth,
	withAudit({ action: "TURMA_CREATE", resource: "turma" }),
]);
