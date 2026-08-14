import { ProjetoImportacaoController } from "@/controllers/projeto-importacao.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new ProjetoImportacaoController();

export const POST = route(controller.confirm, [
  withAuth,
  withAudit({ action: "PROJETO_IMPORT_CONFIRM", resource: "projeto" }),
]);
