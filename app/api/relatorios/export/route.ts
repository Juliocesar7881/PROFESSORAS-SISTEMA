import { RelatorioController } from "@/controllers/relatorio.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new RelatorioController();

export const GET = route(controller.exportPdf, [
  withAuth,
  withAudit({ action: "RELATORIO_EXPORT_PDF", resource: "avaliacao" }),
]);
