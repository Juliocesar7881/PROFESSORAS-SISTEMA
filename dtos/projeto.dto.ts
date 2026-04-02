import { z } from "zod";

import { ETAPA_VALUES } from "@/lib/etapa";

export const projetoQuerySchema = z.object({
  categoria: z.string().optional(),
  faixaEtaria: z.string().optional(),
  etapa: z.enum(ETAPA_VALUES).optional(),
  turmaId: z.string().cuid().optional(),
  duracao: z.string().optional(),
  busca: z.string().optional(),
  salvos: z.coerce.boolean().optional(),
});

export type ProjetoQueryInput = z.infer<typeof projetoQuerySchema>;
