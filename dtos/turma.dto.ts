import { z } from "zod";

export const createTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  faixaEtaria: z.string().trim().min(1).max(80),
  ano: z.coerce.number().int().min(2000).max(2100),
});

export const updateTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(120).optional(),
  faixaEtaria: z.string().trim().min(1).max(80).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
