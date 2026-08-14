"use client";

import { useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { BadgeCheck, Download, Loader2, ShieldAlert, Smartphone, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const userName = session?.user?.name ?? "Professora";
  const userEmail = session?.user?.email ?? "sem email";
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL;

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (!parts.length) return "P";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userName]);

  const deleteAccount = async () => {
    const confirmDelete = window.confirm("Tem certeza? Esta acao exclui sua conta e dados salvos.");
    if (!confirmDelete) return;

    setDeletingAccount(true);
    const response = await fetch("/api/account", { method: "DELETE" });
    setDeletingAccount(false);

    if (!response.ok) {
      toast.error("Nao foi possivel excluir a conta");
      return;
    }

    toast.success("Conta excluida");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pf-section pf-section-blue p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-[1.35rem] leading-tight text-[#312834] md:text-[1.6rem]">Conta</h2>
            <p className="mt-1 text-sm font-bold leading-relaxed text-[#857582]">
              Acesso gratuito, seguranca e dados da sua conta.
            </p>
          </div>
          <div className="hidden rounded-xl border border-[#f0e2e8] bg-white p-2.5 sm:block">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6a4562,#a65f7f_54%,#f0b8c9)] text-sm font-black text-white shadow-sm">
                {initials}
              </div>
              <div>
                <p className="max-w-[220px] truncate text-sm font-bold text-[#312834]">{userName}</p>
                <p className="max-w-[220px] truncate text-xs font-semibold text-[#857582]">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Card className="pf-section pf-section-blue">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-heading text-xl text-[#312834]">Acesso liberado</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#857582]">
                Todas as contas usam o Pequenos Passos completo gratuitamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              <div className="rounded-2xl border border-[#d8f3df] bg-emerald-50 p-3.5 text-sm text-emerald-800">
                <p className="inline-flex items-center gap-2 font-bold text-emerald-800">
                  <BadgeCheck className="size-4 text-emerald-600" />
                  Gratuito para todas as professoras
                </p>
                <p className="mt-1 font-semibold">
                  Projetos, impressao, planejamento, registros, avaliacao assistida, PDF, Word e aplicativo ficam sem assinatura.
                </p>
              </div>

              <div className="grid gap-2 text-sm font-semibold text-[#74616d]">
                <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Sem teste expirando.</p>
                <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Sem tela de pagamento para continuar usando.</p>
                <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Exports e IA disponiveis para contas gratuitas.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="pf-section pf-section-green">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-heading text-xl text-[#312834]">Produto simplificado</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#857582]">
                Turmas e criancas com cadastro minimo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0 text-sm font-semibold text-[#74616d]">
              <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Biblioteca de projetos como tela principal.</p>
              <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Impressao facil por upload manual de imagens.</p>
              <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Registros por texto, audio e fotos.</p>
              <p className="rounded-xl border border-[#f0e2e8] bg-white p-3">Avaliacao com IA baseada nos registros selecionados.</p>
            </CardContent>
          </Card>

          <Card className="pf-section pf-section-blue">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-xl text-[#17213f]"><Smartphone className="size-5 text-[#6757c8]" /> Pequenos Passos</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#857582]">Aplicativo Android para registros individuais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              {apkUrl ? <a href={apkUrl} download className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#7d405d] px-4 text-sm font-bold text-white"><Download className="size-4" /> Baixar APK 1.2.0</a> : <p className="rounded-lg border border-[#eadde5] bg-white p-3 text-sm font-semibold text-[#857582]">O APK sera exibido aqui assim que a compilacao estiver publicada.</p>}
              {apkUrl ? <p className="text-xs font-semibold leading-relaxed text-[#857582]">Android 7 ou superior. Atualiza normalmente a versao 1.0.1 sem apagar os dados do aplicativo.</p> : null}
            </CardContent>
          </Card>
        </div>

        <Card className="pf-section pf-section-rose">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="font-heading text-xl text-[#312834]">Privacidade e seguranca</CardTitle>
            <CardDescription className="text-[13px] font-semibold text-[#857582]">
              Controle da conta e exclusao de dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 text-sm text-[#74616d]">
            <p className="inline-flex items-center gap-2 rounded-lg border border-[#f0e2e8] bg-[#fff3f7]/60 px-3 py-2 font-semibold text-[#74616d]">
              <Sparkles className="size-4 text-[#a65f7f]" />
              O acesso gratuito nao altera sua privacidade.
            </p>
            <p className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              <ShieldAlert className="size-4" />
              Acao irreversivel: exclusao completa da conta
            </p>
            <p>
              Excluir conta remove dados salvos do Pequenos Passos. Registros técnicos de auditoria podem ser mantidos pelo período legal necessário.
            </p>
            <Button variant="destructive" onClick={deleteAccount} disabled={deletingAccount} className="w-full">
              {deletingAccount ? <Loader2 className="size-4 animate-spin" /> : null}
              Excluir conta e dados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
