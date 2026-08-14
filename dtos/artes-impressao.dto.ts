import { z } from "zod";

export const artesImpressaoPresetSchema = z.enum([
  "one",
  "two",
  "four",
  "grid",
  "story-two",
  "story-three",
  "story-four",
  "story-column",
]);

export const artesImpressaoFotosQuerySchema = z.object({
  turmaId: z.string().cuid().optional(),
  alunoId: z.string().cuid().optional(),
  periodo: z.enum(["7", "30", "90", "180", "todos"]).default("90"),
  limit: z.coerce.number().int().min(1).max(120).optional(),
});

export const artesImpressaoItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("existing"),
    id: z.string().cuid(),
  }),
  z.object({
    type: z.literal("upload"),
    id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  }),
]);

export const artesImpressaoUploadMetaSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  alunoNome: z.string().trim().max(120).optional(),
  turmaNome: z.string().trim().max(120).optional(),
  createdAt: z.coerce.date().optional(),
  relato: z.string().trim().max(1800).optional(),
});

export const artesImpressaoExportSchema = z.object({
  preset: artesImpressaoPresetSchema,
  items: z.array(artesImpressaoItemSchema).min(1).max(40),
  uploadMeta: z.array(artesImpressaoUploadMetaSchema).max(40).default([]),
  titulo: z.string().trim().max(90).optional(),
  legenda: z.string().trim().max(280).optional(),
  nomeEscola: z.string().trim().max(120).optional(),
  nomeProfessora: z.string().trim().max(120).optional(),
  dataLabel: z.string().trim().max(80).optional(),
  includeAlunoName: z.boolean().default(true),
  includeTurmaName: z.boolean().default(true),
  includeDate: z.boolean().default(true),
});

export type ArtesImpressaoFotosQueryInput = z.infer<typeof artesImpressaoFotosQuerySchema>;
export type ArtesImpressaoExportInput = z.infer<typeof artesImpressaoExportSchema>;
export type ArtesImpressaoPreset = z.infer<typeof artesImpressaoPresetSchema>;
