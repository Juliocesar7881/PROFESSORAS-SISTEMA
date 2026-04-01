import { CategoriaObservacao } from "@prisma/client";

import { createObservacaoSchema, observacaoQuerySchema } from "@/dtos/observacao.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { ObservacaoService } from "@/services/observacao.service";

export class ObservacaoController {
  private readonly observacaoService = new ObservacaoService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = observacaoQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const observacoes = await this.observacaoService.list(context.userId!, query.alunoId, query.categoria);
      return ok(observacoes);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: Request, context: RequestContext) => {
    try {
      const formData = await request.formData();
      const payload = createObservacaoSchema.parse({
        texto: String(formData.get("texto") ?? ""),
        categoria: String(formData.get("categoria") ?? "") as CategoriaObservacao,
        alunoId: String(formData.get("alunoId") ?? ""),
      });

      const maybeFile = formData.get("foto");
      const photo = maybeFile instanceof File ? maybeFile : null;

      const observacao = await this.observacaoService.create(context.userId!, payload, photo);
      return ok(observacao, 201);
    } catch (error) {
      return fail(error);
    }
  };
}
