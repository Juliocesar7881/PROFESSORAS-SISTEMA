import { z } from "zod";

export const onboardingSchema = z.object({
  turma: z.object({
    nome: z.string().trim().min(2).max(120),
    faixaEtaria: z.string().trim().min(2).max(80),
    ano: z.number().int().min(2020).max(2100),
  }),
  alunos: z.array(
    z.object({
      nome: z.string().trim().min(2).max(120),
      dataNasc: z.coerce.date(),
    }),
  ),
  consentimentoLGPD: z.boolean().refine((value) => value, {
    message: "Consentimento LGPD obrigatorio",
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
