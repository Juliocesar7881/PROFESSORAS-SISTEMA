import { z } from "zod";

export const onboardingSchema = z.object({
  turma: z.object({
    nome: z.string().trim().min(1).max(120),
    faixaEtaria: z.string().trim().min(1).max(80),
    ano: z.coerce.number().int().min(2000).max(2100),
  }),
  alunos: z
    .array(
      z.object({
        nome: z.string().trim().min(1).max(120),
        dataNasc: z.coerce.date().optional(),
      }),
    )
    .min(1, { message: "Adicione ao menos um aluno" }),
  consentimentoLGPD: z.boolean().refine((value) => value, {
    message: "Consentimento LGPD obrigatorio",
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
