import { RelatorioController } from "@/controllers/relatorio.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new RelatorioController();

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.remove(req, ctx, resolvedParams), [
    withAuth,
    withAudit({ action: "RELATORIO_DELETE", resource: "avaliacao" }),
  ])(request);
}
