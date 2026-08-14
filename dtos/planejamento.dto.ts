import { z } from "zod";

const optionalCuidSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().cuid().optional(),
);

const optionalTextSchema = (max = 3000) => z.string().trim().max(max).optional().default("");

const stringListSchema = z.array(z.string().trim().min(1).max(240)).max(12).default([]);

const atividadeSlotSchema = z.object({
  diaSemana: z.number().int().min(1).max(5),
  horario: z.string().trim().max(20).optional().default(""),
  ordem: z.number().int().min(0).max(500).optional().default(0),
  atividadeId: optionalCuidSchema,
  objetivosTexto: optionalTextSchema(),
  atividadeTexto: optionalTextSchema(5000),
}).superRefine((data, ctx) => {
  if (data.atividadeId || data.atividadeTexto || data.objetivosTexto) {
    return;
  }

  ctx.addIssue({
    code: "custom",
    path: ["atividadeTexto"],
    message: "Informe uma atividade do banco ou escreva uma atividade manual.",
  });
});

export const createPlanejamentoSchema = z.object({
  turmaId: optionalCuidSchema,
  grupoNome: optionalTextSchema(120),
  semanaInicio: z.coerce.date(),
  semanaFim: z.coerce.date(),
  projetoBaseId: optionalCuidSchema,
  camposExperiencia: stringListSchema,
  direitosAprendizagem: stringListSchema,
  nomeInstituicao: optionalTextSchema(120),
  nomeProfessora: optionalTextSchema(120),
  atividades: z.array(atividadeSlotSchema).min(1).max(200),
});

export const planejamentoQuerySchema = z.object({
  turmaId: optionalCuidSchema,
  semanaInicio: z.coerce.date().optional(),
});

export const planejamentoExportQuerySchema = z.object({
  planejamentoId: z.string().cuid(),
  format: z.enum(["pdf", "docx"]).default("pdf"),
});

export type CreatePlanejamentoInput = z.infer<typeof createPlanejamentoSchema>;
export type PlanejamentoExportQueryInput = z.infer<typeof planejamentoExportQuerySchema>;
