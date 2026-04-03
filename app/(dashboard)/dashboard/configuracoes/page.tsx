"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, PlusCircle, School, ShieldAlert, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  ano: number;
};

const lightInput = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [savingTurmaId, setSavingTurmaId] = useState<string | null>(null);
  const [deletingTurmaId, setDeletingTurmaId] = useState<string | null>(null);
  const [newTurma, setNewTurma] = useState({
    nome: "",
    faixaEtaria: "",
    ano: new Date().getFullYear(),
  });

  const userName = session?.user?.name ?? "Professora";
  const userPlan = String(session?.user?.plano ?? "FREE").toUpperCase();
  const isPro = userPlan === "PRO";

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (!parts.length) return "P";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userName]);

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
    const confirmDelete = window.confirm(`Excluir a turma \"${turma.nome}\"?`);

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

      toast.success("Turma removida");
      await loadTurmas();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao remover turma";
      toast.error(message);
    } finally {
      setDeletingTurmaId(null);
    }
  };

  const startCheckout = async (ciclo: "mensal" | "anual") => {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciclo }),
    });

    const json = await response.json();

    if (!response.ok || !json.data?.checkoutUrl) {
      toast.error(json.error?.message ?? "Não foi possível iniciar upgrade");
      return;
    }

    window.location.href = json.data.checkoutUrl;
  };

  const deleteAccount = async () => {
    const confirmDelete = window.confirm("Tem certeza? Esta ação exclui todos os dados de alunos em cascata.");

    if (!confirmDelete) {
      return;
    }

    const response = await fetch("/api/account", { method: "DELETE" });

    if (!response.ok) {
      toast.error("Não foi possível excluir a conta");
      return;
    }

    toast.success("Conta excluída");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-slate-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(203, 213, 225, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Configurações</h2>
            <p className="mt-1 text-sm text-white/80">
              Gerencie sua conta, plano e turmas em um único lugar.
            </p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-3 backdrop-blur-md sm:block">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#a78bfa] text-sm font-black text-white shadow-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{userName}</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isPro ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30" : "bg-white/20 text-white border border-white/20"}`}>
                  {isPro ? "Plano PRO" : "Plano Gratuito"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-gray-900">Plano atual</CardTitle>
          <CardDescription className="text-gray-500">{isPro ? "Plano Pro ativo" : "Plano Gratuito"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            <p className="inline-flex items-center gap-2 font-semibold text-gray-900">
              <BadgeCheck className="size-4 text-emerald-500" />
              Upgrade para recursos completos
            </p>
            <p className="mt-1 text-gray-500">Projetos premium, mais relatórios e fluxo completo para coordenação.</p>
          </div>

          <button type="button" onClick={() => startCheckout("mensal")} className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-0.5">
            Upgrade Pro mensal - R$9,90
          </button>
          <button type="button" onClick={() => startCheckout("anual")} className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 transition-all hover:bg-gray-50">
            Upgrade Pro anual - R$99
          </button>
        </CardContent>
      </Card>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-gray-900">Privacidade e LGPD</CardTitle>
          <CardDescription className="text-gray-500">Professora controladora. Planejei operadora. Art. 14 LGPD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
            <ShieldAlert className="size-4" />
            Ação irreversível: exclusão completa da conta
          </p>
          <p>Excluir conta executa apagamento em cascata de dados de alunos.</p>
          <p>Logs de auditoria são retidos por 2 anos e expurgados automaticamente.</p>
          <Button variant="destructive" onClick={deleteAccount} className="w-full">
            Excluir conta e dados
          </Button>
        </CardContent>
      </Card>
      </div>

      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-gray-900">Gestão de turmas</CardTitle>
          <CardDescription className="text-gray-500">Crie, atualize e arquive turmas direto nesta tela.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1.5fr_1fr_120px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-400">Nome da turma</label>
              <input
                className={lightInput}
                placeholder="Ex: Jardim II A"
                value={newTurma.nome}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, nome: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-400">Faixa etária</label>
              <input
                className={lightInput}
                placeholder="Ex: 4-5 anos"
                value={newTurma.faixaEtaria}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, faixaEtaria: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-400">Ano letivo</label>
              <input
                className={lightInput}
                type="number"
                value={newTurma.ano}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, ano: Number(event.target.value) || new Date().getFullYear() }))}
              />
            </div>
            <button
              type="button"
              onClick={createTurma}
              disabled={savingTurmaId === "new"}
              className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6] px-4 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingTurmaId === "new" ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
              <span className="ml-2">Adicionar</span>
            </button>
          </div>

          <div className="space-y-2">
            {loadingTurmas && (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                <Loader2 className="size-4 animate-spin text-[#6C5CE7]" />
                Carregando turmas...
              </div>
            )}

            {!loadingTurmas && !turmas.length && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-400">
                Nenhuma turma cadastrada.
              </div>
            )}

            {!loadingTurmas &&
              turmas.map((turma) => {
                const isSaving = savingTurmaId === turma.id;
                const isDeleting = deletingTurmaId === turma.id;

                return (
                  <article key={turma.id} className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3 md:grid-cols-[1.5fr_1fr_110px_auto_auto] md:items-end">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-400">Nome</label>
                      <input
                        className={lightInput}
                        value={turma.nome}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, nome: value } : item)));
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-400">Faixa etária</label>
                      <input
                        className={lightInput}
                        value={turma.faixaEtaria}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, faixaEtaria: value } : item)));
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-400">Ano letivo</label>
                      <input
                        className={lightInput}
                        type="number"
                        value={turma.ano}
                        onChange={(event) => {
                          const value = Number(event.target.value) || turma.ano;
                          setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, ano: value } : item)));
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-100 disabled:opacity-60"
                      disabled={isSaving || isDeleting}
                      onClick={() => updateTurma(turma)}
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <School className="size-4" />}
                    </button>

                    <button
                      type="button"
                      className="flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-3 text-red-500 transition-all hover:bg-red-100 disabled:opacity-60"
                      disabled={isSaving || isDeleting}
                      onClick={() => deleteTurma(turma)}
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </article>
                );
              })}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
            <p className="inline-flex items-center gap-1 font-semibold text-gray-600">
              <UserRound className="size-3.5" />
              Dica
            </p>
            <p className="mt-1">Arquivar turma mantém histórico e remove a turma das listas ativas do dia a dia.</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
