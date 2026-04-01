import { z } from "zod";

const atividadeSlotSchema = z.object({
  diaSemana: z.number().int().min(1).max(5),
  horario: z.string().trim().min(1).max(20),
  atividadeId: z.string().cuid(),
});

export const createPlanejamentoSchema = z.object({
  turmaId: z.string().cuid(),
  semanaInicio: z.coerce.date(),
  semanaFim: z.coerce.date(),
  atividades: z.array(atividadeSlotSchema).min(1),
});

export const planejamentoQuerySchema = z.object({
  turmaId: z.string().cuid().optional(),
  semanaInicio: z.coerce.date().optional(),
});

export type CreatePlanejamentoInput = z.infer<typeof createPlanejamentoSchema>;
