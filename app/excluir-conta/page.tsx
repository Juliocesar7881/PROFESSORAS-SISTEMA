import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Trash2 } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Excluir conta",
  description: "Solicite a exclusão permanente da sua conta Pequenos Passos e dos dados associados.",
};

export default function DeleteAccountPage() {
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
            Entre na sua conta, abra <strong>Conta</strong> e selecione <strong>Excluir conta e dados</strong>.
            No aplicativo Android, toque no icone de conta no cabecalho e escolha <strong>Excluir conta</strong>.
          </p>
          <p>
            A exclusao remove registros, fotos, turmas, criancas, planejamentos, projetos importados e sessoes
            associados a conta. Essa acao nao pode ser desfeita.
          </p>
        </div>
        <Link
          href="/login?callbackUrl=%2Fdashboard%2Fconfiguracoes"
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#8b4164] px-5 text-sm font-bold text-white transition hover:bg-[#73334f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b4164] focus-visible:ring-offset-2"
        >
          Entrar para excluir minha conta
        </Link>
        <p className="mt-5 flex items-start gap-2 text-xs font-semibold leading-relaxed text-[#6d6c82]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#16804a]" />
          Por seguranca, apenas a pessoa autenticada com a conta Google pode confirmar a exclusao.
        </p>
      </article>
    </main>
  );
}
