import { CategoriaObservacao } from "@prisma/client";
import { z } from "zod";

export const createObservacaoSchema = z.object({
  texto: z.string().trim().min(3).max(2000),
  categoria: z.nativeEnum(CategoriaObservacao).default(CategoriaObservacao.APRENDIZAGEM),
  alunoId: z.string().cuid(),
});

export const observacaoQuerySchema = z.object({
  alunoId: z.string().cuid(),
  categoria: z.nativeEnum(CategoriaObservacao).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

export type CreateObservacaoInput = z.infer<typeof createObservacaoSchema>;
export type ObservacaoQueryInput = z.infer<typeof observacaoQuerySchema>;
