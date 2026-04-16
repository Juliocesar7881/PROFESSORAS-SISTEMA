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

const alunoSchema = z.object({
  nome: z.string().min(2),
  dataNasc: z.string().min(1),
});

const onboardingFormSchema = z.object({
  turmaNome: z.string().min(1, "Nome é obrigatório"),
  faixaEtaria: z.string().min(1, "Faixa etária é obrigatória"),
  ano: z.number().int().min(2000, "Ano inválido"),
  alunosTexto: z.string(),
  consentimentoLGPD: z.boolean(),
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
      toast.error("Revise os dados da turma e tente novamente");
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

    if (!values.consentimentoLGPD) {
      toast.error("Confirme o consentimento LGPD para concluir");
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

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      setSaving(false);

      const apiMessage = json?.error?.message as string | undefined;
      const apiCode = json?.error?.code as string | undefined;

      if (response.status === 409 || apiCode === "CONFLICT") {
        toast.success("Seu onboarding já foi concluído. Indo para o dashboard...");
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      toast.error(apiMessage ?? "Não foi possível concluir o onboarding");
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
    <main className="min-h-screen bg-[#FAFBFE] px-4 py-8 md:px-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4">
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="mb-2 flex items-center gap-2 text-[#6C5CE7]">
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
                  className="size-12 rounded-full border-2 border-[#6C5CE7]/30"
                />
              ) : (
                <div className="inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#a78bfa] text-sm font-bold text-white">
                  {initials}
                </div>
              )}
              <div>
                <CardTitle className="font-heading text-3xl text-gray-900">Bem-vinda, {userName}! 👋</CardTitle>
                <CardDescription className="text-gray-500">Configure seu Planejei em 3 passos rápidos.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-gray-400">
              <span className={step >= 1 ? "font-semibold text-[#6C5CE7]" : ""}>1. Boas-vindas</span>
              <span className={step >= 2 ? "font-semibold text-[#6C5CE7]" : ""}>2. Turma</span>
              <span className={step >= 3 ? "font-semibold text-[#6C5CE7]" : ""}>3. Alunos</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#a78bfa]"
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
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-gray-900">Passo 1 de 3 — Entenda o posicionamento</CardTitle>
                  <CardDescription className="text-gray-500">Comece com a proposta certa para sua rotina.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    O Planejei é seu assistente pedagógico para organizar planejamento, observações e desenvolvimento de cada criança. Simples, visual e feito para o dia a dia da sala de aula.
                  </p>
                  <Button type="button" onClick={goToTurmaStep} className="h-11 w-full bg-[#6C5CE7] text-white hover:bg-[#5a4bd6] md:w-auto">
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
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-gray-900">Passo 2 de 3 — Criar turma</CardTitle>
                  <CardDescription className="text-gray-500">Defina os dados básicos da sua turma.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Nome da turma</label>
                    <Input placeholder="Ex: Jardim II A" {...form.register("turmaNome")} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Faixa etária / Ano escolar</label>
                    <Input placeholder="Ex: 1º Ensino Médio" {...form.register("faixaEtaria")} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Ano letivo</label>
                    <Input type="number" placeholder="2026" {...form.register("ano", { valueAsNumber: true })} />
                  </div>
                </CardContent>
                <CardContent className="flex gap-2">
                  <Button type="button" variant="outline" className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 size-4" />
                    Voltar
                  </Button>
                  <Button type="button" className="bg-[#6C5CE7] text-white hover:bg-[#5a4bd6]" onClick={goToAlunosStep}>
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
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-gray-900">Passo 3 de 3 — Adicionar alunos</CardTitle>
                  <CardDescription className="text-gray-500">Inclua manualmente ou importe por CSV.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">
                      <Users className="mr-1 inline size-3.5" />
                      Um aluno por linha: <code className="rounded bg-gray-100 px-1 text-[#6C5CE7]">Nome;AAAA-MM-DD</code>
                    </label>
                    <Textarea
                      placeholder={"Maria Silva;2020-03-15\nJoão Santos;2020-07-22"}
                      className="min-h-28"
                      {...form.register("alunosTexto")}
                    />
                  </div>
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                      <Upload className="size-4" />
                      Importar por CSV (colunas: <code className="rounded bg-gray-100 px-1">nome,dataNasc</code>)
                    </p>
                    <Input type="file" accept=".csv" onChange={(e) => handleCsvImport(e.target.files?.[0])} />
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4" />
                      Alunos detectados: {alunosFinal.length}
                    </div>
                    <p className="text-emerald-500">Você pode revisar e editar depois no módulo Alunos.</p>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-gray-600">
                    <input type="checkbox" className="mt-0.5 accent-[#6C5CE7]" {...form.register("consentimentoLGPD")} />
                    Confirmo consentimento explícito para tratamento de dados pedagógicos de menores conforme LGPD.
                  </label>
                </CardContent>

                <CardContent className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-1 size-4" />
                    Voltar
                  </Button>
                  <Button type="submit" size="lg" className="h-11 bg-[#6C5CE7] text-white hover:bg-[#5a4bd6]" disabled={saving}>
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
