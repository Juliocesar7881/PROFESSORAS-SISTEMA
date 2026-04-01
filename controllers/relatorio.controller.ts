import { z } from "zod";

import { gerarRelatorioSchema } from "@/dtos/relatorio.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { RelatorioService } from "@/services/relatorio.service";

export class RelatorioController {
  private readonly relatorioService = new RelatorioService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = z
        .object({
          alunoId: z.string().cuid(),
        })
        .parse(Object.fromEntries(new URL(request.url).searchParams));

      const data = await this.relatorioService.listar(context.userId!, query.alunoId);
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  };

  generate = async (request: Request, context: RequestContext) => {
    try {
      const payload = gerarRelatorioSchema.parse(await request.json());
      const relatorio = await this.relatorioService.gerar(context.userId!, context.plano, payload);
      return ok(relatorio, 201);
    } catch (error) {
      return fail(error);
    }
  };
}
