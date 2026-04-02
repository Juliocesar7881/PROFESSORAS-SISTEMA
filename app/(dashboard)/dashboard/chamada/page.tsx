"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CircleCheckBig, CircleX, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Turma = { id: string; nome: string };
type Aluno = { id: string; nome: string };
type HistoricoChamada = {
  id: string;
  data: string;
  presencas: Array<{
    alunoId: string;
    presente: boolean;
    justificativa: string | null;
    aluno: {
      id: string;
      nome: string;
    };
  }>;
};

export default function ChamadaPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [historico, setHistorico] = useState<HistoricoChamada[]>([]);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [presencas, setPresencas] = useState<Record<string, { presente: boolean; justificativa: string }>>({});

  const presentesCount = useMemo(
    () => Object.values(presencas).filter((item) => item.presente).length,
    [presencas],
  );

  useEffect(() => {
    const loadTurmas = async () => {
      const response = await fetch("/api/turmas");
      const json = await response.json();
      const turmasData = json.data ?? [];
      setTurmas(turmasData);
      if (turmasData[0]) {
        setSelectedTurma(turmasData[0].id);
      }
    };

    void loadTurmas();
  }, []);

  useEffect(() => {
    const loadAlunos = async () => {
      if (!selectedTurma) return;

      const response = await fetch(`/api/alunos?turmaId=${selectedTurma}`);
      const json = await response.json();
      const alunosData = json.data ?? [];
      setAlunos(alunosData);
      setPresencas(
        Object.fromEntries(
          alunosData.map((aluno: Aluno) => [
            aluno.id,
            {
              presente: true,
              justificativa: "",
            },
          ]),
        ),
      );
    };

    void loadAlunos();
  }, [selectedTurma]);

  useEffect(() => {
    const loadHistorico = async () => {
      if (!selectedTurma) return;

      const currentDate = new Date(data);
      const mes = currentDate.getMonth() + 1;
      const ano = currentDate.getFullYear();

      const response = await fetch(`/api/chamada?turmaId=${selectedTurma}&mes=${mes}&ano=${ano}`);
      const json = await response.json();
      setHistorico(json.data ?? []);
    };

    void loadHistorico();
  }, [selectedTurma, data]);

  const ausenciaPorAluno = useMemo(() => {
    const counters = new Map<string, { nome: string; faltas: number; total: number }>();

    historico.forEach((chamada) => {
      chamada.presencas.forEach((presenca) => {
        const entry = counters.get(presenca.alunoId) ?? {
          nome: presenca.aluno.nome,
          faltas: 0,
          total: 0,
        };

        entry.total += 1;
        if (!presenca.presente) {
          entry.faltas += 1;
        }

        counters.set(presenca.alunoId, entry);
      });
    });

    return Array.from(counters.values())
      .map((item) => ({
        ...item,
        taxa: item.total ? item.faltas / item.total : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa);
  }, [historico]);

  const alertasFrequencia = ausenciaPorAluno.filter((item) => item.taxa >= 0.25);
  const faltasCount = Math.max(0, alunos.length - presentesCount);

  const saveAttendance = async () => {
    if (!selectedTurma) {
      toast.error("Selecione uma turma");
      return;
    }

    const payload = {
      turmaId: selectedTurma,
      data,
      presencas: Object.entries(presencas).map(([alunoId, state]) => ({
        alunoId,
        presente: state.presente,
        justificativa: state.justificativa || undefined,
      })),
    };

    const response = await fetch("/api/chamada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha ao salvar chamada");
      return;
    }

    const alerts = json.data?.alertas ?? [];
    if (alerts.length) {
      toast.warning("Alerta: existem alunos com 25%+ de faltas no mes");
    } else {
      toast.success("Chamada salva");
    }

    const currentDate = new Date(data);
    const mes = currentDate.getMonth() + 1;
    const ano = currentDate.getFullYear();
    const refreshResponse = await fetch(`/api/chamada?turmaId=${selectedTurma}&mes=${mes}&ano=${ano}`);
    const refreshJson = await refreshResponse.json();
    setHistorico(refreshJson.data ?? []);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Chamada Digital</CardTitle>
          <CardDescription>Registro rapido da presenca da turma, com historico mensal e alerta de frequencia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
            value={selectedTurma}
            onChange={(event) => setSelectedTurma(event.target.value)}
          >
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>

          <Input type="date" value={data} onChange={(event) => setData(event.target.value)} />

          <div className="flex min-w-[175px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span>{presentesCount}/{alunos.length} presentes</span>
            <CalendarDays className="size-4 text-slate-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4 md:p-6">
          {alunos.map((aluno) => {
            const state = presencas[aluno.id] ?? { presente: true, justificativa: "" };
            const initials = aluno.nome
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase();

            return (
              <article key={aluno.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-xs font-bold text-white">
                      {initials}
                    </div>
                    <p className="font-semibold text-slate-900">{aluno.nome}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={cn(
                        "inline-flex h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold transition",
                        state.presente
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300",
                      )}
                      onClick={() =>
                        setPresencas((prev) => ({
                          ...prev,
                          [aluno.id]: { ...prev[aluno.id], presente: true },
                        }))
                      }
                    >
                      <CircleCheckBig className="size-4" />
                      Presente
                    </button>

                    <button
                      className={cn(
                        "inline-flex h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold transition",
                        !state.presente
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-rose-300",
                      )}
                      onClick={() =>
                        setPresencas((prev) => ({
                          ...prev,
                          [aluno.id]: { ...prev[aluno.id], presente: false },
                        }))
                      }
                    >
                      <CircleX className="size-4" />
                      Falta
                    </button>
                  </div>
                </div>

                {!state.presente && (
                  <Input
                    className="mt-3"
                    placeholder="Justificativa da falta"
                    value={state.justificativa}
                    onChange={(event) =>
                      setPresencas((prev) => ({
                        ...prev,
                        [aluno.id]: { ...prev[aluno.id], justificativa: event.target.value },
                      }))
                    }
                  />
                )}
              </article>
            );
          })}

          {!alunos.length && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhum aluno encontrado para esta turma.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-slate-600">
              Resumo do dia: <strong className="text-emerald-600">{presentesCount} presentes</strong> e <strong className="text-rose-600">{faltasCount} faltas</strong>.
            </p>
            <Button className="h-11 rounded-xl bg-rose-500 px-8 text-white hover:bg-rose-600" onClick={saveAttendance}>
              Salvar chamada
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Historico do mes</CardTitle>
            <CardDescription>Ultimos registros da turma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.slice(0, 6).map((item) => {
              const total = item.presencas.length;
              const presentes = item.presencas.filter((p) => p.presente).length;

              return (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{new Date(item.data).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs text-slate-500">{presentes}/{total} presentes</p>
                </div>
              );
            })}

            {!historico.length && <p className="text-sm text-slate-500">Sem chamadas registradas neste mes.</p>}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Frequencia por aluno</CardTitle>
            <CardDescription>Alerta automatico para 25%+ de faltas no mes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ausenciaPorAluno.slice(0, 8).map((item) => (
              <div key={item.nome} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center justify-between text-sm text-slate-800">
                  <p>{item.nome}</p>
                  <p>{Math.round(item.taxa * 100)}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn("h-full rounded-full", item.taxa >= 0.25 ? "bg-rose-500" : "bg-emerald-500")}
                    style={{ width: `${Math.round(item.taxa * 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {!!alertasFrequencia.length && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <TriangleAlert className="size-4" />
                  Alerta de frequencia
                </div>
                <p>{alertasFrequencia.length} aluno(s) com 25% ou mais de faltas neste mes.</p>
              </div>
            )}

            {!ausenciaPorAluno.length && <p className="text-sm text-slate-500">Dados insuficientes para calcular frequencia.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
