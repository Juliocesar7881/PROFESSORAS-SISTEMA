import { AlunoController } from "@/controllers/aluno.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new AlunoController();

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.detail(req, ctx, resolvedParams), [withAuth])(request);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.update(req, ctx, resolvedParams), [
    withAuth,
    withAudit({ action: "ALUNO_UPDATE", resource: "aluno" }),
  ])(request);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.remove(req, ctx, resolvedParams), [
    withAuth,
    withAudit({ action: "ALUNO_SOFT_DELETE", resource: "aluno" }),
  ])(request);
}
