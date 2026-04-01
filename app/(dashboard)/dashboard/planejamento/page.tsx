"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, GripVertical, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Turma = { id: string; nome: string };
type Atividade = { id: string; titulo: string; categoria: string; duracao: number; bnccCodigos: string[] };
type ProjetoApi = { atividades?: Atividade[] };

type Slot = {
  atividadeId: string;
  horario: string;
};

const weekdays = [
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
];

export default function PlanejamentoPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [slots, setSlots] = useState<Record<number, Slot[]>>({ 1: [], 2: [], 3: [], 4: [], 5: [] });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
      const [turmasResponse, projetosResponse] = await Promise.all([
        fetch("/api/turmas"),
        fetch("/api/projetos"),
      ]);

      const turmasJson = await turmasResponse.json();
      const projetosJson = await projetosResponse.json();

      setTurmas(turmasJson.data ?? []);

      const flattenedActivities = (projetosJson.data ?? []).flatMap((projeto: ProjetoApi) =>
        (projeto.atividades ?? []).map((atividade: Atividade) => ({
          id: atividade.id,
          titulo: atividade.titulo,
          categoria: atividade.categoria,
          duracao: atividade.duracao,
          bnccCodigos: atividade.bnccCodigos,
        })),
      );

      setAtividades(flattenedActivities);
      if (turmasJson.data?.length) {
        setSelectedTurma(turmasJson.data[0].id);
      }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activityMap = useMemo(() => new Map(atividades.map((item) => [item.id, item])), [atividades]);

  const onDropActivity = (day: number, activityId: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: [...prev[day], { atividadeId: activityId, horario: "08:00" }],
    }));
  };

  const updateSlot = (day: number, index: number, horario: string) => {
    setSlots((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, slotIndex) => (slotIndex === index ? { ...slot, horario } : slot)),
    }));
  };

  const removeSlot = (day: number, index: number) => {
    setSlots((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, slotIndex) => slotIndex !== index),
    }));
  };

  const handleSave = async () => {
    if (!selectedTurma || !weekStart || !weekEnd) {
      toast.error("Preencha turma e periodo da semana");
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

    setLoading(true);

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

    setLoading(false);

    if (!response.ok) {
      const json = await response.json();
      toast.error(json.error?.message ?? "Falha ao salvar planejamento");
      return;
    }

    toast.success("Planejamento salvo com sucesso");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Atividades</CardTitle>
          <CardDescription className="text-[#6A638D]">Arraste para os dias da semana e ajuste horario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {atividades.map((atividade) => (
            <button
              key={atividade.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/activity-id", atividade.id)}
              className="flex w-full items-start gap-2 rounded-xl border border-[#DCECF8] bg-white p-3 text-left text-sm transition hover:border-[#BDEEE8] hover:bg-[#F2FCFA]"
            >
              <GripVertical className="mt-0.5 size-4 text-[#8A84AD]" />
              <div>
                <p className="font-semibold text-[#1E1740]">{atividade.titulo}</p>
                <p className="text-xs text-[#746E98]">
                  {atividade.categoria} • {atividade.duracao} min
                </p>
              </div>
            </button>
          ))}

          {!atividades.length && (
            <p className="rounded-xl border border-dashed border-[#CFE2F5] bg-[#F8FBFF] p-3 text-sm text-[#6A638D]">
              Nenhuma atividade disponivel. Salve um projeto para popular sua biblioteca.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Grade semanal</CardTitle>
          <CardDescription className="text-[#6A638D]">Segunda a sexta com drag and drop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={selectedTurma} onValueChange={(value) => setSelectedTurma(value ?? "")}>
              <SelectTrigger className="border-[#D8E9F8] bg-white text-[#1E1740]">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />
            <Input type="date" value={weekEnd} onChange={(event) => setWeekEnd(event.target.value)} />
          </div>

          <div className="rounded-xl border border-[#DCECF8] bg-[#F8FBFF] px-3 py-2 text-xs text-[#6A638D]">
            Dica: arraste atividades para os dias e ajuste o horario em cada card.
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {weekdays.map((day) => (
              <div
                key={day.value}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const activityId = event.dataTransfer.getData("text/activity-id");
                  if (activityId) {
                    onDropActivity(day.value, activityId);
                    toast.success(`Atividade adicionada em ${day.label}`);
                  }
                }}
                className="min-h-56 rounded-xl border border-[#DCECF8] bg-white/90 p-2"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1E1740]">{day.label}</p>
                  <Plus className="size-3.5 text-[#8A84AD]" />
                </div>
                <div className="space-y-2">
                  {slots[day.value].map((slot, index) => {
                    const atividade = activityMap.get(slot.atividadeId);

                    return (
                      <div key={`${slot.atividadeId}-${index}`} className="rounded-lg border border-[#DCECF8] bg-[#F8FBFF] p-2">
                        <p className="text-xs font-medium text-[#1E1740]">{atividade?.titulo ?? "Atividade"}</p>
                        <Input
                          className="mt-1 h-8"
                          type="time"
                          value={slot.horario}
                          onChange={(event) => updateSlot(day.value, index, event.target.value)}
                        />
                        <button
                          onClick={() => removeSlot(day.value, index)}
                          className="mt-1 text-[11px] text-[#DD5D42] underline"
                          type="button"
                        >
                          Remover
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={loading} className="bg-[#0BB8A8] text-white hover:bg-[#0A9F92]">
            <CalendarClock className="mr-2 size-4" />
            {loading ? "Salvando..." : "Salvar semana"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
