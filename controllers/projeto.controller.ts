import { z } from "zod";

import { projetoExportQuerySchema, projetoQuerySchema } from "@/dtos/projeto.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { ProjetoService } from "@/services/projeto.service";

const projetoIdPathSchema = z.object({
  id: z.string().cuid(),
});

export class ProjetoController {
  private readonly projetoService = new ProjetoService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = projetoQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const projetos = await this.projetoService.list(context.userId!, query);
      return ok(projetos);
    } catch (error) {
      return fail(error);
    }
  };

  detail = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = projetoIdPathSchema.parse(params);
      const projeto = await this.projetoService.detail(context.userId!, id);
      return ok(projeto);
    } catch (error) {
      return fail(error);
    }
  };

  exportDocument = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const id = z.string().trim().min(1).parse(params.id);
      const query = projetoExportQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const result = await this.projetoService.exportDocument(context.userId!, id, query.format);

      return new Response(Buffer.from(result.bytes), {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename=\"${result.fileName}\"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      return fail(error);
    }
  };

  save = async (request: Request, context: RequestContext) => {
    try {
      const payload = z.object({ projetoId: z.string().cuid() }).parse(await request.json());
      const saved = await this.projetoService.save(context.userId!, payload.projetoId);
      return ok(saved, 201);
    } catch (error) {
      return fail(error);
    }
  };

  unsave = async (request: Request, context: RequestContext) => {
    try {
      const payload = z.object({ projetoId: z.string().cuid() }).parse(await request.json());
      const result = await this.projetoService.unsave(context.userId!, payload.projetoId);
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  };
}
