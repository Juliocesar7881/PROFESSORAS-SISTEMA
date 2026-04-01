import { ProjetoController } from "@/controllers/projeto.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new ProjetoController();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return route((req, ctx) => controller.detail(req, ctx, params), [withAuth])(request);
}
