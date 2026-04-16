"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, School, Trash2, UsersRound, Sparkles, CheckCircle2 } from "lucide-react";

import { DashboardPageHero } from "@/components/dashboard-page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Turma = { id: string; nome: string; faixaEtaria: string; ano: number };

const inputCls =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";
const labelCls = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400";

function normalizeSchoolYear(rawValue: string | number) {
  const parsed = typeof rawValue === "number" ? rawValue : Number.parseInt(String(rawValue), 10);
  if (Number.isNaN(parsed)) return new Date().getFullYear();
  return Math.max(2000, Math.min(2100, parsed));
}

function getValidationMessage(errorPayload: unknown) {
  if (!errorPayload || typeof errorPayload !== "object") return null;

  const payload = errorPayload as {
    error?: {
      message?: string;
      details?: {
        fieldErrors?: Record<string, string[] | undefined>;
      };
    };
  };

  const fieldErrors = payload.error?.details?.fieldErrors;
  if (!fieldErrors) return payload.error?.message ?? null;

  const messages = Object.values(fieldErrors)
    .flatMap((items) => items ?? [])
    .filter(Boolean);

  if (messages.length) {
    return messages[0];
  }

  return payload.error?.message ?? null;
}

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [turmasError, setTurmasError] = useState<string | null>(null);
  const [savingTurmaId, setSavingTurmaId] = useState<string | null>(null);
  const [deletingTurmaId, setDeletingTurmaId] = useState<string | null>(null);
  const [newTurma, setNewTurma] = useState({ nome: "", faixaEtaria: "", ano: String(new Date().getFullYear()) });

  const turmasOrdenadas = useMemo(
    () => [...turmas].sort((a, b) => a.ano === b.ano ? a.nome.localeCompare(b.nome) : b.ano - a.ano),
    [turmas]
  );

  const loadTurmas = useCallback(async () => {
    setLoadingTurmas(true);
    setTurmasError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const r = await fetch("/api/turmas", {
        signal: controller.signal,
        cache: "no-store",
      });

      const raw = await r.text();
      const j = raw ? (JSON.parse(raw) as { data?: Turma[]; error?: { message?: string } }) : {};

      if (!r.ok) {
        throw new Error(j.error?.message ?? "Falha ao carregar turmas");
      }

      setTurmas((j.data ?? []) as Turma[]);
    } catch (e) {
      const rawMessage = e instanceof DOMException && e.name === "AbortError"
        ? "A listagem de turmas demorou demais para responder."
        : e instanceof Error
          ? e.message
          : "Falha ao carregar turmas";

      const message = rawMessage === "Erro interno inesperado"
        ? "Não foi possível consultar as turmas no banco agora."
        : rawMessage;

      toast.error(message);
      setTurmasError(message);
      setTurmas([]);
    } finally {
      clearTimeout(timeout);
      setLoadingTurmas(false);
    }
  }, []);

  useEffect(() => { void loadTurmas(); }, [loadTurmas]);

  const createTurma = async () => {
    const nome = newTurma.nome.trim(), faixaEtaria = newTurma.faixaEtaria.trim();
    if (!nome || !faixaEtaria) {
      toast.error("Preencha nome da turma e faixa etária");
      return;
    }

    const ano = normalizeSchoolYear(newTurma.ano);

    setSavingTurmaId("new");
    try {
      const r = await fetch("/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, faixaEtaria, ano }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(getValidationMessage(j) ?? "Falha");
      toast.success("Turma criada com sucesso!");
      setNewTurma({ nome: "", faixaEtaria: "", ano: String(new Date().getFullYear()) });
      await loadTurmas();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setSavingTurmaId(null); }
  };

  const updateTurma = async (turma: Turma) => {
    setSavingTurmaId(turma.id);
    try {
      const r = await fetch(`/api/turmas/${turma.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: turma.nome.trim(),
          faixaEtaria: turma.faixaEtaria.trim(),
          ano: normalizeSchoolYear(turma.ano),
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(getValidationMessage(j) ?? "Falha");
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
      <DashboardPageHero
        icon={School}
        badge="Gestão de Turmas"
        title="Suas turmas organizadas"
        description="Crie, edite e gerencie turmas com facilidade."
        gradient="linear-gradient(135deg, #c026d3 0%, #a21caf 50%, #7c3aed 100%)"
        orbColor="rgba(232, 121, 249, 0.6)"
        borderClassName="border-fuchsia-200/60"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
            <Sparkles className="size-3" />
            {turmas.length} turma{turmas.length !== 1 ? "s" : ""} ativa{turmas.length !== 1 ? "s" : ""}
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* ─── Nova Turma ─── */}
        <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
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
                  inputMode="numeric"
                  value={newTurma.ano}
                  onChange={(e) => setNewTurma((p) => ({ ...p, ano: e.target.value }))}
                />
              </div>

              <Button
                type="button"
                onClick={createTurma}
                disabled={savingTurmaId === "new"}
                className="h-11 w-full justify-center gap-2 rounded-xl border-0 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(108,92,231,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
              >
                {savingTurmaId === "new" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlusCircle className="size-4" />
                )}
                Adicionar turma
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Lista de Turmas ─── */}
        <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-xl font-bold text-gray-900">Turmas cadastradas</h3>
                <p className="mt-0.5 text-xs text-gray-400">Edite e salve individualmente</p>
              </div>
              {turmas.length > 0 && (
                <Badge className="h-auto rounded-full border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-bold text-fuchsia-600">
                  {turmas.length} cadastrada{turmas.length !== 1 ? "s" : ""}
                </Badge>
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

            {!loadingTurmas && turmasError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">{turmasError}</p>
                <Button
                  type="button"
                  onClick={() => void loadTurmas()}
                  variant="outline"
                  className="mt-3 h-9 rounded-lg border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  Tentar novamente
                </Button>
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
                      inputMode="numeric"
                      value={turma.ano}
                      onChange={(e) => {
                        const v = normalizeSchoolYear(e.target.value);
                        setTurmas((p) => p.map((i) => i.id === turma.id ? { ...i, ano: v } : i));
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isSaving_ || isDeleting_}
                    onClick={() => updateTurma(turma)}
                    variant="outline"
                    className="h-10 justify-center gap-1.5 rounded-xl border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {isSaving_ ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span className="hidden md:inline">Salvar</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={isSaving_ || isDeleting_}
                    onClick={() => deleteTurma(turma)}
                    variant="outline"
                    className="h-10 justify-center rounded-xl border-red-200 bg-red-50 px-3 text-red-500 transition-all hover:bg-red-100 disabled:opacity-60"
                  >
                    {isDeleting_ ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </article>
              );
            })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
