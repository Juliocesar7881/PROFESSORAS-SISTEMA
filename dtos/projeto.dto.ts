import { z } from "zod";

const optionalQueryBoolean = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean().optional(),
);

import { ETAPA_VALUES } from "@/lib/etapa";

export const projetoQuerySchema = z.object({
  categoria: z.string().optional(),
  faixaEtaria: z.string().optional(),
  etapa: z.enum(ETAPA_VALUES).optional(),
  duracao: z.string().optional(),
  busca: z.string().optional(),
  salvos: optionalQueryBoolean,
  origem: z.enum(["CATALOGO", "IMPORTADO"]).optional(),
  includeAtividades: optionalQueryBoolean,
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(80).optional(),
});

const optionalDocumentText = (max = 12000) => z.string().trim().max(max).optional().default("");
const documentList = (maxItems = 40, maxLength = 1200) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).default([]);

export const projetoImportadoAtividadeSchema = z.object({
  titulo: z.string().trim().min(2).max(180),
  objetivoTexto: optionalDocumentText(3000),
  descricao: z.string().trim().min(3).max(6000),
  materiais: documentList(30, 180),
});

export const projetoImportadoDraftSchema = z.object({
  titulo: z.string().trim().min(3).max(180),
  descricao: z.string().trim().min(10).max(3000),
  categoria: z.string().trim().min(2).max(80).default("Projeto importado"),
  faixaEtaria: z.string().trim().min(2).max(120).default("Etapa a definir"),
  duracao: z.string().trim().min(1).max(80).default("A definir"),
  bnccObjetivos: documentList(30, 80),
  problema: optionalDocumentText(3000),
  justificativa: optionalDocumentText(),
  objetivoGeral: optionalDocumentText(5000),
  objetivosEspecificos: documentList(),
  camposExperiencia: documentList(20, 500),
  metodologia: documentList(80, 2000),
  cronograma: optionalDocumentText(6000),
  avaliacao: documentList(60, 1200),
  atividades: z.array(projetoImportadoAtividadeSchema).min(1).max(100),
});

export const confirmarImportacaoProjetoSchema = projetoImportadoDraftSchema.extend({
  importacaoId: z.string().cuid(),
});

export const projetoExportQuerySchema = z.object({
  format: z.enum(["pdf", "docx"]).default("pdf"),
});

export type ProjetoQueryInput = z.infer<typeof projetoQuerySchema>;
export type ProjetoExportQueryInput = z.infer<typeof projetoExportQuerySchema>;
export type ProjetoImportadoDraft = z.infer<typeof projetoImportadoDraftSchema>;
export type ConfirmarImportacaoProjetoInput = z.infer<typeof confirmarImportacaoProjetoSchema>;
