import { CategoriaObservacao } from "@prisma/client";
import { z } from "zod";

import { createObservacaoSchema, observacaoQuerySchema } from "@/dtos/observacao.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { ObservacaoService } from "@/services/observacao.service";

const pathSchema = z.object({
  id: z.string().cuid(),
});

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
      const photos = formData
        .getAll("fotos")
        .filter((item): item is File => item instanceof File && item.size > 0);

      if (photo && photo.size > 0) {
        photos.push(photo);
      }

      const observacao = await this.observacaoService.create(context.userId!, payload, photos);
      return ok(observacao, 201);
    } catch (error) {
      return fail(error);
    }
  };

  remove = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const removed = await this.observacaoService.remove(context.userId!, parsed.id);
      return ok(removed);
    } catch (error) {
      return fail(error);
    }
  };
}
