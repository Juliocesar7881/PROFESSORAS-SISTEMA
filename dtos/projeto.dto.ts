import { z } from "zod";

export const projetoQuerySchema = z.object({
  categoria: z.string().optional(),
  faixaEtaria: z.string().optional(),
  duracao: z.string().optional(),
  busca: z.string().optional(),
  salvos: z.coerce.boolean().optional(),
});

export type ProjetoQueryInput = z.infer<typeof projetoQuerySchema>;
