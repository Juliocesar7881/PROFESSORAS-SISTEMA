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
    <div className="space-y-4">
      <Card className="glass-card border-[#DCE4EE]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#10253B]">Observações recentes</CardTitle>
          <CardDescription className="text-[#5F7388]">Acompanhe os últimos registros e abra o aluno para continuar a documentação.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs text-[#6A7E92]">
          <span className="rounded-full bg-[#E9F8F6] px-2 py-1 font-semibold text-[#0E9D90]">{observacoes.length} observações carregadas</span>
          <span className="rounded-full bg-[#EEF3FF] px-2 py-1 font-semibold text-[#5570A2]">Atualização automática</span>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCE4EE]">
        <CardContent className="space-y-3 pt-4">
          {observacoes.map((observacao) => (
            <article key={observacao.id} className="rounded-2xl border border-[#E4EAF3] bg-white p-4 transition hover:border-[#CBE4F7] hover:bg-[#FAFCFF]">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/dashboard/alunos/${observacao.aluno.id}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-[#10253B] hover:text-[#0E9D90]">
                  <UserRound className="size-4" />
                  {observacao.aluno.nome}
                  <span className="font-semibold text-[#6A7E92]">- {observacao.aluno.turma.nome}</span>
                </Link>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A8DA1]">
                  <Clock3 className="size-3.5" />
                  {formatRelativeDate(new Date(observacao.createdAt))}
                </span>
              </div>

              <p className="line-clamp-2 text-sm text-[#3D536A]">{observacao.texto}</p>

              <div className="mt-2">
                <span className="rounded-full bg-[#F2F6FF] px-2 py-1 text-[11px] font-semibold text-[#4F6FA2]">{observacao.categoria}</span>
              </div>
            </article>
          ))}

          {!observacoes.length && (
            <div className="rounded-2xl border border-dashed border-[#D3DEEA] bg-[#F8FBFF] p-5 text-sm text-[#5F7388]">
              <p>Ainda não há observações registradas.</p>
              <Link href="/dashboard/alunos" className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0E9D90] underline">
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
