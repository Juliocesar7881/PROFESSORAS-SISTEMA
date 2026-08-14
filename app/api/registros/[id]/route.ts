import { RegistroController } from "@/controllers/registro.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new RegistroController();
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.find(req, ctx, resolved), [withAuth])(request);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.update(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "REGISTRO_UPDATE", resource: "registro" }),
  ])(request);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.remove(req, ctx, resolved), [
    withAuth,
    withAudit({ action: "REGISTRO_SOFT_DELETE", resource: "registro" }),
  ])(request);
}
