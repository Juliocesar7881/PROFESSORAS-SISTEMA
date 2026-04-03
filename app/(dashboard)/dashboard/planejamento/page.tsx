"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Clock3, GripVertical, Lightbulb, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEtapaLabel, inferEtapaTurma } from "@/lib/etapa";

type Turma = { id: string; nome: string; faixaEtaria: string };
type Atividade = { id: string; titulo: string; categoria: string; duracao: number; bnccCodigos: string[] };
type ProjetoApi = { atividades?: Atividade[] };
type PlanejamentoAtividadeApi = {
  id: string;
  diaSemana: number;
  horario: string;
  atividadeId: string;
  atividade: Atividade;
};
type PlanejamentoApi = {
  id: string;
  atividades: PlanejamentoAtividadeApi[];
};
type PlanejamentoResponse = {
  planejamentos: PlanejamentoApi[];
  streak: number;
};

type Slot = {
  id: string;
  atividadeId: string;
  horario: string;
};

type DragSlot = {
  fromDay: number;
  slotId: string;
};

const weekdays = [
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
];

const createEmptySlots = (): Record<number, Slot[]> => ({ 1: [], 2: [], 3: [], 4: [], 5: [] });

function generateSlotId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDateInput(value: Date) {
  const timezoneOffsetMs = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function getMonday(baseDate: Date) {
  const date = new Date(baseDate);
  const dayOfWeek = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayOfWeek);
  date.setHours(0, 0, 0, 0);
  return date;
}

function computeWeekEnd(weekStart: string) {
  if (!weekStart) return "";
  const endDate = new Date(`${weekStart}T00:00:00`);
  endDate.setDate(endDate.getDate() + 4);
  return toDateInput(endDate);
}

