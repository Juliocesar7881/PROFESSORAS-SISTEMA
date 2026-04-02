"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, PlusCircle, School, ShieldAlert, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  ano: number;
};

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
  const userEmail = session?.user?.email ?? "-";
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
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-slate-900">Conta</CardTitle>
            <CardDescription className="text-slate-600">Informações da usuária autenticada no Planejei.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#9333EA] text-sm font-black text-white">
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isPro ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                  {isPro ? "Plano PRO" : "Plano Gratuito"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Plano atual</CardTitle>
          <CardDescription className="text-slate-600">{isPro ? "Plano Pro ativo" : "Plano Gratuito"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="inline-flex items-center gap-2 font-semibold text-slate-900">
              <BadgeCheck className="size-4 text-emerald-600" />
              Upgrade para recursos completos
            </p>
            <p className="mt-1 text-slate-600">Projetos premium, mais relatórios e fluxo completo para coordenação.</p>
          </div>

          <Button onClick={() => startCheckout("mensal")} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            Upgrade Pro mensal - R$9,90
          </Button>
          <Button onClick={() => startCheckout("anual")} variant="outline" className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            Upgrade Pro anual - R$99
          </Button>
        </CardContent>
      </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Privacidade e LGPD</CardTitle>
          <CardDescription className="text-slate-600">Professora controladora. Planejei operadora. Art. 14 LGPD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
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

      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Gestão de turmas</CardTitle>
          <CardDescription className="text-slate-600">Crie, atualize e arquive turmas direto nesta tela.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.5fr_1fr_120px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nome da turma</label>
              <Input
                className="border-slate-200 bg-white"
                placeholder="Ex: Jardim II A"
                value={newTurma.nome}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, nome: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Faixa etária</label>
              <Input
                className="border-slate-200 bg-white"
                placeholder="Ex: 4-5 anos"
                value={newTurma.faixaEtaria}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, faixaEtaria: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Ano</label>
              <Input
                className="border-slate-200 bg-white"
                type="number"
                value={newTurma.ano}
                onChange={(event) => setNewTurma((prev) => ({ ...prev, ano: Number(event.target.value) || new Date().getFullYear() }))}
              />
            </div>
            <Button
              type="button"
              onClick={createTurma}
              disabled={savingTurmaId === "new"}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {savingTurmaId === "new" ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
              <span className="ml-2">Adicionar</span>
            </Button>
          </div>

          <div className="space-y-2">
            {loadingTurmas && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Carregando turmas...
              </div>
            )}

            {!loadingTurmas && !turmas.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Nenhuma turma cadastrada.
              </div>
            )}

            {!loadingTurmas &&
              turmas.map((turma) => {
                const isSaving = savingTurmaId === turma.id;
                const isDeleting = deletingTurmaId === turma.id;

                return (
                  <article key={turma.id} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1.5fr_1fr_110px_auto_auto] md:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Nome</label>
                      <Input
                        className="border-slate-200 bg-slate-50"
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
                        className="border-slate-200 bg-slate-50"
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
                        className="border-slate-200 bg-slate-50"
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
                      className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      disabled={isSaving || isDeleting}
                      onClick={() => updateTurma(turma)}
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <School className="size-4" />}
                      <span className="ml-2">Salvar</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      disabled={isSaving || isDeleting}
                      onClick={() => deleteTurma(turma)}
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      <span className="ml-2">Arquivar</span>
                    </Button>
                  </article>
                );
              })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <UserRound className="size-3.5" />
              Dica
            </p>
            <p className="mt-1">Arquivar turma mantém histórico e remove a turma das listas ativas do dia a dia.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
