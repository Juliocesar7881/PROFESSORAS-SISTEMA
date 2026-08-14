import { ArtesImpressaoController } from "@/controllers/artes-impressao.controller";
import { route, withAudit, withAuth, withRateLimit } from "@/middleware/api";

const controller = new ArtesImpressaoController();

export const POST = route(controller.exportPdf, [
  withAuth,
  withRateLimit({
    keyPrefix: "artes:pdf",
    by: "user",
    failOpen: true,
    fixed: {
      points: 20,
      window: "1 h",
    },
  }),
  withAudit({ action: "ARTES_IMPRESSAO_EXPORT_PDF", resource: "artes-impressao" }),
]);
