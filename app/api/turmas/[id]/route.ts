import { TurmaController } from "@/controllers/turma.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new TurmaController();

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return route((req, ctx) => controller.update(req, ctx, params), [
    withAuth,
    withAudit({ action: "TURMA_UPDATE", resource: "turma" }),
  ])(request);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return route((req, ctx) => controller.remove(req, ctx, params), [
    withAuth,
    withAudit({ action: "TURMA_SOFT_DELETE", resource: "turma" }),
  ])(request);
}
