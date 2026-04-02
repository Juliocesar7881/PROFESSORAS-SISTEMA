"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, School, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  ano: number;
};

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [savingTurmaId, setSavingTurmaId] = useState<string | null>(null);
  const [deletingTurmaId, setDeletingTurmaId] = useState<string | null>(null);
  const [newTurma, setNewTurma] = useState({
    nome: "",
    faixaEtaria: "",
    ano: new Date().getFullYear(),
  });

  const turmasOrdenadas = useMemo(
    () => [...turmas].sort((a, b) => (a.ano === b.ano ? a.nome.localeCompare(b.nome) : b.ano - a.ano)),
    [turmas],
  );

  const loadTurmas = useCallback(async () => {
    setLoadingTurmas(true);

    try {
      const response = await fetch("/api/turmas");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar turmas");
      }

      setTurmas((json.data ?? []) as Turma[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar turmas";
      toast.error(message);
      setTurmas([]);
    } finally {
      setLoadingTurmas(false);
    }
  }, []);

  useEffect(() => {
    void loadTurmas();
  }, [loadTurmas]);

  const createTurma = async () => {
    const nome = newTurma.nome.trim();
    const faixaEtaria = newTurma.faixaEtaria.trim();

    if (!nome || !faixaEtaria || !newTurma.ano) {
      toast.error("Preencha nome, faixa etária e ano letivo da turma");
      return;
    }

    setSavingTurmaId("new");

    try {
      const response = await fetch("/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          faixaEtaria,
          ano: newTurma.ano,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao criar turma");
      }

      toast.success("Turma criada com sucesso");
      setNewTurma({ nome: "", faixaEtaria: "", ano: new Date().getFullYear() });
      await loadTurmas();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar turma";
      toast.error(message);
    } finally {
      setSavingTurmaId(null);
    }
  };

  const updateTurma = async (turma: Turma) => {
    setSavingTurmaId(turma.id);

    try {
      const response = await fetch(`/api/turmas/${turma.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: turma.nome,
          faixaEtaria: turma.faixaEtaria,
          ano: turma.ano,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao atualizar turma");
      }

      toast.success("Turma atualizada");
      await loadTurmas();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar turma";
      toast.error(message);
    } finally {
      setSavingTurmaId(null);
    }
  };

  const deleteTurma = async (turma: Turma) => {
    const confirmDelete = window.confirm(`Arquivar a turma \"${turma.nome}\"?`);

    if (!confirmDelete) {
      return;
    }

    setDeletingTurmaId(turma.id);

    try {
      const response = await fetch(`/api/turmas/${turma.id}`, { method: "DELETE" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao remover turma");
      }

      toast.success("Turma arquivada");
      await loadTurmas();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao remover turma";
      toast.error(message);
    } finally {
      setDeletingTurmaId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-3xl text-slate-900">Turmas da escola</CardTitle>
              <CardDescription className="mt-1 text-slate-500">Cadastre novas turmas, ajuste dados e mantenha tudo organizado no mesmo padrão visual do sistema.</CardDescription>
            </div>
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
              <School className="size-5 text-rose-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-rose-50 px-2.5 py-1 font-bold text-rose-700 ring-1 ring-rose-100">{turmas.length} turma(s) ativa(s)</span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-bold text-cyan-700 ring-1 ring-cyan-100">Gestão centralizada</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 ring-1 ring-emerald-100">Cadastro e edição rápida</span>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-slate-900">Nova turma</CardTitle>
            <CardDescription className="text-slate-500">Crie uma turma para começar a registrar alunos, avaliações e chamadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Nome da turma</label>
              <Input
                className="h-11 rounded-xl border-slate-200/60 bg-slate-50/60"
                placeholder="Ex: Jardim II A"
                value={newTurma.nome}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, nome: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Faixa etária</label>
              <Input
                className="h-11 rounded-xl border-slate-200/60 bg-slate-50/60"
                placeholder="Ex: 4-5 anos"
                value={newTurma.faixaEtaria}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, faixaEtaria: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Ano letivo</label>
              <Input
                className="h-11 rounded-xl border-slate-200/60 bg-slate-50/60"
                type="number"
                value={newTurma.ano}
                onChange={(event) => {
                  const value = Number(event.target.value) || new Date().getFullYear();
                  setNewTurma((prev) => ({ ...prev, ano: value }));
                }}
              />
            </div>

            <Button
              type="button"
              onClick={createTurma}
              disabled={savingTurmaId === "new"}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 font-bold text-white shadow-[0_8px_16px_-8px_rgba(244,63,94,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-8px_rgba(244,63,94,0.6)]"
            >
              {savingTurmaId === "new" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <PlusCircle className="mr-2 size-4" />}
              Adicionar turma
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-slate-900">Turmas cadastradas</CardTitle>
            <CardDescription className="text-slate-500">Edite os campos e salve cada turma individualmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingTurmas && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Carregando turmas...
              </div>
            )}

            {!loadingTurmas && !turmasOrdenadas.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                <UsersRound className="mx-auto mb-2 size-6 text-slate-400" />
                Nenhuma turma cadastrada no momento.
              </div>
            )}

            {!loadingTurmas &&
              turmasOrdenadas.map((turma) => {
                const isSaving = savingTurmaId === turma.id;
                const isDeleting = deletingTurmaId === turma.id;

                return (
                  <article key={turma.id} className="grid gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 md:grid-cols-[1.4fr_1fr_110px_auto_auto] md:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Nome</label>
                      <Input
                        className="h-10 rounded-xl border-slate-200 bg-slate-50"
                        value={turma.nome}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, nome: value } : item)));
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Faixa etária</label>
                      <Input
                        className="h-10 rounded-xl border-slate-200 bg-slate-50"
                        value={turma.faixaEtaria}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, faixaEtaria: value } : item)));
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Ano</label>
                      <Input
                        className="h-10 rounded-xl border-slate-200 bg-slate-50"
                        type="number"
                        value={turma.ano}
                        onChange={(event) => {
                          const value = Number(event.target.value) || turma.ano;
                          setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, ano: value } : item)));
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      disabled={isSaving || isDeleting}
                      onClick={() => updateTurma(turma)}
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      disabled={isSaving || isDeleting}
                      onClick={() => deleteTurma(turma)}
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </article>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
