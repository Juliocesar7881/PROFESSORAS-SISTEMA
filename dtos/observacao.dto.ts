import { CategoriaObservacao } from "@prisma/client";
import { z } from "zod";

export const createObservacaoSchema = z.object({
  texto: z.string().trim().min(3).max(2000),
  categoria: z.nativeEnum(CategoriaObservacao),
  alunoId: z.string().cuid(),
});

export const observacaoQuerySchema = z.object({
  alunoId: z.string().cuid(),
  categoria: z.nativeEnum(CategoriaObservacao).optional(),
});

export type CreateObservacaoInput = z.infer<typeof createObservacaoSchema>;
