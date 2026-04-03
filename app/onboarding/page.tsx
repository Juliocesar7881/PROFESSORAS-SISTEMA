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
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Upload, Users, School, UserCheck } from "lucide-react";

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

const steps = [
  { num: 1, icon: Sparkles, label: "Boas-vindas", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  { num: 2, icon: School, label: "Sua turma", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  { num: 3, icon: Users, label: "Alunos", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
];

const inputCls = "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";
const labelCls = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400";

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
        turma: { nome: values.turmaNome, faixaEtaria: values.faixaEtaria, ano: values.ano },
        alunos: alunosFinal.map((aluno) => ({ nome: aluno.nome, dataNasc: aluno.dataNasc })),
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
    <main
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ background: "linear-gradient(135deg, #F8F7FF 0%, #FAFBFE 60%, #F0FDF9 100%)" }}
    >
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-5%] h-[400px] w-[400px] rounded-full opacity-40 blur-[100px]" style={{ background: "radial-gradient(circle, rgba(108,92,231,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 left-[-5%] h-[300px] w-[300px] rounded-full opacity-30 blur-[80px]" style={{ background: "radial-gradient(circle, rgba(0,184,148,0.12) 0%, transparent 70%)" }} />
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl space-y-5">
        {/* ─── Header card ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-200/60 p-7" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 50%, #7C3AED 100%)" }}>
          <div className="pointer-events-none absolute -top-8 right-[-5%] h-[160px] w-[160px] rounded-full opacity-25 blur-[50px]" style={{ background: "rgba(167, 139, 250, 0.6)" }} />
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={52}
                  height={52}
                  className="size-13 rounded-2xl border-2 border-white/30 shadow-lg"
                />
              ) : (
                <div className="inline-flex size-13 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/20 text-base font-black text-white shadow-lg backdrop-blur-sm">
                  {initials}
                </div>
              )}
              <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-emerald-400 shadow-sm ring-2 ring-white">
                <span className="text-[10px]">✓</span>
              </div>
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
                <Sparkles className="size-3" />
                Primeiros passos
              </div>
              <h1 className="font-heading text-2xl font-bold text-white">Bem-vinda, {userName}! 👋</h1>
              <p className="mt-0.5 text-sm text-white/70">Configure o Planejei em 3 passos rápidos.</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="relative z-10 mt-6 flex items-center gap-2">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex flex-1 items-center">
                <div className={`relative flex flex-1 flex-col items-center gap-1 ${step >= s.num ? "" : "opacity-50"}`}>
                  <div className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${step > s.num ? "border-white bg-white text-violet-600" : step === s.num ? "border-white bg-white/20 text-white backdrop-blur-sm" : "border-white/30 bg-white/10 text-white/60"}`}>
                    {step > s.num ? <CheckCircle2 className="size-4 text-violet-600" /> : s.num}
                  </div>
                  <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`mx-2 mb-4 h-0.5 flex-1 rounded-full transition-all ${step > s.num ? "bg-white" : "bg-white/20"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Animated progress bar */}
          <div className="relative z-10 mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={false}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* ─── Step content ─── */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-50">
                    <Sparkles className="size-5 text-violet-500" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-gray-900">Passo 1 — Entenda o posicionamento</h2>
                    <p className="text-xs text-gray-400">Comece com a proposta certa para sua rotina.</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">
                  O Planejei é seu assistente pedagógico para organizar planejamento, observações e desenvolvimento de cada criança. Simples, visual e feito para o dia a dia da sala de aula.
                </p>
                <div className="mt-5">
                  <PrefeituraNote />
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={goToTurmaStep}
                    className="flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
                  >
                    Continuar
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
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
              <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50">
                    <School className="size-5 text-sky-500" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-gray-900">Passo 2 — Criar turma</h2>
                    <p className="text-xs text-gray-400">Defina os dados básicos da sua turma.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelCls}>Nome da turma</label>
                    <Input
                      className={inputCls}
                      placeholder="Ex: Jardim II A"
                      {...form.register("turmaNome")}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Faixa etária</label>
                    <select
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300 appearance-none"
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
                    <label className={labelCls}>Ano letivo</label>
                    <Input
                      className={inputCls}
                      type="number"
                      placeholder="2026"
                      {...form.register("ano", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="size-4" />
                    Voltar
                  </button>
                  <button
                    type="button"
                    className="flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
                    onClick={goToAlunosStep}
                  >
                    Próximo
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
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
              <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50">
                    <Users className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-gray-900">Passo 3 — Adicionar alunos</h2>
                    <p className="text-xs text-gray-400">Inclua manualmente ou importe por CSV.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>
                      <Users className="mr-1.5 inline size-3.5" />
                      Um aluno por linha:{" "}
                      <code className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] text-violet-600">
                        Nome;AAAA-MM-DD
                      </code>
                    </label>
                    <Textarea
                      placeholder={"Maria Silva;2020-03-15\nJoão Santos;2020-07-22"}
                      className="min-h-28 rounded-xl border-gray-200 bg-white text-sm focus:border-violet-300 focus:ring-violet-100"
                      {...form.register("alunosTexto")}
                    />
                  </div>

                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-5">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <Upload className="size-4 text-gray-400" />
                      Importar por CSV{" "}
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                        colunas: nome, dataNasc
                      </span>
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCsvImport(e.target.files?.[0])}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-600 hover:file:bg-violet-100"
                    />
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100">
                        <UserCheck className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-700">
                          {alunosFinal.length} aluno{alunosFinal.length !== 1 ? "s" : ""} detectado{alunosFinal.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-emerald-500">Você pode revisar e editar depois no módulo Alunos.</p>
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/30">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded accent-violet-600"
                      {...form.register("consentimentoLGPD")}
                    />
                    <span className="text-xs font-medium leading-relaxed text-gray-600">
                      Confirmo consentimento explícito para tratamento de dados pedagógicos de menores conforme LGPD.
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="size-4" />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
                    disabled={saving}
                  >
                    {saving ? "Finalizando..." : "Concluir onboarding 🎉"}
                    {!saving && <CheckCircle2 className="size-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </main>
  );
}
