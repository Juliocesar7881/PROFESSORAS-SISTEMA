import { z } from "zod";

export const createAlunoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  dataNasc: z.coerce.date(),
  turmaId: z.string().cuid(),
});

export const updateAlunoSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  dataNasc: z.coerce.date().optional(),
  fotoKey: z.string().optional(),
});

export const alunoQuerySchema = z.object({
  turmaId: z.string().cuid().optional(),
});

export type CreateAlunoInput = z.infer<typeof createAlunoSchema>;
export type UpdateAlunoInput = z.infer<typeof updateAlunoSchema>;
