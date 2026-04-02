"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Clock3, GripVertical, Lightbulb, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  if (!weekStart) {
    return "";
  }

  const endDate = new Date(`${weekStart}T00:00:00`);
  endDate.setDate(endDate.getDate() + 4);
  return toDateInput(endDate);
}

function getNextSlotTime(daySlots: Slot[]) {
  if (!daySlots.length) {
    return "08:00";
  }

  const sorted = [...daySlots].sort((a, b) => a.horario.localeCompare(b.horario));
  const last = sorted[sorted.length - 1];
  const [hour, minute] = last.horario.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "08:00";
  }

  const nextMinutes = Math.min(hour * 60 + minute + 60, 17 * 60 + 30);
  const nextHour = `${Math.floor(nextMinutes / 60)}`.padStart(2, "0");
  const nextMinute = `${nextMinutes % 60}`.padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

function getCategoryBadgeClass(category: string) {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("natureza")) return "cat-natureza";
  if (normalized.includes("corpo") || normalized.includes("movimento")) return "cat-corpo";
  if (normalized.includes("arte") || normalized.includes("musica")) return "cat-arte";
  if (normalized.includes("mat") || normalized.includes("numero")) return "cat-matematica";
  if (normalized.includes("lingu") || normalized.includes("leitura")) return "cat-linguagem";
  if (normalized.includes("sociedade") || normalized.includes("conviv")) return "cat-sociedade";
  if (normalized.includes("data") || normalized.includes("comemor")) return "cat-datas";

  return "bg-slate-100 text-slate-700";
}

