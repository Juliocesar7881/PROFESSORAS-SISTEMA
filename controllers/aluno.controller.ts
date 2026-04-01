import { z } from "zod";

import { alunoQuerySchema, createAlunoSchema, updateAlunoSchema } from "@/dtos/aluno.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { AlunoService } from "@/services/aluno.service";

const pathSchema = z.object({
  id: z.string().cuid(),
});

export class AlunoController {
  private readonly alunoService = new AlunoService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = alunoQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const alunos = await this.alunoService.list(context.userId!, query.turmaId);
      return ok(alunos);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: Request, context: RequestContext) => {
    try {
      const payload = createAlunoSchema.parse(await request.json());
      const aluno = await this.alunoService.create(context.userId!, payload);
      return ok(aluno, 201);
    } catch (error) {
      return fail(error);
    }
  };

  detail = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const aluno = await this.alunoService.detail(context.userId!, parsed.id);
      return ok(aluno);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const payload = updateAlunoSchema.parse(await request.json());
      const aluno = await this.alunoService.update(context.userId!, parsed.id, payload);
      return ok(aluno);
    } catch (error) {
      return fail(error);
    }
  };

  remove = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const parsed = pathSchema.parse(params);
      const aluno = await this.alunoService.remove(context.userId!, parsed.id);
      return ok(aluno);
    } catch (error) {
      return fail(error);
    }
  };
}
