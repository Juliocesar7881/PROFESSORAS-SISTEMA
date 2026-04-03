import Link from "next/link";
import { Download, FileText, Sparkles, FileBarChart, Crown } from "lucide-react";

import { auth } from "@/auth";
import { CopyTextButton } from "@/components/copy-text-button";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { RelatorioService } from "@/services/relatorio.service";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

export default async function RelatoriosPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const isPro = session.user.plano === "PRO";
  const relatorios = hasReachableDatabase
    ? await new RelatorioService().listRecentByUser(session.user.id, 30)
    : [];

  return (
    <div className="space-y-6">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-rose-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(252, 165, 165, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90">
              <FileBarChart className="size-3" />
              Relatórios pedagógicos
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
              Seus relatórios gerados
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Histórico centralizado dos últimos relatórios criados com IA.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              <Sparkles className="size-3" />
              {relatorios.length} relatório{relatorios.length !== 1 ? "s" : ""}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                isPro
                  ? "border-emerald-300/50 bg-emerald-400/20 text-emerald-100"
                  : "border-white/20 bg-white/10 text-white/80"
              }`}
            >
              <Crown className="size-3" />
              {isPro ? "PDF liberado" : "Upgrade para PDF"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Relatórios list ─── */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        {relatorios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-rose-50">
              <FileBarChart className="size-8 text-rose-400" />
            </div>
            <p className="font-heading text-xl font-bold text-gray-700">Nenhum relatório ainda</p>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
              Acesse um aluno e gere o primeiro relatório com IA. Ele aparecerá aqui automaticamente.
            </p>
            <Link
              href="/dashboard/alunos"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100"
            >
              <Sparkles className="size-4" />
              Acessar alunos para gerar relatório
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {relatorios.map((relatorio) => (
              <article
                key={relatorio.id}
                className="group rounded-2xl border border-gray-200 bg-gray-50/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:shadow-[0_8px_24px_-8px_rgba(225,29,72,0.1)]"
              >
                {/* Header */}
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 transition-colors group-hover:text-rose-700">
                      {relatorio.aluno.nome}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-400">
                      {relatorio.aluno.turma.nome}
                      <span className="mx-1.5 text-gray-300">•</span>
                      Período: {relatorio.periodo}
                      <span className="mx-1.5 text-gray-300">•</span>
                      {new Date(relatorio.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                    <Sparkles className="size-3" />
                    Gerado com IA
                  </span>
                </div>

                {/* Text preview */}
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                  {relatorio.texto}
                </p>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                  <Link
                    href={`/dashboard/alunos/${relatorio.aluno.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <FileText className="size-3.5" />
                    Abrir aluno
                  </Link>

                  <CopyTextButton text={relatorio.texto} />

                  {isPro ? (
                    <a
                      href={`/api/relatorios/export?relatorioId=${relatorio.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 transition-all hover:bg-sky-100"
                    >
                      <Download className="size-3.5" />
                      Baixar PDF
                    </a>
                  ) : (
                    <Link
                      href="/dashboard/configuracoes"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600 transition-all hover:bg-violet-100"
                    >
                      <Crown className="size-3.5" />
                      Upgrade para exportar PDF
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
