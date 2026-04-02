import { z } from "zod";

import { createTurmaSchema, updateTurmaSchema } from "@/dtos/turma.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { TurmaService } from "@/services/turma.service";

const pathSchema = z.object({
  id: z.string().cuid(),
});

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

  update = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const payload = updateTurmaSchema.parse(await request.json());
      const turma = await this.turmaService.update(context.userId!, parsed.id, payload);
      return ok(turma);
    } catch (error) {
      return fail(error);
    }
  };

  remove = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const turma = await this.turmaService.remove(context.userId!, parsed.id);
      return ok(turma);
    } catch (error) {
      return fail(error);
    }
  };
}
