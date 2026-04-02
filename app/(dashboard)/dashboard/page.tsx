import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  FileText,
  Flame,
  Play,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { DashboardService } from "@/services/dashboard.service";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

const formatDate = (value: Date | string) => new Date(value).toLocaleDateString("pt-BR");

export default async function DashboardHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const summary = hasReachableDatabase
    ? await new DashboardService().summary(session.user.id, session.user.plano)
    : {
        totalAlunos: 0,
        observacoesSemana: 0,
        planejamentosSemana: 0,
        relatoriosMes: 0,
        streak: 0,
        planejamentos: [],
        observacoesRecentes: [],
        alunosSemObservacao: [],
        projetosSalvos: [],
      };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-8 md:p-10 shadow-sm glass-card">
        <div className="pointer-events-none absolute -top-24 right-[-10%] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-rose-200/60 to-purple-300/40 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-[250px] w-[250px] rounded-full bg-gradient-to-tr from-cyan-200/50 to-emerald-200/40 blur-[60px]" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-200/60 bg-purple-50/50 px-2.5 py-1 text-xs font-bold text-purple-700 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              Tudo pronto para o dia?
            </div>
            <h2 className="font-heading text-3xl tracking-tight text-slate-900 md:text-4xl">Pronta para inspirar sua turma?</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 md:text-base">
              Você está em uma sequência brilhante de <strong>{summary.streak}</strong> semanas. O Planejei já organizou tudo para você focar no que importa: a conexão com os alunos.
            </p>
            {summary.streak > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200/50">
                <Flame className="size-4 animate-pulse text-amber-500" />
                Sequência ativa: {summary.streak} semana(s) na frente
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Link
              href="/dashboard/observacoes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 px-6 text-sm font-bold text-white shadow-[0_10px_20px_-10px_rgba(244,63,94,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_25px_-10px_rgba(244,63,94,0.8)]"
            >
              <FileText className="size-4.5" />
              Nova observação
            </Link>
            <Link
              href="/dashboard/chamada"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white/80 px-6 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <ClipboardCheck className="size-4.5 text-rose-500" />
              Chamada
            </Link>
            <Link
              href="/dashboard/avaliacoes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white/80 px-6 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <FileCheck className="size-4.5 text-emerald-600" />
              Avaliar
            </Link>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Turmas Ativas</p>
              <div className="flex size-8 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100">
                <Users className="size-4 text-rose-500" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.totalAlunos}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Obs. na Semana</p>
              <div className="flex size-8 items-center justify-center rounded-full bg-purple-50 ring-1 ring-purple-100">
                <FileText className="size-4 text-purple-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.observacoesSemana}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Planos na Semana</p>
              <div className="flex size-8 items-center justify-center rounded-full bg-cyan-50 ring-1 ring-cyan-100">
                <CalendarClock className="size-4 text-cyan-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.planejamentosSemana}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Avaliações IA</p>
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <FileCheck className="size-4 text-emerald-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{summary.relatoriosMes}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-heading text-xl text-slate-900">Continue planejando</h4>
          <Link href="/dashboard/projetos" className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-500 transition-colors hover:text-rose-600">
            Explorar biblioteca
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {summary.projetosSalvos.slice(0, 8).map((projeto) => (
            <Link
              key={projeto.id}
              href={`/dashboard/projetos/${projeto.id}`}
              className="group min-w-[260px] rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-rose-600 ring-1 ring-rose-200/50">{projeto.categoria}</span>
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-rose-500 group-hover:text-white">
                  <Play className="ml-0.5 size-4" />
                </div>
              </div>
              <p className="line-clamp-2 font-bold leading-snug text-slate-900 group-hover:text-rose-600 transition-colors">{projeto.titulo}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{projeto.faixaEtaria}</p>
            </Link>
          ))}

          {!summary.projetosSalvos.length && (
            <div className="flex w-full min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-sm font-medium text-slate-500 text-center">
              Você ainda não salvou projetos.<br />Clique em Explorar biblioteca e salve seus favoritos.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-2xl text-slate-900">Últimos registros</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Acompanhamento diário da turma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.observacoesRecentes.slice(0, 6).map((observacao) => (
              <Link
                key={observacao.id}
                href={`/dashboard/alunos/${observacao.aluno.id}`}
                className="group block rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-rose-200/60 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{observacao.aluno.nome}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{observacao.aluno.turma.nome} <span className="mx-1 text-slate-300">•</span> {formatDate(observacao.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-purple-700 ring-1 ring-purple-200/50">
                    {observacao.categoria.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{observacao.texto}</p>
              </Link>
            ))}

            {!summary.observacoesRecentes.length && (
              <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-sm font-medium text-slate-500">
                Nenhuma observação registrada recentemente.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-2xl text-slate-900">Atenção</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Alunos sem registros recentes (+14 dias)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.alunosSemObservacao.slice(0, 6).map((aluno) => (
              <Link
                key={aluno.id}
                href={`/dashboard/alunos/${aluno.id}`}
                className="group flex items-center justify-between rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50/30 p-3.5 transition-all hover:bg-amber-100/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 group-hover:bg-amber-200 group-hover:text-amber-700 transition-colors">
                    <TriangleAlert className="size-4" />
                  </div>
                  <span className="text-sm font-bold text-amber-950">{aluno.nome}</span>
                </div>
              </Link>
            ))}

            {!summary.alunosSemObservacao.length && <p className="text-sm font-medium text-slate-500">Acompanhamento da turma está em dia. Parabéns!</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
