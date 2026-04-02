import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  FileText,
  Play,
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
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="relative p-6 md:p-8">
          <div className="pointer-events-none absolute -top-10 right-[-120px] h-52 w-52 rounded-full bg-rose-200/55 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-[-110px] h-48 w-48 rounded-full bg-purple-200/55 blur-3xl" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="mb-1 text-sm font-semibold text-purple-600">Tudo pronto para o dia?</p>
              <h3 className="font-heading text-3xl text-slate-900">Pronta para inspirar sua turma?</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Voce esta em sequencia de <strong>{summary.streak}</strong> semanas com planejamento ativo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/chamada" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F43F5E] px-4 text-sm font-bold text-white transition hover:bg-[#E11D48]">
                <ClipboardCheck className="size-4" />
                Fazer chamada
              </Link>
              <Link href="/dashboard/avaliacoes" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <FileCheck className="size-4 text-emerald-600" />
                Avaliar alunos
              </Link>
              <Link href="/dashboard/observacoes" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <FileText className="size-4 text-purple-500" />
                Nova observacao
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Alunos ativos</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-black text-slate-900">{summary.totalAlunos}</p>
              <Users className="size-5 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Observacoes (sem.)</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-black text-slate-900">{summary.observacoesSemana}</p>
              <FileText className="size-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Planejamentos (sem.)</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-black text-slate-900">{summary.planejamentosSemana}</p>
              <CalendarClock className="size-5 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Avaliacoes IA (mes)</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-black text-slate-900">{summary.relatoriosMes}</p>
              <FileCheck className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Continue planejando</h4>
          <Link href="/dashboard/projetos" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-600">
            Ver biblioteca
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {summary.projetosSalvos.slice(0, 8).map((projeto) => (
            <Link
              key={projeto.id}
              href={`/dashboard/projetos/${projeto.id}`}
              className="min-w-[250px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-rose-600">{projeto.categoria}</span>
                <Play className="size-4 text-slate-400" />
              </div>
              <p className="line-clamp-2 font-bold text-slate-900">{projeto.titulo}</p>
              <p className="mt-1 text-xs text-slate-500">{projeto.faixaEtaria}</p>
            </Link>
          ))}

          {!summary.projetosSalvos.length && (
            <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Nenhum projeto salvo ainda.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-slate-900">Observacoes recentes</CardTitle>
            <CardDescription>Ultimos registros por aluno</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.observacoesRecentes.slice(0, 6).map((observacao) => (
              <Link
                key={observacao.id}
                href={`/dashboard/alunos/${observacao.aluno.id}`}
                className="block rounded-xl border border-slate-200 bg-slate-50/50 p-3 hover:border-rose-200 hover:bg-rose-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{observacao.aluno.nome}</p>
                    <p className="text-xs text-slate-500">{observacao.aluno.turma.nome} - {formatDate(observacao.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-purple-600">
                    {observacao.categoria.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-700">{observacao.texto}</p>
              </Link>
            ))}

            {!summary.observacoesRecentes.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Nenhuma observacao registrada recentemente.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-slate-900">Alerta de acompanhamento</CardTitle>
            <CardDescription>Sem observacao ha 14 dias ou mais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.alunosSemObservacao.slice(0, 6).map((aluno) => (
              <Link
                key={aluno.id}
                href={`/dashboard/alunos/${aluno.id}`}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-2.5"
              >
                <span className="text-sm font-semibold text-slate-800">{aluno.nome}</span>
                <TriangleAlert className="size-4 text-amber-600" />
              </Link>
            ))}

            {!summary.alunosSemObservacao.length && <p className="text-sm text-slate-600">Sem alertas no momento.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
