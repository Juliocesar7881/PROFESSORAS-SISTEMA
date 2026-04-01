import { z } from "zod";

export const gerarRelatorioSchema = z.object({
  alunoId: z.string().cuid(),
  periodo: z.string().trim().min(3).max(80),
});

export type GerarRelatorioInput = z.infer<typeof gerarRelatorioSchema>;
