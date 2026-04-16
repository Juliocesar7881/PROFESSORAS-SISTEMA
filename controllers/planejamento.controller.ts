import { planejamentoQuerySchema, createPlanejamentoSchema } from "@/dtos/planejamento.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { PlanejamentoService } from "@/services/planejamento.service";

export class PlanejamentoController {
  private readonly planejamentoService = new PlanejamentoService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = planejamentoQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const planejamentos = await this.planejamentoService.list(context.userId!, query.turmaId, query.semanaInicio);
      const streak = await this.planejamentoService.streak(context.userId!);

      return ok({
        planejamentos,
        streak,
      });
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: Request, context: RequestContext) => {
    try {
      const payload = createPlanejamentoSchema.parse(await request.json());
      const trialExpired = context.session?.user?.trialExpired !== false;
      const planejamento = await this.planejamentoService.create(context.userId!, context.plano, payload, trialExpired);
      return ok(planejamento, 201);
    } catch (error) {
      return fail(error);
    }
  };
}
