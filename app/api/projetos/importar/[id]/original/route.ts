import { ProjetoImportacaoController } from "@/controllers/projeto-importacao.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new ProjetoImportacaoController();
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, context) => controller.original(req, context, resolved), [withAuth])(request);
}
