import { AlunoController } from "@/controllers/aluno.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new AlunoController();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return route((req, ctx) => controller.detail(req, ctx, params), [withAuth])(request);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return route((req, ctx) => controller.update(req, ctx, params), [
    withAuth,
    withAudit({ action: "ALUNO_UPDATE", resource: "aluno" }),
  ])(request);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return route((req, ctx) => controller.remove(req, ctx, params), [
    withAuth,
    withAudit({ action: "ALUNO_SOFT_DELETE", resource: "aluno" }),
  ])(request);
}
