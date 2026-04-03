"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCheck, CircleCheckBig, CircleX, Loader2, Search, TriangleAlert, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Turma = { id: string; nome: string };
type Aluno = { id: string; nome: string };
type HistoricoChamada = {
  id: string;
  data: string;
  presencas: Array<{ alunoId: string; presente: boolean; justificativa: string | null; aluno: { id: string; nome: string } }>;
};
type PresencaState = Record<string, { presente: boolean; justificativa: string }>;

function toDateInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value.includes("T") ? value : `${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return "";
  return toDateInput(date);
}

function createDefaultPresenceMap(alunos: Aluno[]): PresencaState {
  return Object.fromEntries(alunos.map((a) => [a.id, { presente: true, justificativa: "" }])) as PresencaState;
}

const lightSelect = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 appearance-none transition hover:border-gray-300";
const lightInput  = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition hover:border-gray-300";

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

  const presentesCount = useMemo(() => Object.values(presencas).filter((p) => p.presente).length, [presencas]);
  const faltasCount = Math.max(0, alunos.length - presentesCount);
  const taxaPresenca = alunos.length ? Math.round((presentesCount / alunos.length) * 100) : 0;
  const alunosFiltrados = useMemo(() => {
    const q = searchAluno.trim().toLowerCase();
    return q ? alunos.filter((a) => a.nome.toLowerCase().includes(q)) : alunos;
  }, [alunos, searchAluno]);

  const ausenciaPorAluno = useMemo(() => {
    const counters = new Map<string, { nome: string; faltas: number; total: number }>();
    historico.forEach((c) => c.presencas.forEach((p) => {
      const entry = counters.get(p.alunoId) ?? { nome: p.aluno.nome, faltas: 0, total: 0 };
      entry.total += 1;
      if (!p.presente) entry.faltas += 1;
      counters.set(p.alunoId, entry);
    }));
    return Array.from(counters.values()).map((i) => ({ ...i, taxa: i.total ? i.faltas / i.total : 0 })).sort((a, b) => b.taxa - a.taxa);
  }, [historico]);

  const alertasFrequencia = ausenciaPorAluno.filter((i) => i.taxa >= 0.25);

  const calendarioMes = useMemo(() => {
    const sel = new Date(`${data}T00:00:00`);
    if (Number.isNaN(sel.getTime())) return [] as Array<{ key: string; day: number; ratio: number | null }>;
    const year = sel.getFullYear(), month = sel.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const map = new Map<string, number>();
    for (const r of historico) {
      const key = normalizeDateKey(r.data);
      const total = r.presencas.length;
      const presentes = r.presencas.filter((p) => p.presente).length;
      map.set(key, total ? presentes / total : 0);
    }
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const key = toDateInput(new Date(year, month, day));
      return { key, day, ratio: map.has(key) ? map.get(key)! : null };
    });
  }, [data, historico]);

  const loadHistoricoByMonth = useCallback(async (turmaId: string, dateValue: string) => {
    setIsLoadingHistorico(true);
    try {
      const d = new Date(`${dateValue}T00:00:00`);
      const mes = d.getMonth() + 1, ano = d.getFullYear();
      const r = await fetch(`/api/chamada?turmaId=${turmaId}&mes=${mes}&ano=${ano}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      const data_ = (j.data ?? []) as HistoricoChamada[];
      setHistorico(data_);
      return data_;
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setHistorico([]); return [] as HistoricoChamada[]; }
    finally { setIsLoadingHistorico(false); }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoadingTurmas(true);
      try {
        const r = await fetch("/api/turmas");
        const j = await r.json();
        if (!r.ok) throw new Error(j.error?.message ?? "Falha");
        const d = (j.data ?? []) as Turma[];
        setTurmas(d);
        if (d[0]) setSelectedTurma((c) => c || d[0].id);
      } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setTurmas([]); }
      finally { setIsLoadingTurmas(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedTurma) return;
    (async () => {
      setIsLoadingAlunos(true);
      try {
        const r = await fetch(`/api/alunos?turmaId=${selectedTurma}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error?.message ?? "Falha");
        const d = (j.data ?? []) as Aluno[];
        setAlunos(d);
        setPresencas(createDefaultPresenceMap(d));
      } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setAlunos([]); setPresencas({}); }
      finally { setIsLoadingAlunos(false); }
    })();
  }, [selectedTurma]);

  useEffect(() => { if (!selectedTurma) return; void loadHistoricoByMonth(selectedTurma, data); }, [selectedTurma, data, loadHistoricoByMonth]);

  useEffect(() => {
    if (!alunos.length) { setPresencas({}); return; }
    const defaults = createDefaultPresenceMap(alunos);
    const selectedDateKey = normalizeDateKey(data);
    const registroAtual = historico.find((item) => normalizeDateKey(item.data) === selectedDateKey);
    if (!registroAtual) { setPresencas(defaults); return; }
    for (const presenca of registroAtual.presencas) {
      if (!defaults[presenca.alunoId]) continue;
      defaults[presenca.alunoId] = { presente: presenca.presente, justificativa: presenca.justificativa ?? "" };
    }
    setPresencas(defaults);
  }, [alunos, historico, data]);

  const setAllPresences = (presente: boolean) => {
    setPresencas((prev) => Object.fromEntries(alunos.map((a) => [a.id, { presente, justificativa: presente ? "" : prev[a.id]?.justificativa ?? "" }])) as PresencaState);
  };

  const saveAttendance = async () => {
    if (!selectedTurma) { toast.error("Selecione uma turma"); return; }
    setIsSaving(true);
    try {
      const r = await fetch("/api/chamada", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turmaId: selectedTurma, data, presencas: Object.entries(presencas).map(([alunoId, s]) => ({ alunoId, presente: s.presente, justificativa: s.justificativa || undefined })) }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      if ((j.data?.alertas ?? []).length) toast.warning("Alerta: alunos com 25%+ de faltas no mês.");
      else toast.success("Chamada salva com sucesso.");
      await loadHistoricoByMonth(selectedTurma, data);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-sky-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(125, 211, 252, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90">
              <CalendarDays className="size-3" />
              Chamada Digital
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Presenças em tempo real</h2>
            <p className="mt-1 text-sm text-white/70">Registro rápido com histórico mensal e alerta automático de frequência.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-100">
              {presentesCount} presentes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-400/20 px-3 py-1.5 text-xs font-bold text-red-100">
              {faltasCount} faltas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              {taxaPresenca}% presença
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-gray-900">Chamada Digital</CardTitle>
          <CardDescription className="text-gray-500">Registro rápido de presença com histórico mensal e alerta de frequência.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr_auto]">
            <select className={lightSelect} value={selectedTurma} onChange={(e) => setSelectedTurma(e.target.value)} disabled={isLoadingTurmas || !turmas.length}>
              {!turmas.length && <option value="">Sem turmas cadastradas</option>}
              {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
            </select>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={lightInput} />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-gray-400" />
              <input className={`${lightInput} pl-9`} placeholder="Buscar aluno…" value={searchAluno} onChange={(e) => setSearchAluno(e.target.value)} />
            </div>
            <div className="flex min-w-[175px] items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-500">{presentesCount}/{alunos.length} presentes</span>
              <CalendarDays className="size-4 text-gray-400" />
            </div>
          </div>

          {/* Mini stat cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Presentes", value: presentesCount, iconBg: "bg-emerald-50", text: "text-emerald-600", accent: "bg-emerald-500" },
              { label: "Faltas", value: faltasCount, iconBg: "bg-red-50", text: "text-red-500", accent: "bg-red-500" },
              { label: "Taxa de presença", value: `${taxaPresenca}%`, iconBg: "bg-sky-50", text: "text-sky-600", accent: "bg-sky-500" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${stat.text}`}>{stat.label}</p>
                <p className="mt-1 text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setAllPresences(true)} disabled={!alunos.length}
              className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
              <CheckCheck className="mr-2 size-4" /> Marcar todos presentes
            </Button>
            <Button type="button" variant="outline" onClick={() => setAllPresences(false)} disabled={!alunos.length}
              className="rounded-xl border-red-200 bg-red-50 text-red-500 hover:bg-red-100">
              <CircleX className="mr-2 size-4" /> Marcar todos com falta
            </Button>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              <Users className="size-3.5" /> {alunosFiltrados.length} aluno(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4 md:p-6">
          {(isLoadingAlunos || isLoadingHistorico) && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin text-[#6C5CE7]" /> Carregando dados da chamada…
            </div>
          )}
          {!isLoadingAlunos && !alunosFiltrados.length && (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-400">
              {alunos.length ? "Nenhum aluno encontrado para a busca." : "Nenhum aluno encontrado para esta turma."}
            </div>
          )}

          {!isLoadingAlunos && alunosFiltrados.map((aluno) => {
            const state = presencas[aluno.id] ?? { presente: true, justificativa: "" };
            const initials = aluno.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
            return (
              <article key={aluno.id} className={cn(
                "rounded-2xl border p-4 transition-all",
                state.presente ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
              )}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "inline-flex size-11 items-center justify-center rounded-full text-xs font-black text-white shadow-sm",
                      state.presente
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                        : "bg-gradient-to-br from-red-400 to-red-600"
                    )}>
                      {initials}
                    </div>
                    <p className="font-semibold text-gray-800">{aluno.nome}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                    <button type="button"
                      className={cn("inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition-all",
                        state.presente ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-gray-200 bg-white text-gray-400 hover:border-emerald-200 hover:text-emerald-600"
                      )}
                      onClick={() => setPresencas((p) => ({ ...p, [aluno.id]: { ...p[aluno.id], presente: true, justificativa: "" } }))}>
                      <CircleCheckBig className="size-4" /> Presente
                    </button>
                    <button type="button"
                      className={cn("inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition-all",
                        !state.presente ? "border-red-300 bg-red-100 text-red-600" : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500"
                      )}
                      onClick={() => setPresencas((p) => ({ ...p, [aluno.id]: { ...p[aluno.id], presente: false } }))}>
                      <CircleX className="size-4" /> Falta
                    </button>
                  </div>
                </div>

                {!state.presente && (
                  <input className="mt-3 h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#6C5CE7]/40"
                    placeholder="Justificativa da falta (opcional)"
                    value={state.justificativa}
                    onChange={(e) => setPresencas((p) => ({ ...p, [aluno.id]: { ...p[aluno.id], justificativa: e.target.value } }))} />
                )}
              </article>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-gray-500">
              Resumo: <strong className="text-emerald-600">{presentesCount} presentes</strong> e <strong className="text-red-500">{faltasCount} faltas</strong>.
            </p>
            <button type="button" onClick={saveAttendance} disabled={isSaving || !alunos.length}
              className="flex h-11 items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isSaving ? "Salvando…" : "Salvar chamada"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico + Frequência */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-gray-900">Histórico do mês</CardTitle>
            <CardDescription className="text-gray-500">Últimos registros e calendário de frequência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.slice(0, 6).map((item) => {
              const total = item.presencas.length;
              const presentes = item.presencas.filter((p) => p.presente).length;
              const ratio = total ? presentes / total : 0;
              return (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                  <p className="text-sm font-semibold text-gray-700">{new Date(item.data).toLocaleDateString("pt-BR")}</p>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", ratio >= 0.75 ? "border border-emerald-200 bg-emerald-50 text-emerald-600" : "border border-amber-200 bg-amber-50 text-amber-600")}>
                    {presentes}/{total} presentes
                  </span>
                </div>
              );
            })}
            {!historico.length && <p className="text-sm text-gray-400">Sem chamadas neste mês.</p>}

            {!!calendarioMes.length && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Calendário de frequência</p>
                <div className="grid grid-cols-7 gap-1">
                  {calendarioMes.map((item) => {
                    const cls = item.ratio === null ? "bg-gray-100 text-gray-400"
                      : item.ratio >= 0.9 ? "bg-emerald-100 text-emerald-700"
                      : item.ratio >= 0.75 ? "bg-emerald-50 text-emerald-600"
                      : item.ratio >= 0.5 ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600";
                    return (
                      <div key={item.key} className={`inline-flex h-8 items-center justify-center rounded-lg text-[11px] font-bold ${cls}`}
                        title={item.ratio === null ? `Dia ${item.day}: sem registro` : `Dia ${item.day}: ${Math.round(item.ratio * 100)}% presentes`}>
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-gray-900">Frequência por aluno</CardTitle>
            <CardDescription className="text-gray-500">Alerta automático para 25%+ de faltas no mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {ausenciaPorAluno.slice(0, 8).map((item) => (
              <div key={item.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold text-gray-700">{item.nome}</p>
                  <span className={cn("text-xs font-bold", item.taxa >= 0.25 ? "text-red-500" : "text-emerald-600")}>{Math.round(item.taxa * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className={cn("h-full rounded-full transition-all", item.taxa >= 0.25 ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500")}
                    style={{ width: `${Math.round(item.taxa * 100)}%` }} />
                </div>
              </div>
            ))}

            {!!alertasFrequencia.length && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-700">
                  <TriangleAlert className="size-4" /> Alerta de frequência
                </div>
                <p className="text-xs text-amber-600">{alertasFrequencia.length} aluno(s) com 25%+ de faltas neste mês.</p>
              </div>
            )}

            {!ausenciaPorAluno.length && <p className="text-sm text-gray-400">Dados insuficientes para calcular frequência.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
