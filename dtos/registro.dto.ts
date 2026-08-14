import { z } from "zod";

const optionalCuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().cuid().optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const queryBoolean = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean(),
);

export const createRegistroSchema = z.object({
  alunoId: z.string().cuid(),
  texto: z.string().trim().min(3).max(5000),
  dataRegistro: z.coerce.date(),
  clientMutationId: z.string().trim().min(8).max(120).optional(),
});

const clientUploadId = z.string().trim().min(8).max(120).regex(/^[a-zA-Z0-9_-]+$/);

export const presignRegistroFotosSchema = z.object({
  uploads: z.array(z.object({
    clientUploadId,
    mimeType: z.literal("image/jpeg"),
    tamanhoBytes: z.coerce.number().int().positive().max(Math.round(1.25 * 1024 * 1024)),
    ordem: z.coerce.number().int().min(0).max(5),
  })).min(1).max(6),
});

export const updateRegistroSchema = z.object({
  alunoId: optionalCuid,
  texto: z.string().trim().min(3).max(5000).optional(),
  dataRegistro: optionalDate,
  removeFotoIds: z.array(z.string().cuid()).max(6).default([]),
  expectedUpdatedAt: optionalDate,
});

export const registroQuerySchema = z.object({
  turmaId: optionalCuid,
  alunoId: optionalCuid,
  dataInicio: optionalDate,
  dataFim: optionalDate,
  updatedSince: optionalDate,
  q: z.string().trim().max(120).optional(),
  cursor: optionalCuid,
  limit: z.coerce.number().int().min(1).max(100).default(30),
  includeTotal: queryBoolean.default(true),
  lixeira: queryBoolean.default(false),
});

export const exportRegistrosSchema = z.object({
  ids: z.array(z.string().cuid()).max(300).optional(),
  filters: registroQuerySchema.omit({ cursor: true, limit: true, includeTotal: true, lixeira: true, updatedSince: true }).optional(),
  delivery: z.enum(["inline", "url"]).default("inline"),
}).refine((data) => Boolean(data.ids?.length || data.filters), {
  message: "Selecione registros ou informe filtros para exportar.",
});

export const transcreverAudioSchema = z.object({
  language: z.string().trim().max(20).default("pt"),
});

export type CreateRegistroInput = z.infer<typeof createRegistroSchema>;
export type PresignRegistroFotosInput = z.infer<typeof presignRegistroFotosSchema>;
export type UpdateRegistroInput = z.infer<typeof updateRegistroSchema>;
export type RegistroQueryInput = z.infer<typeof registroQuerySchema>;
export type ExportRegistrosInput = z.infer<typeof exportRegistrosSchema>;
