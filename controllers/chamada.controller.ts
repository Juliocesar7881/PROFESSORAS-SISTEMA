import { chamadaQuerySchema, createChamadaSchema } from "@/dtos/chamada.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { ChamadaService } from "@/services/chamada.service";

export class ChamadaController {
  private readonly chamadaService = new ChamadaService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = chamadaQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const now = new Date();
      const mes = query.mes ?? now.getMonth() + 1;
      const ano = query.ano ?? now.getFullYear();

      const chamadas = await this.chamadaService.listByMonth(context.userId!, query.turmaId, mes, ano);
      return ok(chamadas);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: Request, context: RequestContext) => {
    try {
      const payload = createChamadaSchema.parse(await request.json());
      const chamada = await this.chamadaService.save(context.userId!, payload);
      return ok(chamada, 201);
    } catch (error) {
      return fail(error);
    }
  };
}
