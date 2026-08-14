import { RegistroController } from "@/controllers/registro.controller";
import { PHOTO_UPLOAD_TICKETS_PER_HOUR } from "@/lib/constants";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new RegistroController();
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const resolved = await params;
  return route((req, ctx) => controller.presignPhotos(req, ctx, resolved), [
    withAuth,
    withRateLimit({
      keyPrefix: "registro:photo-ticket",
      by: "user",
      failOpen: true,
      fixed: { points: PHOTO_UPLOAD_TICKETS_PER_HOUR, window: "1 h" },
    }),
    withAudit({ action: "REGISTRO_PHOTO_PRESIGN", resource: "registro" }),
  ])(request);
}
