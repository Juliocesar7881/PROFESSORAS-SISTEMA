import { z } from "zod";

const queryBoolean = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean(),
);

export const createTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  faixaEtaria: z.string().trim().max(80).optional(),
  turno: z.string().trim().max(40).optional(),
  instituicao: z.string().trim().max(120).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const updateTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(120).optional(),
  faixaEtaria: z.string().trim().max(80).nullable().optional(),
  turno: z.string().trim().max(40).nullable().optional(),
  instituicao: z.string().trim().max(120).nullable().optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const turmaQuerySchema = z.object({
  lixeira: queryBoolean.default(false),
});

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
export type TurmaQueryInput = z.infer<typeof turmaQuerySchema>;
