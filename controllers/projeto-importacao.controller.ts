import { z } from "zod";

import { confirmarImportacaoProjetoSchema } from "@/dtos/projeto.dto";
import { ValidationError } from "@/dtos/errors";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { ProjetoImportacaoService } from "@/services/projeto-importacao.service";

export class ProjetoImportacaoController {
  private readonly service = new ProjetoImportacaoService();

  import = async (request: Request, context: RequestContext) => {
    try {
      const formData = await request.formData();
      const file = formData.get("arquivo");
      if (!(file instanceof File)) throw new ValidationError("Selecione um documento.");
      const confirmar = formData.get("confirmar") === "true";
      return ok(await this.service.import(context.userId!, file, { confirmar }), 201);
    } catch (error) {
      return fail(error);
    }
  };

  confirm = async (request: Request, context: RequestContext) => {
    try {
      const payload = confirmarImportacaoProjetoSchema.parse(await request.json());
      return ok(await this.service.confirm(context.userId!, payload), 201);
    } catch (error) {
      return fail(error);
    }
  };

  original = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const id = z.string().cuid().parse(params.id);
      return ok(await this.service.getOriginalUrl(context.userId!, id));
    } catch (error) {
      return fail(error);
    }
  };
}
