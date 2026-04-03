"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, School, Trash2, UsersRound, Sparkles, CheckCircle2 } from "lucide-react";

type Turma = { id: string; nome: string; faixaEtaria: string; ano: number };

const inputCls =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";
const labelCls = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [savingTurmaId, setSavingTurmaId] = useState<string | null>(null);
  const [deletingTurmaId, setDeletingTurmaId] = useState<string | null>(null);
  const [newTurma, setNewTurma] = useState({ nome: "", faixaEtaria: "", ano: new Date().getFullYear() });

  const turmasOrdenadas = useMemo(
    () => [...turmas].sort((a, b) => a.ano === b.ano ? a.nome.localeCompare(b.nome) : b.ano - a.ano),
    [turmas]
  );

  const loadTurmas = useCallback(async () => {
    setLoadingTurmas(true);
    try {
      const r = await fetch("/api/turmas");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      setTurmas((j.data ?? []) as Turma[]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setTurmas([]); }
    finally { setLoadingTurmas(false); }
  }, []);

  useEffect(() => { void loadTurmas(); }, [loadTurmas]);

  const createTurma = async () => {
    const nome = newTurma.nome.trim(), faixaEtaria = newTurma.faixaEtaria.trim();
    if (!nome || !faixaEtaria || !newTurma.ano) { toast.error("Preencha todos os campos"); return; }
    setSavingTurmaId("new");
    try {
      const r = await fetch("/api/turmas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, faixaEtaria, ano: newTurma.ano }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      toast.success("Turma criada com sucesso!");
      setNewTurma({ nome: "", faixaEtaria: "", ano: new Date().getFullYear() });
      await loadTurmas();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setSavingTurmaId(null); }
  };

  const updateTurma = async (turma: Turma) => {
    setSavingTurmaId(turma.id);
    try {
      const r = await fetch(`/api/turmas/${turma.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: turma.nome, faixaEtaria: turma.faixaEtaria, ano: turma.ano }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      toast.success("Turma atualizada!");
      await loadTurmas();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setSavingTurmaId(null); }
  };

  const deleteTurma = async (turma: Turma) => {
    if (!window.confirm(`Arquivar a turma "${turma.nome}"?`)) return;
    setDeletingTurmaId(turma.id);
    try {
      const r = await fetch(`/api/turmas/${turma.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      toast.success("Turma arquivada");
      await loadTurmas();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setDeletingTurmaId(null); }
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-fuchsia-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #c026d3 0%, #a21caf 50%, #7c3aed 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(232, 121, 249, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90">
              <School className="size-3" />
              Gestão de Turmas
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
              Suas turmas organizadas
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Crie, edite e gerencie turmas com facilidade.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              <Sparkles className="size-3" />
              {turmas.length} turma{turmas.length !== 1 ? "s" : ""} ativa{turmas.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* ─── Nova Turma ─── */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-fuchsia-50">
              <PlusCircle className="size-5 text-fuchsia-500" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-gray-900">Nova turma</h3>
              <p className="text-xs text-gray-400">Preencha os campos abaixo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nome da turma</label>
              <input
                className={inputCls}
                placeholder="Ex: Jardim II A"
                value={newTurma.nome}
                onChange={(e) => setNewTurma((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Faixa etária</label>
              <input
                className={inputCls}
                placeholder="Ex: 4-5 anos"
                value={newTurma.faixaEtaria}
                onChange={(e) => setNewTurma((p) => ({ ...p, faixaEtaria: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Ano letivo</label>
              <input
                className={inputCls}
                type="number"
                value={newTurma.ano}
                onChange={(e) => setNewTurma((p) => ({ ...p, ano: Number(e.target.value) || new Date().getFullYear() }))}
              />
            </div>

            <button
              type="button"
              onClick={createTurma}
              disabled={savingTurmaId === "new"}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(108,92,231,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
            >
              {savingTurmaId === "new" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlusCircle className="size-4" />
              )}
              Adicionar turma
            </button>
          </div>
        </div>

        {/* ─── Lista de Turmas ─── */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-xl font-bold text-gray-900">Turmas cadastradas</h3>
              <p className="mt-0.5 text-xs text-gray-400">Edite e salve individualmente</p>
            </div>
            {turmas.length > 0 && (
              <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-bold text-fuchsia-600">
                {turmas.length} cadastrada{turmas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {loadingTurmas && (
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                <Loader2 className="size-4 animate-spin text-violet-500" />
                Carregando turmas…
              </div>
            )}

            {!loadingTurmas && !turmasOrdenadas.length && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 py-14 text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-fuchsia-50">
                  <UsersRound className="size-7 text-fuchsia-400" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Nenhuma turma cadastrada</p>
                <p className="mt-1 text-xs text-gray-400">Use o formulário ao lado para criar a primeira</p>
              </div>
            )}

            {!loadingTurmas && turmasOrdenadas.map((turma) => {
              const isSaving_ = savingTurmaId === turma.id;
              const isDeleting_ = deletingTurmaId === turma.id;
              return (
                <article
                  key={turma.id}
                  className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-gray-300 hover:shadow-sm md:grid-cols-[1.3fr_1fr_100px_auto_auto] md:items-end"
                >
                  <div>
                    <label className={labelCls}>Nome</label>
                    <input
                      className={inputCls}
                      value={turma.nome}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTurmas((p) => p.map((i) => i.id === turma.id ? { ...i, nome: v } : i));
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Faixa etária</label>
                    <input
                      className={inputCls}
                      value={turma.faixaEtaria}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTurmas((p) => p.map((i) => i.id === turma.id ? { ...i, faixaEtaria: v } : i));
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Ano</label>
                    <input
                      className={inputCls}
                      type="number"
                      value={turma.ano}
                      onChange={(e) => {
                        const v = Number(e.target.value) || turma.ano;
                        setTurmas((p) => p.map((i) => i.id === turma.id ? { ...i, ano: v } : i));
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSaving_ || isDeleting_}
                    onClick={() => updateTurma(turma)}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {isSaving_ ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span className="hidden md:inline">Salvar</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving_ || isDeleting_}
                    onClick={() => deleteTurma(turma)}
                    className="flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-red-500 transition-all hover:bg-red-100 disabled:opacity-60"
                  >
                    {isDeleting_ ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
