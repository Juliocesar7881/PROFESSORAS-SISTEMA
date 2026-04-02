"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCheck, CircleCheckBig, CircleX, Loader2, Search, TriangleAlert, Users } from "lucide-react";

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

type PresencaState = Record<string, { presente: boolean; justificativa: string }>;

function toDateInput(value: Date) {
  const timezoneOffsetMs = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function normalizeDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value.includes("T") ? value : `${value}T00:00:00`) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return toDateInput(date);
}

function createDefaultPresenceMap(alunos: Aluno[]): PresencaState {
  return Object.fromEntries(
    alunos.map((aluno) => [
      aluno.id,
      {
        presente: true,
        justificativa: "",
      },
    ]),
  ) as PresencaState;
}

export default function ChamadaPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [historico, setHistorico] = useState<HistoricoChamada[]>([]);
  const [data, setData] = useState(toDateInput(new Date()));
  const [searchAluno, setSearchAluno] = useState("");
  const [presencas, setPresencas] = useState<PresencaState>({});
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(true);
  const [isLoadingAlunos, setIsLoadingAlunos] = useState(false);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const presentesCount = useMemo(
    () => Object.values(presencas).filter((item) => item.presente).length,
    [presencas],
  );

  const faltasCount = Math.max(0, alunos.length - presentesCount);
  const taxaPresenca = alunos.length ? Math.round((presentesCount / alunos.length) * 100) : 0;

  const alunosFiltrados = useMemo(() => {
    const search = searchAluno.trim().toLowerCase();

    if (!search) {
      return alunos;
    }

    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(search));
  }, [alunos, searchAluno]);

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

  const calendarioMes = useMemo(() => {
    const selectedDate = new Date(`${data}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return [] as Array<{ key: string; day: number; ratio: number | null }>;
    }

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const map = new Map<string, number>();
    for (const registro of historico) {
      const dateKey = normalizeDateKey(registro.data);
      const total = registro.presencas.length;
      const presentes = registro.presencas.filter((item) => item.presente).length;
      map.set(dateKey, total ? presentes / total : 0);
    }

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const key = toDateInput(new Date(year, month, day));

      return {
        key,
        day,
        ratio: map.has(key) ? map.get(key)! : null,
      };
    });
  }, [data, historico]);

  const loadHistoricoByMonth = useCallback(async (turmaId: string, dateValue: string) => {
    setIsLoadingHistorico(true);

    try {
      const currentDate = new Date(`${dateValue}T00:00:00`);
      const mes = currentDate.getMonth() + 1;
      const ano = currentDate.getFullYear();

      const response = await fetch(`/api/chamada?turmaId=${turmaId}&mes=${mes}&ano=${ano}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar histórico de chamada");
      }

      const historyData = (json.data ?? []) as HistoricoChamada[];
      setHistorico(historyData);
      return historyData;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar histórico de chamada";
      toast.error(message);
      setHistorico([]);
      return [] as HistoricoChamada[];
    } finally {
      setIsLoadingHistorico(false);
    }
  }, []);

  useEffect(() => {
    const loadTurmas = async () => {
      setIsLoadingTurmas(true);

      try {
        const response = await fetch("/api/turmas");
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error?.message ?? "Falha ao carregar turmas");
        }

        const turmasData = (json.data ?? []) as Turma[];
        setTurmas(turmasData);

        if (turmasData[0]) {
          setSelectedTurma((current) => current || turmasData[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar turmas";
        toast.error(message);
        setTurmas([]);
      } finally {
        setIsLoadingTurmas(false);
      }
    };

    void loadTurmas();
  }, []);

  useEffect(() => {
    const loadAlunos = async () => {
      if (!selectedTurma) return;

      setIsLoadingAlunos(true);

      try {
        const response = await fetch(`/api/alunos?turmaId=${selectedTurma}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error?.message ?? "Falha ao carregar alunos");
        }

        const alunosData = (json.data ?? []) as Aluno[];
        setAlunos(alunosData);
        setPresencas(createDefaultPresenceMap(alunosData));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar alunos";
        toast.error(message);
        setAlunos([]);
        setPresencas({});
      } finally {
        setIsLoadingAlunos(false);
      }
    };

    void loadAlunos();
  }, [selectedTurma]);

  useEffect(() => {
    if (!selectedTurma) {
      return;
    }

    void loadHistoricoByMonth(selectedTurma, data);
  }, [selectedTurma, data, loadHistoricoByMonth]);

  useEffect(() => {
    if (!alunos.length) {
      setPresencas({});
      return;
    }

    const defaults = createDefaultPresenceMap(alunos);
    const selectedDateKey = normalizeDateKey(data);
    const registroAtual = historico.find((item) => normalizeDateKey(item.data) === selectedDateKey);

    if (!registroAtual) {
      setPresencas(defaults);
      return;
    }

    for (const presenca of registroAtual.presencas) {
      if (!defaults[presenca.alunoId]) {
        continue;
      }

      defaults[presenca.alunoId] = {
        presente: presenca.presente,
        justificativa: presenca.justificativa ?? "",
      };
    }

    setPresencas(defaults);
  }, [alunos, historico, data]);

  const setAllPresences = (presente: boolean) => {
    setPresencas((prev) =>
      Object.fromEntries(
        alunos.map((aluno) => [
          aluno.id,
          {
            presente,
            justificativa: presente ? "" : prev[aluno.id]?.justificativa ?? "",
          },
        ]),
      ) as PresencaState,
    );
  };

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

    setIsSaving(true);

    try {
      const response = await fetch("/api/chamada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao salvar chamada");
      }

      const alerts = json.data?.alertas ?? [];
      if (alerts.length) {
        toast.warning("Alerta: existem alunos com 25% ou mais de faltas no mês.");
      } else {
        toast.success("Chamada salva com sucesso.");
      }

      await loadHistoricoByMonth(selectedTurma, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar chamada";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Chamada Digital</CardTitle>
          <CardDescription>Registro rápido de presença da turma, com histórico mensal e alerta de frequência.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr_auto]">
            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
              value={selectedTurma}
              onChange={(event) => setSelectedTurma(event.target.value)}
              disabled={isLoadingTurmas || !turmas.length}
            >
              {!turmas.length && <option value="">Sem turmas cadastradas</option>}
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>

            <Input type="date" value={data} onChange={(event) => setData(event.target.value)} />

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                className="border-slate-200 bg-slate-50 pl-9"
                placeholder="Buscar aluno"
                value={searchAluno}
                onChange={(event) => setSearchAluno(event.target.value)}
              />
            </div>

            <div className="flex min-w-[175px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span>{presentesCount}/{alunos.length} presentes</span>
              <CalendarDays className="size-4 text-slate-400" />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">Presentes</p>
              <p className="text-xl font-bold">{presentesCount}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">Faltas</p>
              <p className="text-xl font-bold">{faltasCount}</p>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">Taxa de presença</p>
              <p className="text-xl font-bold">{taxaPresenca}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              onClick={() => setAllPresences(true)}
              disabled={!alunos.length}
            >
              <CheckCheck className="mr-2 size-4" />
              Marcar todos presentes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              onClick={() => setAllPresences(false)}
              disabled={!alunos.length}
            >
              <CircleX className="mr-2 size-4" />
              Marcar todos com falta
            </Button>
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <Users className="size-3.5" />
              {alunosFiltrados.length} aluno(s) exibido(s)
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4 md:p-6">
          {(isLoadingAlunos || isLoadingHistorico) && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <Loader2 className="size-4 animate-spin" />
              Carregando dados da chamada...
            </div>
          )}

          {!isLoadingAlunos && !alunosFiltrados.length && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {alunos.length
                ? "Nenhum aluno encontrado para a busca atual."
                : "Nenhum aluno encontrado para esta turma."}
            </div>
          )}

          {!isLoadingAlunos &&
            alunosFiltrados.map((aluno) => {
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
                      <div className="relative inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-xs font-bold text-white">
                        <span>{initials}</span>
                        <span className="absolute -bottom-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600 shadow-sm">foto</span>
                      </div>
                      <p className="font-semibold text-slate-900">{aluno.nome}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-11 items-center justify-center gap-1 rounded-xl border px-4 text-sm font-semibold transition",
                          state.presente
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300",
                        )}
                        onClick={() =>
                          setPresencas((prev) => ({
                            ...prev,
                            [aluno.id]: { ...prev[aluno.id], presente: true, justificativa: "" },
                          }))
                        }
                      >
                        <CircleCheckBig className="size-4" />
                        Presente
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-11 items-center justify-center gap-1 rounded-xl border px-4 text-sm font-semibold transition",
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-slate-600">
              Resumo do dia: <strong className="text-emerald-600">{presentesCount} presentes</strong> e <strong className="text-rose-600">{faltasCount} faltas</strong>.
            </p>
            <Button
              type="button"
              className="h-11 rounded-xl bg-rose-500 px-8 text-white hover:bg-rose-600"
              onClick={saveAttendance}
              disabled={isSaving || !alunos.length}
            >
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {isSaving ? "Salvando..." : "Salvar chamada"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Histórico do mês</CardTitle>
            <CardDescription>Últimos registros da turma e visão em calendário</CardDescription>
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

            {!historico.length && <p className="text-sm text-slate-500">Sem chamadas registradas neste mês.</p>}

            {!!calendarioMes.length && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Calendário de frequência</p>
                <div className="grid grid-cols-7 gap-1">
                  {calendarioMes.map((item) => {
                    const colorClass =
                      item.ratio === null
                        ? "bg-slate-100 text-slate-400"
                        : item.ratio >= 0.9
                          ? "bg-emerald-200 text-emerald-900"
                          : item.ratio >= 0.75
                            ? "bg-emerald-100 text-emerald-800"
                            : item.ratio >= 0.5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800";

                    return (
                      <div
                        key={item.key}
                        className={`inline-flex h-8 items-center justify-center rounded-md text-[11px] font-semibold ${colorClass}`}
                        title={item.ratio === null ? `Dia ${item.day}: sem registro` : `Dia ${item.day}: ${Math.round(item.ratio * 100)}% presentes`}
                      >
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Frequência por aluno</CardTitle>
            <CardDescription>Alerta automático para 25% ou mais de faltas no mês</CardDescription>
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
                  Alerta de frequência
                </div>
                <p>{alertasFrequencia.length} aluno(s) com 25% ou mais de faltas neste mês.</p>
              </div>
            )}

            {!ausenciaPorAluno.length && <p className="text-sm text-slate-500">Dados insuficientes para calcular frequência.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
