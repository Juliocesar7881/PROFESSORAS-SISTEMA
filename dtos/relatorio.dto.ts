import { z } from "zod";

export const gerarRelatorioSchema = z.object({
  alunoId: z.string().cuid(),
  periodo: z.string().trim().min(3).max(80),
});

export const exportRelatorioQuerySchema = z.object({
  relatorioId: z.string().cuid(),
});

export type GerarRelatorioInput = z.infer<typeof gerarRelatorioSchema>;
export type ExportRelatorioQueryInput = z.infer<typeof exportRelatorioQuerySchema>;
