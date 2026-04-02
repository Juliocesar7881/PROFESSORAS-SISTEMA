"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Upload, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrefeituraNote } from "@/components/prefeitura-note";

const faixaEtariaOptions = [
  "Berçário (0-1 ano)",
  "Maternal I (1-2 anos)",
  "Maternal II (2-3 anos)",
  "Jardim I (3-4 anos)",
  "Jardim II (4-5 anos)",
  "Pré I (5-6 anos)",
  "Pré II (6-7 anos)",
  "1º ano",
  "2º ano",
  "3º ano",
];

const alunoSchema = z.object({
  nome: z.string().min(2),
  dataNasc: z.string().min(1),
});

const onboardingFormSchema = z.object({
  turmaNome: z.string().min(2),
  faixaEtaria: z.string().min(2),
  ano: z.number().int().min(2020),
  alunosTexto: z.string(),
  consentimentoLGPD: z.boolean().refine((value) => value),
});

type OnboardingFormInput = z.infer<typeof onboardingFormSchema>;

interface OnboardingWizardProps {
  userName: string;
  userImage?: string | null;
}

export function OnboardingWizard({ userName, userImage }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [parsedCsvAlunos, setParsedCsvAlunos] = useState<Array<{ nome: string; dataNasc: string }>>([]);

  const form = useForm<OnboardingFormInput>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      turmaNome: "",
      faixaEtaria: "",
      ano: new Date().getFullYear(),
      alunosTexto: "",
      consentimentoLGPD: false,
    },
  });

  const alunosTexto = form.watch("alunosTexto");

  const alunosManuais = useMemo(() => {
    const linhas = alunosTexto
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean);

    return linhas
      .map((linha) => {
        const [nome, dataNasc] = linha.split(";").map((item) => item?.trim());
        const parsed = alunoSchema.safeParse({ nome, dataNasc });
        return parsed.success ? parsed.data : null;
      })
      .filter(Boolean) as Array<{ nome: string; dataNasc: string }>;
  }, [alunosTexto]);

  const alunosFinal = parsedCsvAlunos.length ? parsedCsvAlunos : alunosManuais;

  const goToTurmaStep = () => setStep(2);

  const goToAlunosStep = async () => {
    const valid = await form.trigger(["turmaNome", "faixaEtaria", "ano"]);

    if (!valid) {
      toast.error("Preencha os dados da turma para continuar");
      return;
    }

    setStep(3);
  };

  const handleCsvImport = (file?: File | null) => {
    if (!file) return;

    Papa.parse<{ nome: string; dataNasc: string }>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = result.data
          .map((row) => alunoSchema.safeParse({ nome: row.nome, dataNasc: row.dataNasc }))
          .filter((r) => r.success)
          .map((r) => r.data);

        setParsedCsvAlunos(parsed);
        toast.success(`${parsed.length} alunos importados via CSV`);
      },
    });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!alunosFinal.length) {
      toast.error("Adicione ao menos um aluno manualmente ou por CSV");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: {
          nome: values.turmaNome,
          faixaEtaria: values.faixaEtaria,
          ano: values.ano,
        },
        alunos: alunosFinal.map((aluno) => ({
          nome: aluno.nome,
          dataNasc: aluno.dataNasc,
        })),
        consentimentoLGPD: values.consentimentoLGPD,
      }),
    });

    if (!response.ok) {
      setSaving(false);
      toast.error("Não foi possível concluir o onboarding");
      return;
    }

    toast.success("Onboarding concluído com sucesso! 🎉");
    router.push("/dashboard");
    router.refresh();
  });

  const initials = userName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mesh-bg soft-grid min-h-screen px-4 py-8 md:px-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4">
        <Card className="glass-card border-[#DCECF8]">
          <CardHeader className="pb-2">
            <div className="mb-2 flex items-center gap-2 text-[#0BB8A8]">
              <Sparkles className="size-4" />
              <p className="text-xs uppercase tracking-[0.2em]">Primeiros passos</p>
            </div>
            <div className="flex items-center gap-4">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={48}
                  height={48}
                  className="size-12 rounded-full border-2 border-[#0BB8A8]/30"
                />
              ) : (
                <div className="inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#A855F7] text-sm font-bold text-white">
                  {initials}
                </div>
              )}
              <div>
                <CardTitle className="font-heading text-3xl text-[#1E1740]">Bem-vinda, {userName}! 👋</CardTitle>
                <CardDescription className="text-[#6A638D]">Configure seu Planejei em 3 passos rápidos.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-[#7A739E]">
              <span className={step >= 1 ? "font-semibold text-[#0BB8A8]" : ""}>1. Boas-vindas</span>
              <span className={step >= 2 ? "font-semibold text-[#0BB8A8]" : ""}>2. Turma</span>
              <span className={step >= 3 ? "font-semibold text-[#0BB8A8]" : ""}>3. Alunos</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E7EEF8]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0BB8A8] to-[#FF7B5E]"
                initial={false}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card border-[#DCECF8]">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-[#1E1740]">Passo 1 de 3 — Entenda o posicionamento</CardTitle>
                  <CardDescription className="text-[#6A638D]">Comece com a proposta certa para sua rotina.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#4E4770]">
                    O Planejei é seu assistente pedagógico para organizar planejamento, observações e desenvolvimento de cada criança. Simples, visual e feito para o dia a dia da sala de aula.
                  </p>
                  <PrefeituraNote />
                  <Button type="button" onClick={goToTurmaStep} className="h-11 w-full bg-[#0BB8A8] text-white hover:bg-[#0A9F92] md:w-auto">
                    Continuar
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card border-[#DCECF8]">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-[#1E1740]">Passo 2 de 3 — Criar turma</CardTitle>
                  <CardDescription className="text-[#6A638D]">Defina os dados básicos da sua turma.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6A638D]">Nome da turma</label>
                    <Input placeholder="Ex: Jardim II A" {...form.register("turmaNome")} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6A638D]">Faixa etária</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                      {...form.register("faixaEtaria")}
                    >
                      <option value="">Selecione...</option>
                      {faixaEtariaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6A638D]">Ano letivo</label>
                    <Input type="number" placeholder="2026" {...form.register("ano", { valueAsNumber: true })} />
                  </div>
                </CardContent>
                <CardContent className="flex gap-2">
                  <Button type="button" variant="outline" className="border-[#D8E9F8] bg-white text-[#1E1740] hover:border-[#BDEEE8] hover:bg-[#F2FCFA]" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 size-4" />
                    Voltar
                  </Button>
                  <Button type="button" className="bg-[#0BB8A8] text-white hover:bg-[#0A9F92]" onClick={goToAlunosStep}>
                    Próximo
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card border-[#DCECF8]">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-[#1E1740]">Passo 3 de 3 — Adicionar alunos</CardTitle>
                  <CardDescription className="text-[#6A638D]">Inclua manualmente ou importe por CSV.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#6A638D]">
                      <Users className="mr-1 inline size-3.5" />
                      Um aluno por linha: <code className="rounded bg-[#E7EEF8] px-1 text-[#0BB8A8]">Nome;AAAA-MM-DD</code>
                    </label>
                    <Textarea
                      placeholder={"Maria Silva;2020-03-15\nJoão Santos;2020-07-22"}
                      className="min-h-28"
                      {...form.register("alunosTexto")}
                    />
                  </div>
                  <div className="rounded-xl border border-dashed border-[#CFE2F5] bg-[#F8FBFF] p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm text-[#6A638D]">
                      <Upload className="size-4" />
                      Importar por CSV (colunas: <code className="rounded bg-[#E7EEF8] px-1">nome,dataNasc</code>)
                    </p>
                    <Input type="file" accept=".csv" onChange={(e) => handleCsvImport(e.target.files?.[0])} />
                  </div>

                  <div className="rounded-xl border border-[#BDEEE8] bg-[#E8FBF8] p-3 text-sm text-[#0F8F83]">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4" />
                      Alunos detectados: {alunosFinal.length}
                    </div>
                    <p className="text-[#2C9A8F]">Você pode revisar e editar depois no módulo Alunos.</p>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-[#4E4770]">
                    <input type="checkbox" className="mt-0.5 accent-[#0BB8A8]" {...form.register("consentimentoLGPD")} />
                    Confirmo consentimento explícito para tratamento de dados pedagógicos de menores conforme LGPD.
                  </label>
                </CardContent>

                <CardContent className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="border-[#D8E9F8] bg-white text-[#1E1740] hover:border-[#BDEEE8] hover:bg-[#F2FCFA]" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-1 size-4" />
                    Voltar
                  </Button>
                  <Button type="submit" size="lg" className="h-11 bg-[#0BB8A8] text-white hover:bg-[#0A9F92]" disabled={saving}>
                    {saving ? "Finalizando..." : "Concluir onboarding 🎉"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </main>
  );
}
