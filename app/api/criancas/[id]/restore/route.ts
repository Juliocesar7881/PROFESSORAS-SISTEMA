import { AlunoController } from "@/controllers/aluno.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new AlunoController();
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.restore(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "CRIANCA_RESTORE", resource: "crianca" }),
  ])(request);
}
