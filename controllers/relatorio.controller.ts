import { z } from "zod";

import { atualizarRelatorioSchema, exportRelatorioQuerySchema, gerarRelatorioSchema } from "@/dtos/relatorio.dto";
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
          alunoId: z.string().cuid().optional(),
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
      const relatorio = await this.relatorioService.gerar(context.userId!, payload);
      return ok(relatorio, 201);
    } catch (error) {
      return fail(error);
    }
  };

  exportPdf = async (request: Request, context: RequestContext) => {
    try {
      const query = exportRelatorioQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const payload = await this.relatorioService.exportar(context.userId!, query.relatorioId, query.format);
      const fileBuffer = Buffer.from(payload.bytes);

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": payload.contentType,
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

  exportById = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = pathSchema.parse(params);
      const query = z.object({ format: z.enum(["pdf", "docx"]).default("pdf") })
        .parse(Object.fromEntries(new URL(request.url).searchParams));
      const payload = await this.relatorioService.exportar(context.userId!, id, query.format);

      return new Response(new Uint8Array(payload.bytes), {
        status: 200,
        headers: {
          "Content-Type": payload.contentType,
          "Content-Disposition": `attachment; filename=\"${payload.fileName}\"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const payload = atualizarRelatorioSchema.parse(await request.json());
      const relatorio = await this.relatorioService.editar(context.userId!, parsed.id, payload);
      return ok(relatorio);
    } catch (error) {
      return fail(error);
    }
  };
}
