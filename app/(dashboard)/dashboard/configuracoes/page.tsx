"use client";

import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { BadgeCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();

  const startCheckout = async (ciclo: "mensal" | "anual") => {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciclo }),
    });

    const json = await response.json();

    if (!response.ok || !json.data?.checkoutUrl) {
      toast.error(json.error?.message ?? "Nao foi possivel iniciar upgrade");
      return;
    }

    window.location.href = json.data.checkoutUrl;
  };

  const deleteAccount = async () => {
    const confirmDelete = window.confirm("Tem certeza? Esta acao exclui todos os dados de alunos em cascata.");

    if (!confirmDelete) {
      return;
    }

    const response = await fetch("/api/account", { method: "DELETE" });

    if (!response.ok) {
      toast.error("Nao foi possivel excluir a conta");
      return;
    }

    toast.success("Conta excluida");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Plano atual</CardTitle>
          <CardDescription className="text-[#6A638D]">{session?.user?.plano === "PRO" ? "Plano Pro ativo" : "Plano Gratuito"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-[#DCECF8] bg-[#F8FBFF] p-3 text-sm text-[#4E4770]">
            <p className="inline-flex items-center gap-2 font-semibold text-[#1E1740]">
              <BadgeCheck className="size-4 text-[#0BB8A8]" />
              Upgrade para recursos completos
            </p>
            <p className="mt-1 text-[#6A638D]">Projetos premium, mais relatorios e fluxo completo para coordenacao.</p>
          </div>

          <Button onClick={() => startCheckout("mensal")} className="w-full bg-[#0BB8A8] text-white hover:bg-[#0A9F92]">
            Upgrade Pro mensal - R$9,90
          </Button>
          <Button onClick={() => startCheckout("anual")} variant="outline" className="w-full border-[#D8E9F8] bg-white text-[#1E1740] hover:border-[#BDEEE8] hover:bg-[#F2FCFA]">
            Upgrade Pro anual - R$99
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Privacidade e LGPD</CardTitle>
          <CardDescription className="text-[#6A638D]">Professora controladora. Planejei operadora. Art. 14 LGPD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[#4E4770]">
          <p className="inline-flex items-center gap-2 rounded-lg border border-[#FFE1A0] bg-[#FFF7E4] px-3 py-2 text-[#7C6415]">
            <ShieldAlert className="size-4" />
            Acao irreversivel: exclusao completa da conta
          </p>
          <p>Excluir conta executa apagamento em cascata de dados de alunos.</p>
          <p>Audit logs sao retidos por 2 anos e expurgados automaticamente.</p>
          <Button variant="destructive" onClick={deleteAccount} className="w-full">
            Excluir conta e dados
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
