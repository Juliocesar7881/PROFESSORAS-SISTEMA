import Link from "next/link";
import { Download, FileText, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { CopyTextButton } from "@/components/copy-text-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { RelatorioService } from "@/services/relatorio.service";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

export default async function RelatoriosPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const isPro = session.user.plano === "PRO";
  const relatorios = hasReachableDatabase ? await new RelatorioService().listRecentByUser(session.user.id, 30) : [];

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Relatórios gerados</CardTitle>
          <CardDescription className="text-slate-500">Histórico centralizado dos relatórios para famílias e coordenação.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700 ring-1 ring-cyan-100">{relatorios.length} relatórios recentes</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 ring-1 ring-amber-100">Geração por IA</span>
          <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${isPro ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-rose-50 text-rose-700 ring-rose-100"}`}>
            {isPro ? "Plano Pro: exportação em PDF liberada" : "Plano Gratuito: exportação em PDF bloqueada"}
          </span>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardContent className="space-y-3 pt-4">
          {relatorios.map((relatorio) => (
            <article key={relatorio.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200/70 hover:shadow-md">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-slate-900">{relatorio.aluno.nome} - {relatorio.aluno.turma.nome}</p>
                <span className="text-xs font-semibold text-slate-500">{new Date(relatorio.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>

              <p className="mb-2 text-xs font-semibold text-slate-600">Período: {relatorio.periodo}</p>
              <p className="line-clamp-3 text-sm text-slate-700">{relatorio.texto}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href={`/dashboard/alunos/${relatorio.aluno.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline">
                  <FileText className="size-3.5" />
                  Abrir aluno
                </Link>

                <CopyTextButton text={relatorio.texto} />

                {isPro ? (
                  <a
                    href={`/api/relatorios/export?relatorioId=${relatorio.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 underline"
                  >
                    <Download className="size-3.5" />
                    Baixar PDF
                  </a>
                ) : (
                  <Link href="/dashboard/configuracoes" className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 underline">
                    <Download className="size-3.5" />
                    Fazer upgrade para exportar PDF
                  </Link>
                )}
              </div>
            </article>
          ))}

          {!relatorios.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              <p>Nenhum relatório gerado ainda.</p>
              <Link href="/dashboard/alunos" className="mt-2 inline-flex items-center gap-1 font-semibold text-emerald-700 underline">
                <Sparkles className="size-4" />
                Acessar alunos para gerar o primeiro relatório
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
