"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, PlusCircle, School, ShieldAlert, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_TRIAL_DAYS, MONTHLY_PRICE_LABEL, YEARLY_PRICE_LABEL } from "@/lib/subscription";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  ano: number;
};

/* Using global pf-input class */

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [turmasError, setTurmasError] = useState<string | null>(null);
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
  const trialExpired = Boolean(session?.user?.trialExpired);
  const trialDaysLeft = Number(session?.user?.trialDaysLeft ?? 0);
  const requiresUpgrade = !isPro && trialExpired;

  const trialEndsLabel = useMemo(() => {
    if (!session?.user?.trialEndsAt) {
      return null;
    }

    const parsed = new Date(session.user.trialEndsAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleDateString("pt-BR");
  }, [session?.user?.trialEndsAt]);

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (!parts.length) return "P";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userName]);

  const loadTurmas = useCallback(async () => {
    setLoadingTurmas(true);
    setTurmasError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("/api/turmas", {
        signal: controller.signal,
        cache: "no-store",
      });

      const raw = await response.text();
      const json = raw
        ? (JSON.parse(raw) as { data?: Turma[]; error?: { message?: string } })
        : {};

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar turmas");
      }

      setTurmas((json.data ?? []) as Turma[]);
    } catch (error) {
      const rawMessage = error instanceof DOMException && error.name === "AbortError"
        ? "A listagem de turmas demorou demais para responder."
        : error instanceof Error
          ? error.message
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

  useEffect(() => {
    if (requiresUpgrade) {
      setTurmas([]);
      return;
    }

    void loadTurmas();
  }, [loadTurmas, requiresUpgrade]);

  const createTurma = async () => {
    if (requiresUpgrade) {
      toast.error("Seu teste terminou. Ative o Pro para gerenciar turmas.");
      return;
    }

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
    if (requiresUpgrade) {
      toast.error("Seu teste terminou. Ative o Pro para gerenciar turmas.");
      return;
    }

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
    if (requiresUpgrade) {
      toast.error("Seu teste terminou. Ative o Pro para gerenciar turmas.");
      return;
    }

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
        className="relative overflow-hidden rounded-[1.4rem] border border-slate-200/60 p-6 md:p-9"
        style={{ background: "linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(203, 213, 225, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[1.5rem] tracking-tight text-white md:text-[1.75rem]">Configurações</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
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
                  {isPro ? "Plano PRO" : requiresUpgrade ? "Teste expirado" : `Teste grátis (${FREE_TRIAL_DAYS} dias)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">

        <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-heading text-xl text-[#223246]">Plano atual</CardTitle>
          <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">
            {isPro
              ? "Plano Pro ativo"
              : requiresUpgrade
                ? "Seu teste terminou e o pagamento é obrigatório para continuar usando o sistema."
                : `Teste Pro ativo: ${Math.max(0, trialDaysLeft)} dia${Math.max(0, trialDaysLeft) === 1 ? "" : "s"} restantes${trialEndsLabel ? ` (até ${trialEndsLabel})` : ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          <div className={`rounded-2xl border p-3.5 text-sm ${requiresUpgrade ? "border-rose-200 bg-rose-50 text-rose-700" : "border-sky-100 bg-sky-50/50 text-[#3d5771]"}`}>
            <p className="inline-flex items-center gap-2 font-bold text-[#223246]">
              <BadgeCheck className="size-4 text-emerald-500" />
              {requiresUpgrade ? "Acesso bloqueado até ativar o Pro" : "Upgrade para recursos completos"}
            </p>
            <p className="mt-1 text-[#6f88a2]">
              {requiresUpgrade
                ? "Após os 14 dias grátis, a assinatura é obrigatória para continuar usando o Planejei."
                : "Projetos premium, mais relatórios e fluxo completo para coordenação."}
            </p>
          </div>

          <button type="button" onClick={() => startCheckout("mensal")} className="pf-btn-success w-full">
            Assinar mensal - {MONTHLY_PRICE_LABEL}
          </button>
          <button type="button" onClick={() => startCheckout("anual")} className="flex h-11 w-full items-center justify-center rounded-xl border border-sky-100 bg-sky-50/50 text-sm font-bold text-[#3d5771] transition-all hover:bg-sky-100">
            Assinar anual - {YEARLY_PRICE_LABEL}
          </button>
          <p className="text-xs font-semibold text-[#6f88a2]">Plano anual com cobrança única de {YEARLY_PRICE_LABEL}. Equivalente a R$12,50/mês.</p>
        </CardContent>
      </Card>

        <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-heading text-xl text-[#223246]">Privacidade e LGPD</CardTitle>
          <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">Professora controladora. Planejei operadora. Art. 14 LGPD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0 text-sm text-[#3d5771]">
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

      {requiresUpgrade ? (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-rose-900">Gestão de turmas bloqueada</CardTitle>
            <CardDescription className="text-rose-700">
              Seu período grátis encerrou. Assine o Pro para voltar a cadastrar, editar e organizar turmas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => startCheckout("mensal")}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-0.5"
            >
              Ativar agora por {MONTHLY_PRICE_LABEL}/mês
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="font-heading text-xl text-[#223246]">Gestão de turmas</CardTitle>
            <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">Crie, atualize e arquive turmas direto nesta tela.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div className="grid gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/40 p-4 md:grid-cols-[1.5fr_1fr_120px_auto] md:items-end">
              <div>
                <label className="pf-label">Nome da turma</label>
                <input
                  className="pf-input"
                  placeholder="Ex: Jardim II A"
                  value={newTurma.nome}
                  onChange={(event) => setNewTurma((prev) => ({ ...prev, nome: event.target.value }))}
                />
              </div>
              <div>
                <label className="pf-label">Faixa etária</label>
                <input
                  className="pf-input"
                  placeholder="Ex: 4-5 anos"
                  value={newTurma.faixaEtaria}
                  onChange={(event) => setNewTurma((prev) => ({ ...prev, faixaEtaria: event.target.value }))}
                />
              </div>
              <div>
                <label className="pf-label">Ano letivo</label>
                <input
                  className="pf-input"
                  type="number"
                  value={newTurma.ano}
                  onChange={(event) => setNewTurma((prev) => ({ ...prev, ano: Number(event.target.value) || new Date().getFullYear() }))}
                />
              </div>
              <button
                type="button"
                onClick={createTurma}
                disabled={savingTurmaId === "new"}
                className="pf-btn-primary"
              >
                {savingTurmaId === "new" ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                <span className="ml-2">Adicionar</span>
              </button>
            </div>

            <div className="space-y-2">
              {loadingTurmas && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 text-sm font-semibold text-[#6f88a2]">
                  <Loader2 className="size-4 animate-spin text-sky-500" />
                  Carregando turmas...
                </div>
              )}

              {!loadingTurmas && !turmas.length && (
                <div className="pf-empty py-6">
                  Nenhuma turma cadastrada.
                </div>
              )}

              {!loadingTurmas && turmasError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <p className="font-semibold">{turmasError}</p>
                  <button
                    type="button"
                    onClick={() => void loadTurmas()}
                    className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {!loadingTurmas &&
                turmas.map((turma) => {
                  const isSaving = savingTurmaId === turma.id;
                  const isDeleting = deletingTurmaId === turma.id;

                  return (
                    <article key={turma.id} className="grid gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/30 p-4 md:grid-cols-[1.5fr_1fr_110px_auto_auto] md:items-end">
                      <div>
                        <label className="pf-label">Nome</label>
                        <input
                          className="pf-input"
                          value={turma.nome}
                          onChange={(event) => {
                            const value = event.target.value;
                            setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, nome: value } : item)));
                          }}
                        />
                      </div>
                      <div>
                        <label className="pf-label">Faixa etária</label>
                        <input
                          className="pf-input"
                          value={turma.faixaEtaria}
                          onChange={(event) => {
                            const value = event.target.value;
                            setTurmas((prev) => prev.map((item) => (item.id === turma.id ? { ...item, faixaEtaria: value } : item)));
                          }}
                        />
                      </div>
                      <div>
                        <label className="pf-label">Ano letivo</label>
                        <input
                          className="pf-input"
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

            <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-3.5 text-xs text-[#6f88a2]">
              <p className="inline-flex items-center gap-1 font-bold text-[#3d5771]">
                <UserRound className="size-3.5" />
                Dica
              </p>
              <p className="mt-1.5">Arquivar turma mantém histórico e remove a turma das listas ativas do dia a dia.</p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
