import { RegistroController } from "@/controllers/registro.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new RegistroController();

export const POST = route(controller.exportWord, [
  withAuth,
  withAudit({ action: "REGISTROS_EXPORT_DOCX", resource: "registro" }),
]);
