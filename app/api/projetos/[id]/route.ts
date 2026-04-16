import { ProjetoController } from "@/controllers/projeto.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new ProjetoController();

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  return route((req, ctx) => controller.detail(req, ctx, resolvedParams), [withAuth])(request);
}
