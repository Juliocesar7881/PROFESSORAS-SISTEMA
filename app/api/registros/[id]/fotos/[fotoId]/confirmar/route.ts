import { RegistroController } from "@/controllers/registro.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new RegistroController();
type RouteContext = { params: Promise<{ id: string; fotoId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.confirmPhoto(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "REGISTRO_PHOTO_CONFIRM", resource: "registro" }),
  ])(request);
}
