import { z } from "zod";

const queryBoolean = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean(),
);

export const createAlunoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  dataNasc: z.coerce.date().optional(),
  contexto: z.string().trim().max(500).optional(),
  turmaId: z.string().cuid(),
});

export const updateAlunoSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  dataNasc: z.coerce.date().optional(),
  contexto: z.string().trim().max(500).nullable().optional(),
  turmaId: z.string().cuid().optional(),
  fotoKey: z.string().optional(),
});

export const alunoQuerySchema = z.object({
  turmaId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  busca: z.string().trim().max(120).optional(),
  lixeira: queryBoolean.default(false),
});

export type CreateAlunoInput = z.infer<typeof createAlunoSchema>;
export type UpdateAlunoInput = z.infer<typeof updateAlunoSchema>;
export type AlunoQueryInput = z.infer<typeof alunoQuerySchema>;