function stringScore(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

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

    if (!response.ok) {
      throw new Error(json.error?.message ?? "Falha ao carregar turmas");
    }

    const loadedTurmas = (json.data ?? []) as Turma[];
    setTurmas(loadedTurmas);

    if (loadedTurmas.length && !selectedTurma) {
      setSelectedTurma(loadedTurmas[0].id);
    }
  }, [selectedTurma]);

  const loadAtividadesByTurma = useCallback(async (turmaId: string) => {
    setLoadingActivities(true);

    try {
      const params = new URLSearchParams({ turmaId });
      const response = await fetch(`/api/projetos?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar atividades");
      }

      const byId = new Map<string, Atividade>();

      for (const projeto of (json.data ?? []) as ProjetoApi[]) {
        for (const atividade of projeto.atividades ?? []) {
          byId.set(atividade.id, {
            id: atividade.id,
            titulo: atividade.titulo,
            categoria: atividade.categoria,
            duracao: atividade.duracao,
            bnccCodigos: atividade.bnccCodigos,
          });
        }
      }

      const sorted = Array.from(byId.values()).sort((a, b) => a.titulo.localeCompare(b.titulo));
      setAtividades(sorted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar atividades";
      toast.error(message);
      setAtividades([]);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const loadWeekPlan = useCallback(async (turmaId: string, semanaInicio: string) => {
    setLoadingWeek(true);

    try {
      const params = new URLSearchParams({
        turmaId,
        semanaInicio,
      });

      const response = await fetch(`/api/planejamento?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar planejamento da semana");
      }

      const payload = (json.data ?? {}) as PlanejamentoResponse;
      setStreak(payload.streak ?? 0);

      const currentPlan = payload.planejamentos?.[0];

      if (!currentPlan) {
        setCurrentPlanId(null);
        setSlots(createEmptySlots());
        return;
      }

      const nextSlots = createEmptySlots();

      for (const item of currentPlan.atividades ?? []) {
        if (!nextSlots[item.diaSemana]) {
          continue;
        }

        nextSlots[item.diaSemana].push({
          id: item.id ?? generateSlotId(),
          atividadeId: item.atividadeId,
          horario: item.horario,
        });
      }

      for (const day of weekdays) {
        nextSlots[day.value] = nextSlots[day.value].sort((a, b) => a.horario.localeCompare(b.horario));
      }

      setCurrentPlanId(currentPlan.id);
      setSlots(nextSlots);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar planejamento da semana";
      toast.error(message);
      setCurrentPlanId(null);
      setSlots(createEmptySlots());
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  useEffect(() => {
    void loadTurmas();
  }, [loadTurmas]);

  useEffect(() => {
    const nextWeekEnd = computeWeekEnd(weekStart);
    if (nextWeekEnd !== weekEnd) {
      setWeekEnd(nextWeekEnd);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    if (!selectedTurma) {
      return;
    }

    void loadAtividadesByTurma(selectedTurma);
  }, [selectedTurma, loadAtividadesByTurma]);

  useEffect(() => {
    if (!selectedTurma || !weekStart) {
      return;
    }

    void loadWeekPlan(selectedTurma, weekStart);
  }, [selectedTurma, weekStart, loadWeekPlan]);

  const activityMap = useMemo(() => new Map(atividades.map((item) => [item.id, item])), [atividades]);

  const categoriaOptions = useMemo(
    () => ["TODAS", ...Array.from(new Set(atividades.map((atividade) => atividade.categoria)))],
    [atividades],
  );

  const atividadesFiltradas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return atividades.filter((atividade) => {
      if (categoria !== "TODAS" && atividade.categoria !== categoria) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = `${atividade.titulo} ${atividade.categoria} ${(atividade.bnccCodigos ?? []).join(" ")}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [atividades, categoria, search]);

  const totalSlots = useMemo(
    () => weekdays.reduce((acc, day) => acc + slots[day.value].length, 0),
    [slots],
  );

  const selectedTurmaData = useMemo(
    () => turmas.find((turma) => turma.id === selectedTurma) ?? null,
    [turmas, selectedTurma],
  );

  const turmaEtapa = useMemo(() => {
    const etapa = inferEtapaTurma(selectedTurmaData?.faixaEtaria);
    return etapa ? getEtapaLabel(etapa) : "Não identificada";
  }, [selectedTurmaData]);

  const sugestoesIa = useMemo(() => {
    if (!atividades.length) {
      return [] as Atividade[];
    }

    const rank = (atividade: Atividade) => stringScore(`${atividade.id}-${selectedDay}-${suggestionSeed}`);

    return [...atividades]
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 6);
  }, [atividades, selectedDay, suggestionSeed]);

  const onAddActivity = (day: number, activityId: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: [
        ...prev[day],
        {
          id: generateSlotId(),
          atividadeId: activityId,
          horario: getNextSlotTime(prev[day]),
        },
      ],
    }));
  };

  const updateSlot = (day: number, slotId: string, horario: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: prev[day].map((slot) => (slot.id === slotId ? { ...slot, horario } : slot)),
    }));
  };

  const removeSlot = (day: number, slotId: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: prev[day].filter((slot) => slot.id !== slotId),
    }));
  };

  const clearWeek = () => {
    if (!totalSlots) {
      toast.info("A semana já está vazia");
      return;
    }

    setSlots(createEmptySlots());
    toast.success("Grade da semana limpa");
  };

  const refreshSuggestions = () => {
    setLoadingSuggestions(true);

    window.setTimeout(() => {
      setSuggestionSeed((prev) => prev + 1);
      setLoadingSuggestions(false);
      toast.success("Sugestões atualizadas para o dia selecionado");
    }, 420);
  };

  const addSuggestionToDay = (atividade: Atividade) => {
    onAddActivity(selectedDay, atividade.id);
    const dayLabel = weekdays.find((day) => day.value === selectedDay)?.label;
    toast.success(`Sugestão aplicada em ${dayLabel}`);
  };

  const moveSlotToDay = (fromDay: number, toDay: number, slotId: string) => {
    if (fromDay === toDay) {
      return;
    }

    setSlots((prev) => {
      const moving = prev[fromDay].find((slot) => slot.id === slotId);

      if (!moving) {
        return prev;
      }

      const nextFromDay = prev[fromDay].filter((slot) => slot.id !== slotId);
      const nextToDay = [...prev[toDay], { ...moving }].sort((a, b) => a.horario.localeCompare(b.horario));

      return {
        ...prev,
        [fromDay]: nextFromDay,
        [toDay]: nextToDay,
      };
    });

    const fromLabel = weekdays.find((day) => day.value === fromDay)?.label;
    const toLabel = weekdays.find((day) => day.value === toDay)?.label;
    toast.success(`Atividade movida de ${fromLabel} para ${toLabel}`);
  };

  const handleSave = async () => {
    if (!selectedTurma || !weekStart || !weekEnd) {
      toast.error("Preencha turma e período da semana");
      return;
    }

    const atividadesPayload = weekdays.flatMap((day) =>
      slots[day.value].map((slot) => ({
        diaSemana: day.value,
        horario: slot.horario,
        atividadeId: slot.atividadeId,
      })),
    );

    if (!atividadesPayload.length) {
      toast.error("Adicione ao menos uma atividade na grade semanal");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/planejamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turmaId: selectedTurma,
        semanaInicio: weekStart,
        semanaFim: weekEnd,
        atividades: atividadesPayload,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const json = await response.json();
      toast.error(json.error?.message ?? "Falha ao salvar planejamento");
      return;
    }

    toast.success(currentPlanId ? "Planejamento atualizado com sucesso" : "Planejamento salvo com sucesso");
    await loadWeekPlan(selectedTurma, weekStart);
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Planejamento da semana em 3 passos</CardTitle>
          <CardDescription className="text-slate-600">Escolha turma e semana, monte a grade por dia e salve. Se a semana já existir, você edita sem perder nada.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">Passo 1: Turma + semana</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Passo 2: Adicionar atividades</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Passo 3: Salvar planejamento</span>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr_300px]">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Biblioteca de atividades</CardTitle>
          <CardDescription className="text-slate-600">Selecione um dia e toque em Adicionar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar atividade"
              className="border-slate-200 bg-slate-50 pl-9"
            />
          </div>

          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
          >
            {categoriaOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Dia selecionado</p>
            <div className="grid grid-cols-5 gap-1.5">
              {weekdays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDay(day.value)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${selectedDay === day.value ? "bg-rose-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {loadingActivities && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Carregando atividades...
              </div>
            )}

            {!loadingActivities &&
              atividadesFiltradas.map((atividade) => (
                <article key={atividade.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-sm font-semibold text-slate-900">{atividade.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {atividade.categoria} • {atividade.duracao} min
                  </p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                    BNCC: {(atividade.bnccCodigos ?? []).join(", ") || "Não informado"}
                  </p>

                  <Button
                    type="button"
                    onClick={() => {
                      onAddActivity(selectedDay, atividade.id);
                      const dayLabel = weekdays.find((day) => day.value === selectedDay)?.label;
                      toast.success(`Atividade adicionada em ${dayLabel}`);
                    }}
                    className="mt-2 h-8 w-full bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
                  >
                    <Plus className="mr-1 size-3.5" />
                    Adicionar no dia selecionado
                  </Button>
                </article>
              ))}
          </div>

          {!loadingActivities && !atividadesFiltradas.length && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              Nenhuma atividade encontrada para os filtros atuais.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Grade semanal</CardTitle>
          <CardDescription className="text-slate-600">Planejamento visual da semana para a turma selecionada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={selectedTurma}
              onChange={(event) => setSelectedTurma(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            >
              {!turmas.length && <option value="">Sem turmas cadastradas</option>}
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                    {turma.nome}
                </option>
              ))}
            </select>

            <Input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="border-slate-200 bg-slate-50" />
            <Input type="date" value={weekEnd} readOnly className="border-slate-200 bg-slate-100 text-slate-600" />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Etapa sugerida da turma: <span className="font-semibold text-slate-800">{turmaEtapa}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">{totalSlots} atividades na grade</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Sequência ativa: {streak} semana(s)</span>
            {currentPlanId && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Editando semana já salva</span>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Dica prática: escolha o dia na lateral e toque em Adicionar nas atividades. Depois ajuste os horários.
          </div>

          {loadingWeek && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <Loader2 className="size-4 animate-spin" />
              Carregando planejamento da semana...
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {weekdays.map((day) => (
              <div
                key={day.value}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragSlot) {
                    setDropDay(day.value);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  if (!dragSlot) {
                    return;
                  }

                  moveSlotToDay(dragSlot.fromDay, day.value, dragSlot.slotId);
                  setDragSlot(null);
                  setDropDay(null);
                }}
                onDragLeave={() => {
                  if (dropDay === day.value) {
                    setDropDay(null);
                  }
                }}
                className={`min-h-56 rounded-xl border p-2 transition ${selectedDay === day.value ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"} ${dropDay === day.value ? "ring-2 ring-emerald-200" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedDay(day.value)}
                    className={`text-sm font-semibold ${selectedDay === day.value ? "text-rose-700" : "text-slate-800"}`}
                  >
                    {day.label}
                  </button>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {slots[day.value].length}
                  </span>
                </div>

                <div className="space-y-2">
                  {[...slots[day.value]].sort((a, b) => a.horario.localeCompare(b.horario)).map((slot) => {
                    const atividade = activityMap.get(slot.atividadeId);
                    const categoryClass = getCategoryBadgeClass(atividade?.categoria ?? "");

                    return (
                      <div
                        key={slot.id}
                        draggable
                        onDragStart={() => setDragSlot({ fromDay: day.value, slotId: slot.id })}
                        onDragEnd={() => {
                          setDragSlot(null);
                          setDropDay(null);
                        }}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-xs font-semibold text-slate-900">{atividade?.titulo ?? "Atividade"}</p>
                          <GripVertical className="size-3.5 shrink-0 text-slate-400" />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${categoryClass}`}>
                            {atividade?.categoria ?? "Categoria"}
                          </span>
                          <span className="text-[10px] text-slate-500">{atividade?.duracao ?? 0} min</span>
                        </div>
                        <Input
                          className="mt-1 h-8 border-slate-200 bg-white"
                          type="time"
                          value={slot.horario}
                          onChange={(event) => updateSlot(day.value, slot.id, event.target.value)}
                        />
                        <button
                          onClick={() => removeSlot(day.value, slot.id)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-600 underline"
                          type="button"
                        >
                          <Trash2 className="size-3" />
                          Remover
                        </button>
                      </div>
                    );
                  })}

                  {!slots[day.value].length && (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-2 py-3 text-center text-xs text-slate-500">
                      Sem atividades neste dia.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={clearWeek} type="button" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <Trash2 className="mr-2 size-4" />
              Limpar semana
            </Button>

            <Button onClick={handleSave} disabled={saving || loadingWeek} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CalendarClock className="mr-2 size-4" />}
              {saving ? "Salvando..." : "Salvar semana"}
            </Button>

            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <Clock3 className="size-3.5" />
              {weekStart} até {weekEnd}
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <Sparkles className="size-3.5" />
              {currentPlanId ? "Modo edição da semana" : "Semana nova"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Sugestões com IA</CardTitle>
          <CardDescription className="text-slate-600">
            Recomendações para {weekdays.find((day) => day.value === selectedDay)?.label}, com base na turma e no seu acervo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={refreshSuggestions}
            disabled={loadingSuggestions || !atividades.length}
            className="w-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
          >
            {loadingSuggestions ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lightbulb className="mr-2 size-4" />}
            {loadingSuggestions ? "Atualizando sugestões..." : "Gerar novas sugestões"}
          </Button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Etapa da turma</p>
            <p className="mt-1">{turmaEtapa}</p>
          </div>

          <div className="space-y-2">
            {sugestoesIa.map((atividade) => (
              <article key={atividade.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(atividade.categoria)}`}>
                    {atividade.categoria}
                  </span>
                  <span className="text-[10px] text-slate-500">{atividade.duracao} min</span>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{atividade.titulo}</p>
                <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                  BNCC: {(atividade.bnccCodigos ?? []).join(", ") || "Não informado"}
                </p>
                <Button
                  type="button"
                  onClick={() => addSuggestionToDay(atividade)}
                  className="mt-2 h-8 w-full bg-rose-500 text-xs font-semibold text-white hover:bg-rose-600"
                >
                  Adicionar na grade
                </Button>
              </article>
            ))}

            {!sugestoesIa.length && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                Ainda não há sugestões para esta turma.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
