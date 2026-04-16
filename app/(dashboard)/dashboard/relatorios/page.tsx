import Link from "next/link";
import { Crown, Download, FileBarChart, FileText, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { CopyTextButton } from "@/components/copy-text-button";
import { RelatorioService } from "@/services/relatorio.service";

type RelatorioListItem = {
  id: string;
  texto: string;
  periodo: string;
  createdAt: Date | string;
  aluno: {
    id: string;
    nome: string;
    turma: {
      nome: string;
    };
  };
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export default async function RelatoriosPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const isPro = session.user.plano === "PRO";
  const hasPdfAccess = isPro || session.user.trialExpired === false;
  const relatorios = (await new RelatorioService().listRecentByUser(session.user.id, 30)) as RelatorioListItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/avaliacoes" className="pf-chip border-sky-200 bg-sky-50 text-sky-700">
          ← Voltar para Avaliação IA
        </Link>
      </div>

      <div
        className="relative overflow-hidden rounded-[1.4rem] border border-sky-200/60 p-6 md:p-9"
        style={{ background: "linear-gradient(135deg, #4ca4ed 0%, #5bc9b6 50%, #7dc9f8 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(255, 255, 255, 0.55)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur-sm">
              <FileBarChart className="size-3.5" />
              Avaliação IA
            </div>
            <h2 className="font-heading text-[1.5rem] tracking-tight text-white md:text-[1.75rem]">
              Histórico de relatórios
            </h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-white/75">
              Uma visão limpa para revisar, copiar e exportar os relatórios já gerados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              <Sparkles className="size-3" />
              {relatorios.length} relatório{relatorios.length !== 1 ? "s" : ""}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                hasPdfAccess
                  ? "border-emerald-300/50 bg-emerald-400/20 text-emerald-50"
                  : "border-white/20 bg-white/10 text-white/80"
              }`}
            >
              <Crown className="size-3" />
              {hasPdfAccess ? "PDF liberado" : "PDF no plano PRO"}
            </span>
          </div>
        </div>
      </div>

      <div className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white p-5 md:p-7">
        {relatorios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-[1.25rem] bg-sky-50">
              <FileBarChart className="size-8 text-sky-400" />
            </div>
            <p className="font-heading text-xl font-bold text-[#223246]">Nenhum relatório ainda</p>
            <p className="mt-2.5 max-w-xs text-sm font-medium text-[#6f88a2]">
              Acesse um aluno e gere o primeiro relatório com IA. Ele aparecerá aqui automaticamente.
            </p>
            <Link
              href="/dashboard/avaliacoes"
              className="pf-btn-primary mt-5"
            >
              <Sparkles className="size-4" />
              Abrir Avaliação IA
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {relatorios.map((relatorio) => (
              <article
                key={relatorio.id}
                className="group rounded-2xl border border-sky-100 bg-sky-50/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-[0_8px_24px_-12px_rgba(76,164,237,0.35)]"
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition-all hover:bg-sky-50"
                  >
                    <FileText className="size-3.5" />
                    Abrir aluno
                  </Link>

                  <CopyTextButton text={relatorio.texto} />

                  <a
                    href={`data:application/msword;charset=utf-8,${encodeURIComponent(relatorio.texto)}`}
                    download={`relatorio-${slugify(relatorio.aluno.nome)}-${slugify(relatorio.periodo)}.doc`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-all hover:bg-teal-100"
                  >
                    <FileText className="size-3.5" />
                    Baixar Word
                  </a>

                  {hasPdfAccess ? (
                    <a
                      href={`/api/relatorios/export?relatorioId=${relatorio.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
                    >
                      <Download className="size-3.5" />
                      Baixar PDF
                    </a>
                  ) : (
                    <Link
                      href="/dashboard/configuracoes"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100"
                    >
                      <Crown className="size-3.5" />
                      Upgrade para liberar PDF
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
