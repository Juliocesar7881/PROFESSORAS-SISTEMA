import { TurmaController } from "@/controllers/turma.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new TurmaController();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.update(req, ctx, resolvedParams), [
    withAuth,
    withAudit({ action: "TURMA_UPDATE", resource: "turma" }),
  ])(request);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.remove(req, ctx, resolvedParams), [
    withAuth,
    withAudit({ action: "TURMA_SOFT_DELETE", resource: "turma" }),
  ])(request);
}
