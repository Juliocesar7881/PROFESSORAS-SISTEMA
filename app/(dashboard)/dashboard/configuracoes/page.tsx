"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { BadgeCheck, Download, ShieldCheck, Smartphone, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Professora";
  const userEmail = session?.user?.email ?? "sem email";
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL;

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (!parts.length) return "P";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userName]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pf-section pf-section-blue p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-[1.35rem] leading-tight text-[#17213f] md:text-[1.6rem]">Conta</h2>
            <p className="mt-1 text-sm font-bold leading-relaxed text-[#6d6c82]">
              Acesso gratuito, seguranca e dados da sua conta.
            </p>
          </div>
          <div className="hidden rounded-xl border border-[#e8e3f0] bg-white p-2.5 sm:block">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f3ca6,#6757c8_54%,#b9a9f2)] text-sm font-black text-white shadow-sm">
                {initials}
              </div>
              <div>
                <p className="max-w-[220px] truncate text-sm font-bold text-[#17213f]">{userName}</p>
                <p className="max-w-[220px] truncate text-xs font-semibold text-[#6d6c82]">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Card className="pf-section pf-section-blue">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-heading text-xl text-[#17213f]">Acesso liberado</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#6d6c82]">
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

              <div className="grid gap-2 text-sm font-semibold text-[#6d6c82]">
                <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Sem teste expirando.</p>
                <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Sem tela de pagamento para continuar usando.</p>
                <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Exports e IA disponiveis para contas gratuitas.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="pf-section pf-section-green">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-heading text-xl text-[#17213f]">Produto simplificado</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#6d6c82]">
                Turmas e criancas com cadastro minimo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0 text-sm font-semibold text-[#6d6c82]">
              <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Biblioteca de projetos como tela principal.</p>
              <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Impressao facil por upload manual de imagens.</p>
              <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Registros por texto, audio e fotos.</p>
              <p className="rounded-xl border border-[#e8e3f0] bg-white p-3">Avaliacao com IA baseada nos registros selecionados.</p>
            </CardContent>
          </Card>

          <Card className="pf-section pf-section-blue">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-xl text-[#17213f]"><Smartphone className="size-5 text-[#6757c8]" /> Pequenos Passos</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#6d6c82]">Aplicativo Android para registros individuais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              {apkUrl ? <a href={apkUrl} download className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#6757c8] px-4 text-sm font-bold text-white"><Download className="size-4" /> Baixar APK atualizado</a> : <p className="rounded-lg border border-[#e8e3f0] bg-white p-3 text-sm font-semibold text-[#6d6c82]">O APK sera exibido aqui assim que a compilacao estiver publicada.</p>}
              {apkUrl ? <p className="text-xs font-semibold leading-relaxed text-[#6d6c82]">Android 7 ou superior. Atualiza versoes anteriores sem apagar os dados do aplicativo.</p> : null}
            </CardContent>
          </Card>
        </div>

        <Card className="pf-section pf-section-blue">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="font-heading text-xl text-[#17213f]">Privacidade e segurança</CardTitle>
            <CardDescription className="text-[13px] font-semibold text-[#6d6c82]">
              Seus dados pedagógicos ficam privados e separados por conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 text-sm text-[#6d6c82]">
            <p className="inline-flex items-center gap-2 rounded-lg border border-[#e8e3f0] bg-[#f3f0ff]/60 px-3 py-2 font-semibold text-[#6d6c82]">
              <Sparkles className="size-4 text-[#6757c8]" />
              O acesso gratuito nao altera sua privacidade.
            </p>
            <p className="inline-flex items-center gap-2 rounded-lg border border-[#ccece5] bg-[#eaf9f6] px-3 py-2 font-semibold text-[#247f75]">
              <ShieldCheck className="size-4" />
              Fotos privadas e sessões protegidas
            </p>
            <p>
              O painel não oferece ações destrutivas. Consulte a política para entender armazenamento, correção e seus direitos sobre os dados.
            </p>
            <Link href="/privacidade" className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#ddd4f7] bg-[#f8f6ff] px-4 text-sm font-black text-[#6757c8] transition hover:border-[#b9a9f2] hover:bg-[#f1edff]">Ler política de privacidade</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
