import { z } from "zod";

export const createChamadaSchema = z.object({
  turmaId: z.string().cuid(),
  data: z.coerce.date(),
  presencas: z
    .array(
      z.object({
        alunoId: z.string().cuid(),
        presente: z.boolean(),
        justificativa: z.string().max(500).optional(),
      }),
    )
    .min(1),
});

export const chamadaQuerySchema = z.object({
  turmaId: z.string().cuid(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  ano: z.coerce.number().int().min(2020).max(2100).optional(),
});

export type CreateChamadaInput = z.infer<typeof createChamadaSchema>;
