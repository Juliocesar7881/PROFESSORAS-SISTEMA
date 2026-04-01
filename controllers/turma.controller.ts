import { createTurmaSchema } from "@/dtos/turma.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { TurmaService } from "@/services/turma.service";

export class TurmaController {
  private readonly turmaService = new TurmaService();

  list = async (_request: Request, context: RequestContext) => {
    try {
      const turmas = await this.turmaService.list(context.userId!);
      return ok(turmas);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: Request, context: RequestContext) => {
    try {
      const payload = createTurmaSchema.parse(await request.json());
      const turma = await this.turmaService.create(context.userId!, payload);
      return ok(turma, 201);
    } catch (error) {
      return fail(error);
    }
  };
}
