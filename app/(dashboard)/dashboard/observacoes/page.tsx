import Link from "next/link";
import { Clock3, NotebookPen, UserRound } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { ObservacaoService } from "@/services/observacao.service";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

function formatRelativeDate(input: Date) {
  const diffMs = Date.now() - input.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} h atrás`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} d atrás`;
}

export default async function ObservacoesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const observacoes = hasReachableDatabase ? await new ObservacaoService().listRecent(session.user.id, 40) : [];

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Observações recentes</CardTitle>
          <CardDescription className="text-slate-500">Acompanhe os últimos registros e abra o aluno para continuar a documentação.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">{observacoes.length} observações carregadas</span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700 ring-1 ring-cyan-100">Atualização automática</span>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardContent className="space-y-3 pt-4">
          {observacoes.map((observacao) => (
            <article key={observacao.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200/70 hover:shadow-md">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/dashboard/alunos/${observacao.aluno.id}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-900 transition-colors hover:text-rose-600">
                  <UserRound className="size-4" />
                  {observacao.aluno.nome}
                  <span className="font-semibold text-slate-500">- {observacao.aluno.turma.nome}</span>
                </Link>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Clock3 className="size-3.5" />
                  {formatRelativeDate(new Date(observacao.createdAt))}
                </span>
              </div>

              <p className="line-clamp-2 text-sm text-slate-700">{observacao.texto}</p>

              <div className="mt-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{observacao.categoria}</span>
              </div>
            </article>
          ))}

          {!observacoes.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              <p>Ainda não há observações registradas.</p>
              <Link href="/dashboard/alunos" className="mt-2 inline-flex items-center gap-1 font-semibold text-emerald-700 underline">
                <NotebookPen className="size-4" />
                Abrir alunos para registrar observação
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
