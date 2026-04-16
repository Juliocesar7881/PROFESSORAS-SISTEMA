import { ObservacaoController } from "@/controllers/observacao.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new ObservacaoController();

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.remove(req, ctx, resolvedParams), [
    withAuth,
    withAudit({ action: "OBSERVACAO_DELETE", resource: "observacao" }),
  ])(request);
}
