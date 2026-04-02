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
    <div className="space-y-4">
      <Card className="glass-card border-[#DCE4EE]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#10253B]">Relatórios gerados</CardTitle>
          <CardDescription className="text-[#5F7388]">Histórico centralizado dos relatórios para famílias e coordenação.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[#EEF3FF] px-2 py-1 font-semibold text-[#5570A2]">{relatorios.length} relatórios recentes</span>
          <span className="rounded-full bg-[#FFF3DE] px-2 py-1 font-semibold text-[#A0771B]">Geração por IA</span>
          <span className={`rounded-full px-2 py-1 font-semibold ${isPro ? "bg-emerald-100 text-emerald-700" : "bg-[#FFEDEE] text-[#C0392B]"}`}>
            {isPro ? "Plano Pro: exportação em PDF liberada" : "Plano Gratuito: exportação em PDF bloqueada"}
          </span>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCE4EE]">
        <CardContent className="space-y-3 pt-4">
          {relatorios.map((relatorio) => (
            <article key={relatorio.id} className="rounded-2xl border border-[#E4EAF3] bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-[#10253B]">{relatorio.aluno.nome} - {relatorio.aluno.turma.nome}</p>
                <span className="text-xs font-semibold text-[#6A7E92]">{new Date(relatorio.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>

              <p className="mb-2 text-xs font-semibold text-[#5570A2]">Período: {relatorio.periodo}</p>
              <p className="line-clamp-3 text-sm text-[#3D536A]">{relatorio.texto}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href={`/dashboard/alunos/${relatorio.aluno.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E9D90] underline">
                  <FileText className="size-3.5" />
                  Abrir aluno
                </Link>

                <CopyTextButton text={relatorio.texto} />

                {isPro ? (
                  <a
                    href={`/api/relatorios/export?relatorioId=${relatorio.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#165DAD] underline"
                  >
                    <Download className="size-3.5" />
                    Baixar PDF
                  </a>
                ) : (
                  <Link href="/dashboard/configuracoes" className="inline-flex items-center gap-1 text-xs font-semibold text-[#C0392B] underline">
                    <Download className="size-3.5" />
                    Fazer upgrade para exportar PDF
                  </Link>
                )}
              </div>
            </article>
          ))}

          {!relatorios.length && (
            <div className="rounded-2xl border border-dashed border-[#D3DEEA] bg-[#F8FBFF] p-5 text-sm text-[#5F7388]">
              <p>Nenhum relatório gerado ainda.</p>
              <Link href="/dashboard/alunos" className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0E9D90] underline">
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
