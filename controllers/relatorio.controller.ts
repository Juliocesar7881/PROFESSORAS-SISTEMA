import { z } from "zod";

import { exportRelatorioQuerySchema, gerarRelatorioSchema } from "@/dtos/relatorio.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { RelatorioService } from "@/services/relatorio.service";

const pathSchema = z.object({
  id: z.string().cuid(),
});

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
      const trialExpired = context.session?.user?.trialExpired !== false;
      const relatorio = await this.relatorioService.gerar(context.userId!, context.plano, payload, trialExpired);
      return ok(relatorio, 201);
    } catch (error) {
      return fail(error);
    }
  };

  exportPdf = async (request: Request, context: RequestContext) => {
    try {
      const query = exportRelatorioQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const trialExpired = context.session?.user?.trialExpired !== false;
      const payload = await this.relatorioService.exportarPdf(context.userId!, context.plano, query.relatorioId, trialExpired);
      const fileBuffer = Buffer.from(payload.bytes);

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"${payload.fileName}\"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      return fail(error);
    }
  };

  remove = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const removed = await this.relatorioService.remover(context.userId!, parsed.id);
      return ok(removed);
    } catch (error) {
      return fail(error);
    }
  };
}
