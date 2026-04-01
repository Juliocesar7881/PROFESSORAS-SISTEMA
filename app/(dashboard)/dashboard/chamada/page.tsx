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
    <div className="space-y-4">
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#1E1740]">Chamada Digital</CardTitle>
          <CardDescription className="text-[#6A638D]">Mobile-first para uso rapido em sala, com historico do mes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select
            className="h-11 rounded-xl border border-[#D8E9F8] bg-white px-3 text-sm text-[#1E1740]"
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
          <div className="flex items-center justify-between rounded-xl border border-[#D8E9F8] bg-[#F8FBFF] px-3 py-2 text-sm text-[#4E4770]">
            <span>Presentes: {presentesCount}/{alunos.length}</span>
            <CalendarDays className="size-4 text-[#8A84AD]" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alunos.map((aluno) => {
          const state = presencas[aluno.id] ?? { presente: true, justificativa: "" };

          return (
            <article key={aluno.id} className="glass-card rounded-2xl border border-[#DCECF8] p-4">
              <p className="text-lg font-semibold text-[#1E1740]">{aluno.nome}</p>
              <div className="mt-3 flex gap-2">
                <button
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold ${state.presente ? "bg-[#DDF8F4] text-[#0F8F83]" : "bg-[#F1F5FF] text-[#6A638D]"}`}
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
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold ${!state.presente ? "bg-[#FFE9E3] text-[#CB5A43]" : "bg-[#F1F5FF] text-[#6A638D]"}`}
                  onClick={() =>
                    setPresencas((prev) => ({
                      ...prev,
                      [aluno.id]: { ...prev[aluno.id], presente: false },
                    }))
                  }
                >
                  <CircleX className="size-4" />
                  Ausente
                </button>
              </div>
              {!state.presente && (
                <Input
                  className="mt-2"
                  placeholder="Justificativa"
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
      </div>

      <Button className="h-12 rounded-xl bg-[#0BB8A8] text-white hover:bg-[#0A9F92]" onClick={saveAttendance}>
        Salvar chamada
      </Button>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border-[#DCECF8]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-[#1E1740]">Historico do mes</CardTitle>
            <CardDescription className="text-[#6A638D]">Ultimos registros da turma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.slice(0, 6).map((item) => {
              const total = item.presencas.length;
              const presentes = item.presencas.filter((p) => p.presente).length;

              return (
                <div key={item.id} className="rounded-xl border border-[#E2EEFF] bg-[#F8FBFF] p-3">
                  <p className="text-sm text-[#1E1740]">{new Date(item.data).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs text-[#746E98]">{presentes}/{total} presentes</p>
                </div>
              );
            })}

            {!historico.length && <p className="text-sm text-[#6A638D]">Sem chamadas registradas neste mes.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card border-[#DCECF8]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-[#1E1740]">Frequencia por aluno</CardTitle>
            <CardDescription className="text-[#6A638D]">Alerta automatico para 25%+ de faltas no mes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ausenciaPorAluno.slice(0, 8).map((item) => (
              <div key={item.nome} className="rounded-xl border border-[#E2EEFF] bg-[#F8FBFF] p-3">
                <div className="mb-1 flex items-center justify-between text-sm text-[#1E1740]">
                  <p>{item.nome}</p>
                  <p>{Math.round(item.taxa * 100)}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E7EEF8]">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      item.taxa >= 0.25 ? "bg-[#FF7B5E]" : "bg-[#0BB8A8]",
                    )}
                    style={{ width: `${Math.round(item.taxa * 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {!!alertasFrequencia.length && (
              <div className="rounded-xl border border-[#FFE1A0] bg-[#FFF7E4] p-3 text-sm text-[#7C6415]">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <TriangleAlert className="size-4" />
                  Alerta de frequencia
                </div>
                <p>{alertasFrequencia.length} aluno(s) com 25% ou mais de faltas neste mes.</p>
              </div>
            )}

            {!ausenciaPorAluno.length && <p className="text-sm text-[#6A638D]">Dados insuficientes para calcular frequencia.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
