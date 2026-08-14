import { z } from "zod";

export const gerarRelatorioSchema = z.object({
  alunoId: z.string().cuid().optional(),
  nomeCrianca: z.string().trim().max(120).optional(),
  contexto: z.string().trim().max(180).optional(),
  periodo: z.string().trim().min(3).max(80),
  modo: z.enum(["registros", "observacoes", "descricao"]).default("registros"),
  registroIds: z.array(z.string().cuid()).min(1).max(100).optional(),
  descricaoRapida: z.string().trim().max(2500).optional(),
  salvarDescricaoComoObservacao: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.modo === "registros") {
    if (!data.registroIds?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["registroIds"],
        message: "Selecione ao menos um registro.",
      });
    }
    return;
  }

  if (data.modo === "observacoes") {
    if (!data.alunoId) {
      ctx.addIssue({
        code: "custom",
        path: ["alunoId"],
        message: "Selecione um aluno para gerar por observacoes.",
      });
    }
    return;
  }

  if (!data.descricaoRapida || data.descricaoRapida.length < 20) {
    ctx.addIssue({
      code: "custom",
      path: ["descricaoRapida"],
      message: "Descreva o aluno com pelo menos 20 caracteres.",
    });
  }
});

export const exportRelatorioQuerySchema = z.object({
  relatorioId: z.string().cuid(),
  format: z.enum(["pdf", "docx"]).default("pdf"),
});

export const atualizarRelatorioSchema = z.object({
  texto: z.string().trim().min(80, "A avaliação precisa ter pelo menos 80 caracteres.").max(8000),
  nomeCrianca: z.string().trim().max(120).optional(),
  contexto: z.string().trim().max(180).optional(),
  periodo: z.string().trim().min(3).max(80),
});

export type GerarRelatorioInput = z.infer<typeof gerarRelatorioSchema>;
export type ExportRelatorioQueryInput = z.infer<typeof exportRelatorioQuerySchema>;
export type AtualizarRelatorioInput = z.infer<typeof atualizarRelatorioSchema>;