function getNextSlotTime(daySlots: Slot[]) {
  if (!daySlots.length) return "08:00";
  const sorted = [...daySlots].sort((a, b) => a.horario.localeCompare(b.horario));
  const last = sorted[sorted.length - 1];
  const [hour, minute] = last.horario.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "08:00";
  const nextMinutes = Math.min(hour * 60 + minute + 60, 17 * 60 + 30);
  const nextHour = `${Math.floor(nextMinutes / 60)}`.padStart(2, "0");
  const nextMinute = `${nextMinutes % 60}`.padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

function getCategoryBadgeClass(category: string) {
  const n = category.trim().toLowerCase();
  if (n.includes("natureza")) return "cat-natureza";
  if (n.includes("corpo") || n.includes("movimento")) return "cat-corpo";
  if (n.includes("arte") || n.includes("musica")) return "cat-arte";
  if (n.includes("mat") || n.includes("numero")) return "cat-matematica";
  if (n.includes("lingu") || n.includes("leitura")) return "cat-linguagem";
  if (n.includes("sociedade") || n.includes("conviv")) return "cat-sociedade";
  if (n.includes("data") || n.includes("comemor")) return "cat-datas";
  return "bg-gray-100 text-gray-600";
}

function stringScore(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

const lightInput = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";
const lightSelect = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 focus:border-violet-300 focus:outline-none transition appearance-none hover:border-gray-300";

export default function PlanejamentoPage() {
  const defaultWeekStart = useMemo(() => toDateInput(getMonday(new Date())), []);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [weekEnd, setWeekEnd] = useState(computeWeekEnd(defaultWeekStart));
  const [slots, setSlots] = useState<Record<number, Slot[]>>(createEmptySlots());
  const [saving, setSaving] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dragSlot, setDragSlot] = useState<DragSlot | null>(null);
  const [dropDay, setDropDay] = useState<number | null>(null);

  const loadTurmas = useCallback(async () => {
    const response = await fetch("/api/turmas");
    const json = await response.json();
    if (!response.ok) throw new Error(json.error?.message ?? "Falha ao carregar turmas");
    const loadedTurmas = (json.data ?? []) as Turma[];
    setTurmas(loadedTurmas);
    if (loadedTurmas.length && !selectedTurma) setSelectedTurma(loadedTurmas[0].id);
  }, [selectedTurma]);

  const loadAtividadesByTurma = useCallback(async (turmaId: string) => {
    setLoadingActivities(true);
    try {
      const params = new URLSearchParams({ turmaId });
      const response = await fetch(`/api/projetos?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao carregar atividades");
      const byId = new Map<string, Atividade>();
      for (const projeto of (json.data ?? []) as ProjetoApi[]) {
        for (const atividade of projeto.atividades ?? []) {
          byId.set(atividade.id, { id: atividade.id, titulo: atividade.titulo, categoria: atividade.categoria, duracao: atividade.duracao, bnccCodigos: atividade.bnccCodigos });
        }
      }
      setAtividades(Array.from(byId.values()).sort((a, b) => a.titulo.localeCompare(b.titulo)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar atividades");
      setAtividades([]);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const loadWeekPlan = useCallback(async (turmaId: string, semanaInicio: string) => {
    setLoadingWeek(true);
    try {
      const params = new URLSearchParams({ turmaId, semanaInicio });
      const response = await fetch(`/api/planejamento?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao carregar planejamento da semana");
      const payload = (json.data ?? {}) as PlanejamentoResponse;
      setStreak(payload.streak ?? 0);
      const currentPlan = payload.planejamentos?.[0];
      if (!currentPlan) { setCurrentPlanId(null); setSlots(createEmptySlots()); return; }
      const nextSlots = createEmptySlots();
      for (const item of currentPlan.atividades ?? []) {
        if (!nextSlots[item.diaSemana]) continue;
        nextSlots[item.diaSemana].push({ id: item.id ?? generateSlotId(), atividadeId: item.atividadeId, horario: item.horario });
      }
      for (const day of weekdays) {
        nextSlots[day.value] = nextSlots[day.value].sort((a, b) => a.horario.localeCompare(b.horario));
      }
      setCurrentPlanId(currentPlan.id);
      setSlots(nextSlots);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar planejamento da semana");
      setCurrentPlanId(null);
      setSlots(createEmptySlots());
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  useEffect(() => { void loadTurmas(); }, [loadTurmas]);
  useEffect(() => { const e = computeWeekEnd(weekStart); if (e !== weekEnd) setWeekEnd(e); }, [weekStart, weekEnd]);
  useEffect(() => { if (!selectedTurma) return; void loadAtividadesByTurma(selectedTurma); }, [selectedTurma, loadAtividadesByTurma]);
  useEffect(() => { if (!selectedTurma || !weekStart) return; void loadWeekPlan(selectedTurma, weekStart); }, [selectedTurma, weekStart, loadWeekPlan]);

  const activityMap = useMemo(() => new Map(atividades.map((item) => [item.id, item])), [atividades]);
  const categoriaOptions = useMemo(() => ["TODAS", ...Array.from(new Set(atividades.map((a) => a.categoria)))], [atividades]);
  const atividadesFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return atividades.filter((a) => {
      if (categoria !== "TODAS" && a.categoria !== categoria) return false;
      if (!q) return true;
      return `${a.titulo} ${a.categoria} ${(a.bnccCodigos ?? []).join(" ")}`.toLowerCase().includes(q);
    });
  }, [atividades, categoria, search]);
  const totalSlots = useMemo(() => weekdays.reduce((acc, day) => acc + slots[day.value].length, 0), [slots]);
  const selectedTurmaData = useMemo(() => turmas.find((t) => t.id === selectedTurma) ?? null, [turmas, selectedTurma]);
  const turmaEtapa = useMemo(() => { const e = inferEtapaTurma(selectedTurmaData?.faixaEtaria); return e ? getEtapaLabel(e) : "Não identificada"; }, [selectedTurmaData]);
  const sugestoesIa = useMemo(() => {
    if (!atividades.length) return [] as Atividade[];
    const rank = (a: Atividade) => stringScore(`${a.id}-${selectedDay}-${suggestionSeed}`);
    return [...atividades].sort((a, b) => rank(a) - rank(b)).slice(0, 6);
  }, [atividades, selectedDay, suggestionSeed]);

  const onAddActivity = (day: number, activityId: string) => {
    setSlots((prev) => ({ ...prev, [day]: [...prev[day], { id: generateSlotId(), atividadeId: activityId, horario: getNextSlotTime(prev[day]) }] }));
  };
  const updateSlot = (day: number, slotId: string, horario: string) => {
    setSlots((prev) => ({ ...prev, [day]: prev[day].map((s) => (s.id === slotId ? { ...s, horario } : s)) }));
  };
  const removeSlot = (day: number, slotId: string) => {
    setSlots((prev) => ({ ...prev, [day]: prev[day].filter((s) => s.id !== slotId) }));
  };
  const clearWeek = () => {
    if (!totalSlots) { toast.info("A semana já está vazia"); return; }
    setSlots(createEmptySlots());
    toast.success("Grade da semana limpa");
  };
  const refreshSuggestions = () => {
    setLoadingSuggestions(true);
    window.setTimeout(() => { setSuggestionSeed((p) => p + 1); setLoadingSuggestions(false); toast.success("Sugestões atualizadas"); }, 420);
  };
  const addSuggestionToDay = (atividade: Atividade) => {
    onAddActivity(selectedDay, atividade.id);
    toast.success(`Sugestão aplicada em ${weekdays.find((d) => d.value === selectedDay)?.label}`);
  };
  const moveSlotToDay = (fromDay: number, toDay: number, slotId: string) => {
    if (fromDay === toDay) return;
    setSlots((prev) => {
      const moving = prev[fromDay].find((s) => s.id === slotId);
      if (!moving) return prev;
      return { ...prev, [fromDay]: prev[fromDay].filter((s) => s.id !== slotId), [toDay]: [...prev[toDay], { ...moving }].sort((a, b) => a.horario.localeCompare(b.horario)) };
    });
    toast.success(`Atividade movida para ${weekdays.find((d) => d.value === toDay)?.label}`);
  };
  const handleSave = async () => {
    if (!selectedTurma || !weekStart || !weekEnd) { toast.error("Preencha turma e período da semana"); return; }
    const atividadesPayload = weekdays.flatMap((day) => slots[day.value].map((slot) => ({ diaSemana: day.value, horario: slot.horario, atividadeId: slot.atividadeId })));
    if (!atividadesPayload.length) { toast.error("Adicione ao menos uma atividade na grade semanal"); return; }
    setSaving(true);
    const response = await fetch("/api/planejamento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turmaId: selectedTurma, semanaInicio: weekStart, semanaFim: weekEnd, atividades: atividadesPayload }) });
    setSaving(false);
    if (!response.ok) { const json = await response.json(); toast.error(json.error?.message ?? "Falha ao salvar planejamento"); return; }
    toast.success(currentPlanId ? "Planejamento atualizado" : "Planejamento salvo");
    await loadWeekPlan(selectedTurma, weekStart);
  };

  return (
    <div className="space-y-5">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-violet-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 50%, #7C3AED 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(167, 139, 250, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90">
              <CalendarClock className="size-3" />
              Planejamento Semanal
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Monte sua grade em 3 passos</h2>
            <p className="mt-1 text-sm text-white/70">Escolha turma e semana, monte a grade e salve.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-400/20 px-3 py-1.5 text-xs font-bold text-sky-100">
              1. Turma + semana
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-100">
              2. Adicionar atividades
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-100">
              3. Salvar
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                🔥 {streak} semana{streak > 1 ? "s" : ""} seguida{streak > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr_280px]">
        {/* ─── Biblioteca ─── */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-gray-900">Biblioteca de atividades</CardTitle>
            <CardDescription className="text-gray-500">Selecione um dia e toque em Adicionar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar atividade…" className={`${lightInput} pl-9`} />
            </div>
            <select className={lightSelect} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categoriaOptions.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>

            <div>
              <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Dia selecionado</p>
              <div className="grid grid-cols-5 gap-1.5">
                {weekdays.map((day) => (
                  <button key={day.value} type="button" onClick={() => setSelectedDay(day.value)}
                    className={`rounded-lg py-2 text-xs font-bold transition-all ${selectedDay === day.value ? "bg-[#6C5CE7] text-white shadow-[0_2px_8px_-2px_rgba(108,92,231,0.4)]" : "border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 scrollbar-hide">
              {loadingActivities && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  <Loader2 className="size-4 animate-spin text-[#6C5CE7]" /> Carregando atividades…
                </div>
              )}
              {!loadingActivities && atividadesFiltradas.map((atividade) => (
                <article key={atividade.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 transition hover:border-gray-300 hover:shadow-sm">
                  <p className="text-sm font-semibold text-gray-800">{atividade.titulo}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{atividade.categoria} · {atividade.duracao} min</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-gray-400">BNCC: {(atividade.bnccCodigos ?? []).join(", ") || "Não informado"}</p>
                  <Button type="button" onClick={() => { onAddActivity(selectedDay, atividade.id); toast.success(`Adicionado em ${weekdays.find((d) => d.value === selectedDay)?.label}`); }}
                    className="mt-2 h-8 w-full rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200">
                    <Plus className="mr-1 size-3.5" /> Adicionar no dia selecionado
                  </Button>
                </article>
              ))}
              {!loadingActivities && !atividadesFiltradas.length && (
                <p className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-400">Nenhuma atividade encontrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grade semanal */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-gray-900">Grade semanal</CardTitle>
            <CardDescription className="text-gray-500">Planejamento visual da semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <select value={selectedTurma} onChange={(e) => setSelectedTurma(e.target.value)} className={lightSelect}>
                {!turmas.length && <option value="">Sem turmas cadastradas</option>}
                {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
              </select>
              <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className={lightInput} />
              <input type="date" value={weekEnd} readOnly className={`${lightInput} opacity-50 cursor-not-allowed`} />
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Etapa: <span className="ml-1 font-semibold text-gray-700">{turmaEtapa}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">{totalSlots} atividades</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Streak: {streak} sem.</span>
              {currentPlanId && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">Editando semana salva</span>}
            </div>

            {loadingWeek && (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                <Loader2 className="size-4 animate-spin text-[#6C5CE7]" /> Carregando semana…
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {weekdays.map((day) => (
                <div key={day.value}
                  onDragOver={(e) => { e.preventDefault(); if (dragSlot) setDropDay(day.value); }}
                  onDrop={(e) => { e.preventDefault(); if (!dragSlot) return; moveSlotToDay(dragSlot.fromDay, day.value, dragSlot.slotId); setDragSlot(null); setDropDay(null); }}
                  onDragLeave={() => { if (dropDay === day.value) setDropDay(null); }}
                  className={`min-h-52 rounded-xl border p-2.5 transition-all ${selectedDay === day.value ? "border-[#6C5CE7]/30 bg-violet-50/50" : "border-gray-200 bg-gray-50/30"} ${dropDay === day.value ? "ring-2 ring-emerald-400/40" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button type="button" onClick={() => setSelectedDay(day.value)}
                      className={`text-xs font-bold transition ${selectedDay === day.value ? "text-[#6C5CE7]" : "text-gray-400 hover:text-gray-700"}`}>
                      {day.label}
                    </button>
                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-400">{slots[day.value].length}</span>
                  </div>
                  <div className="space-y-2">
                    {[...slots[day.value]].sort((a, b) => a.horario.localeCompare(b.horario)).map((slot) => {
                      const atividade = activityMap.get(slot.atividadeId);
                      const cat = getCategoryBadgeClass(atividade?.categoria ?? "");
                      return (
                        <div key={slot.id} draggable onDragStart={() => setDragSlot({ fromDay: day.value, slotId: slot.id })} onDragEnd={() => { setDragSlot(null); setDropDay(null); }}
                          className="cursor-grab rounded-lg border border-gray-200 bg-white p-2 shadow-sm active:cursor-grabbing">
                          <div className="flex items-start justify-between gap-1">
                            <p className="line-clamp-2 text-xs font-semibold text-gray-800">{atividade?.titulo ?? "Atividade"}</p>
                            <GripVertical className="size-3.5 shrink-0 text-gray-300" />
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat}`}>{atividade?.categoria ?? "—"}</span>
                            <span className="text-[10px] text-gray-400">{atividade?.duracao ?? 0} min</span>
                          </div>
                          <input type="time" value={slot.horario} onChange={(e) => updateSlot(day.value, slot.id, e.target.value)}
                            className="mt-1.5 h-7 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700 focus:outline-none" />
                          <button onClick={() => removeSlot(day.value, slot.id)} type="button"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-red-400 transition hover:text-red-500">
                            <Trash2 className="size-3" /> Remover
                          </button>
                        </div>
                      );
                    })}
                    {!slots[day.value].length && (
                      <p className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">Vazio</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={clearWeek} type="button" variant="outline"
                className="rounded-xl border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                <Trash2 className="mr-2 size-4" /> Limpar semana
              </Button>
              <button onClick={handleSave} disabled={saving || loadingWeek} type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(0,184,148,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #00B894 0%, #00a583 100%)" }}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
                {saving ? "Salvando…" : "Salvar semana"}
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <Clock3 className="size-3.5" /> {weekStart} até {weekEnd}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <Sparkles className="size-3.5 text-[#6C5CE7]" /> {currentPlanId ? "Modo edição" : "Semana nova"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sugestões IA */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-gray-900">Sugestões com IA</CardTitle>
            <CardDescription className="text-gray-500">
              Para {weekdays.find((d) => d.value === selectedDay)?.label}, com base na turma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" variant="outline" onClick={refreshSuggestions} disabled={loadingSuggestions || !atividades.length}
              className="w-full rounded-xl border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700">
              {loadingSuggestions ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lightbulb className="mr-2 size-4" />}
              {loadingSuggestions ? "Atualizando…" : "Gerar novas sugestões"}
            </Button>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
              <p className="font-semibold text-gray-600">Etapa da turma</p>
              <p className="mt-0.5">{turmaEtapa}</p>
            </div>

            <div className="space-y-2">
              {sugestoesIa.map((atividade) => (
                <article key={atividade.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 transition hover:border-gray-300 hover:shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(atividade.categoria)}`}>{atividade.categoria}</span>
                    <span className="text-[10px] text-gray-400">{atividade.duracao} min</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-gray-800">{atividade.titulo}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-400">BNCC: {(atividade.bnccCodigos ?? []).join(", ") || "—"}</p>
                  <Button type="button" onClick={() => addSuggestionToDay(atividade)}
                    className="mt-2 h-8 w-full rounded-lg bg-violet-50 text-xs font-semibold text-[#6C5CE7] hover:bg-violet-100 border border-violet-200">
                    Adicionar na grade
                  </Button>
                </article>
              ))}
              {!sugestoesIa.length && (
                <p className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-400">Ainda não há sugestões.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
