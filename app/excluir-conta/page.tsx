import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Trash2 } from "lucide-react";

import { auth } from "@/auth";
import { BrandMark } from "@/components/brand-mark";
import { DeleteAccountForm } from "@/components/delete-account-form";

export const metadata: Metadata = {
  title: "Excluir conta",
  description: "Solicite a exclusão permanente da sua conta Pequenos Passos e dos dados associados.",
};

export default async function DeleteAccountPage() {
  const session = await auth();

  return (
    <main className="mesh-bg min-h-dvh px-4 py-10 text-[#17213f] md:px-6">
      <article className="mx-auto max-w-2xl rounded-[0.95rem] border border-[#e8e3f0] bg-white p-6 shadow-[0_30px_90px_-52px_rgba(91,58,85,0.5)] md:p-8">
        <BrandMark href="/" />
        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#f4c7cf] bg-[#fff4f6] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#a8324d]">
          <Trash2 className="size-3.5" />
          Exclusao permanente
        </span>
        <h1 className="font-heading mt-4 text-3xl font-extrabold md:text-4xl">Excluir conta e dados</h1>
        <div className="mt-5 space-y-4 text-sm font-semibold leading-relaxed text-[#6f626c]">
          <p>
            Este é o canal protegido para remover uma conta do Pequenos Passos quando você não está usando o painel ou já desinstalou o aplicativo.
          </p>
          <p>
            A exclusão remove registros, fotos, turmas, crianças, planejamentos, projetos importados e sessões
            associados à conta. Essa ação não pode ser desfeita.
          </p>
        </div>
        {session?.user?.id ? (
          <DeleteAccountForm />
        ) : (
          <Link
            href="/login?callbackUrl=%2Fexcluir-conta"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f3ca6,#6757c8_54%,#9a86e6)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:saturate-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6757c8]/20"
          >
            Entrar com Google para continuar
          </Link>
        )}
        <p className="mt-5 flex items-start gap-2 text-xs font-semibold leading-relaxed text-[#6d6c82]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#16804a]" />
          Por segurança, apenas a pessoa autenticada com a conta Google pode confirmar a exclusão.
        </p>
      </article>
    </main>
  );
}
