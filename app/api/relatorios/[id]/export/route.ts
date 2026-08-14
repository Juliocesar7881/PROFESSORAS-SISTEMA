import { RelatorioController } from "@/controllers/relatorio.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new RelatorioController();
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.exportById(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "RELATORIO_EXPORT", resource: "avaliacao" }),
  ])(request);
}
