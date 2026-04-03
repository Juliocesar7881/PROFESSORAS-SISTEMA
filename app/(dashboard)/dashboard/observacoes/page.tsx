import Link from "next/link";
import { Clock3, NotebookPen, UserRound } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
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
  return `${Math.floor(diffHour / 24)} d atrás`;
}

function getObsBadge(cat: string) {
  const n = cat.toLowerCase();
  if (n.includes("aprendizagem")) return "obs-aprendizagem";
  if (n.includes("linguagem")) return "obs-linguagem";
  if (n.includes("social")) return "obs-social";
  if (n.includes("motor")) return "obs-motor";
  if (n.includes("criatividade")) return "obs-criatividade";
  return "border border-gray-200 bg-gray-50 text-gray-500";
}

export default async function ObservacoesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const observacoes = hasReachableDatabase ? await new ObservacaoService().listRecent(session.user.id, 40) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-amber-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(253, 230, 138, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 shadow-sm backdrop-blur-md">
              <NotebookPen className="size-3" />
              Feed de Observações
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Últimos registros</h2>
            <p className="mt-1 text-sm text-white/80">
              Acompanhe o histórico recente de toda a escola ou turma.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {observacoes.length} observações
            </span>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="space-y-3 pt-5">
          {observacoes.map((observacao) => (
            <article key={observacao.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/dashboard/alunos/${observacao.aluno.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-800 transition-colors hover:text-[#6C5CE7]">
                  <UserRound className="size-4 text-[#6C5CE7]" />
                  {observacao.aluno.nome}
                  <span className="font-medium text-gray-400">— {observacao.aluno.turma.nome}</span>
                </Link>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock3 className="size-3.5" />
                  {formatRelativeDate(new Date(observacao.createdAt))}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-500">{observacao.texto}</p>
              <div className="mt-2.5">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getObsBadge(observacao.categoria)}`}>{observacao.categoria}</span>
              </div>
            </article>
          ))}

          {!observacoes.length && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-400">Ainda não há observações registradas.</p>
              <Link href="/dashboard/alunos" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 transition-colors">
                <NotebookPen className="size-4" />
                Registrar primeira observação
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
