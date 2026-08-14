import { AlunoController } from "@/controllers/aluno.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new AlunoController();
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.detail(req, ctx, resolved), [withAuth])(request);
}
export async function PATCH(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.update(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "CRIANCA_UPDATE", resource: "crianca" }),
  ])(request);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.remove(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "CRIANCA_SOFT_DELETE", resource: "crianca" }),
  ])(request);
}
