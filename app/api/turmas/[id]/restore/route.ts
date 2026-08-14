import { TurmaController } from "@/controllers/turma.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new TurmaController();
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.restore(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "TURMA_RESTORE", resource: "turma" }),
  ])(request);
}
