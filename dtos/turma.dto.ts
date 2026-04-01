import { z } from "zod";

export const createTurmaSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  faixaEtaria: z.string().trim().min(2).max(80),
  ano: z.coerce.number().int().min(2020).max(2100),
});

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>;
