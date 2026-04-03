import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  FileText,
  Flame,
  FolderKanban,
  Play,
  Sparkles,
  TriangleAlert,
  TrendingUp,
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

  const firstName = session.user.name?.split(" ")[0] ?? "Professora";

  return (
    <div className="mx-auto max-w-6xl space-y-7">

      {/* ─── Hero Welcome Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200/60 p-8 md:p-10" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 40%, #7C3AED 100%)" }}>
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-16 right-[-5%] h-[280px] w-[280px] rounded-full opacity-30 blur-[60px]" style={{ background: "rgba(167, 139, 250, 0.5)" }} />
        <div className="pointer-events-none absolute -bottom-16 left-[10%] h-[200px] w-[200px] rounded-full opacity-20 blur-[60px]" style={{ background: "rgba(0, 184, 148, 0.6)" }} />

        {/* Dot grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Top shimmer accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              Bom trabalho hoje!
            </div>
            <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
              Olá, {firstName}! 👋
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/80 md:text-base">
              {summary.streak > 0 ? (
                <>
                  Você está em uma sequência incrível de{" "}
                  <strong className="text-white">{summary.streak} semana{summary.streak > 1 ? "s" : ""}</strong>. Continue assim — seus alunos percebem a diferença!
                </>
              ) : (
                "O Planejei já organizou tudo para você focar no que importa: a conexão com os alunos."
              )}
            </p>
            {summary.streak > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-400/20 px-4 py-2 text-xs font-bold text-amber-100 backdrop-blur-sm">
                <Flame className="size-4 animate-pulse text-amber-300" />
                Sequência ativa: {summary.streak} semana{summary.streak > 1 ? "s" : ""} seguida{summary.streak > 1 ? "s" : ""}!
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Link
              href="/dashboard/observacoes"
              className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/30 bg-white px-6 text-sm font-bold text-violet-700 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.25)]"
            >
              <FileText className="size-4" />
              Nova observação
            </Link>
            <Link
              href="/dashboard/chamada"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <ClipboardCheck className="size-4 text-sky-200" />
              Chamada
            </Link>
            <Link
              href="/dashboard/avaliacoes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <FileCheck className="size-4 text-emerald-200" />
              Avaliar
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Alunos",
            value: summary.totalAlunos,
            desc: "cadastrados no sistema",
            icon: Users,
            iconColor: "text-rose-500",
            iconBg: "bg-rose-50",
            accentColor: "from-rose-400 to-rose-500",
            border: "border-rose-100",
            trend: "+2 esta semana",
          },
          {
            label: "Observações",
            value: summary.observacoesSemana,
            desc: "registradas esta semana",
            icon: FileText,
            iconColor: "text-violet-500",
            iconBg: "bg-violet-50",
            accentColor: "from-violet-400 to-violet-500",
            border: "border-violet-100",
            trend: "na semana atual",
          },
          {
            label: "Planejamentos",
            value: summary.planejamentosSemana,
            desc: "criados esta semana",
            icon: CalendarClock,
            iconColor: "text-sky-500",
            iconBg: "bg-sky-50",
            accentColor: "from-sky-400 to-sky-500",
            border: "border-sky-100",
            trend: "na semana atual",
          },
          {
            label: "Avaliações IA",
            value: summary.relatoriosMes,
            desc: "geradas este mês",
            icon: FileCheck,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-50",
            accentColor: "from-emerald-400 to-emerald-500",
            border: "border-emerald-100",
            trend: "no mês atual",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] ${stat.border}`}
          >
            <CardContent className="relative p-5">
              {/* Gradient accent top bar */}
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.accentColor} opacity-60 transition-opacity group-hover:opacity-100`} />

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-black tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-400">{stat.desc}</p>
                </div>
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} transition-transform group-hover:scale-110`}>
                  <stat.icon className={`size-5 ${stat.iconColor}`} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                <TrendingUp className="size-3 text-gray-300" />
                <span className="text-[10px] font-semibold text-gray-400">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ─── Projects ─── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-heading text-xl text-gray-900">Continue planejando</h4>
            <p className="mt-0.5 text-xs text-gray-400">Projetos pedagógicos salvos por você</p>
          </div>
          <Link
            href="/dashboard/projetos"
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 transition-all hover:bg-violet-100"
          >
            Explorar biblioteca
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {summary.projetosSalvos.slice(0, 8).map((projeto) => (
            <Link
              key={projeto.id}
              href={`/dashboard/projetos/${projeto.id}`}
              className="group min-w-[260px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_12px_32px_-8px_rgba(108,92,231,0.15)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="cat-linguagem rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                  {projeto.categoria}
                </span>
                <div className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400 transition-all group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-600">
                  <Play className="ml-0.5 size-3.5" />
                </div>
              </div>
              <p className="line-clamp-2 font-bold leading-snug text-gray-800 transition-colors group-hover:text-gray-900">
                {projeto.titulo}
              </p>
              <p className="mt-2 text-xs font-semibold text-gray-400">{projeto.faixaEtaria}</p>
            </Link>
          ))}

          {!summary.projetosSalvos.length && (
            <div className="flex w-full min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-50">
                <FolderKanban className="size-6 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Nenhum projeto salvo ainda</p>
              <p className="mt-1 text-xs text-gray-400">Explore a biblioteca e salve seus favoritos</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Bottom grid ─── */}
      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Últimas observações */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl text-gray-900">Últimos registros</CardTitle>
                <CardDescription className="mt-0.5 text-gray-400">Acompanhamento diário da turma</CardDescription>
              </div>
              <Link href="/dashboard/observacoes" className="text-xs font-bold text-violet-600 transition-colors hover:text-violet-700">
                Ver todos →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.observacoesRecentes.slice(0, 6).map((observacao) => (
              <Link
                key={observacao.id}
                href={`/dashboard/alunos/${observacao.aluno.id}`}
                className="group block rounded-xl border border-transparent bg-gray-50/80 p-4 transition-all hover:border-violet-100 hover:bg-violet-50/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-600">
                      {observacao.aluno.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 transition-colors group-hover:text-violet-700">
                        {observacao.aluno.nome}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                        {observacao.aluno.turma.nome}
                        <span className="mx-1.5 text-gray-200">•</span>
                        {formatDate(observacao.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="obs-aprendizagem shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em]">
                    {observacao.categoria.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-gray-500">
                  {observacao.texto}
                </p>
              </Link>
            ))}

            {!summary.observacoesRecentes.length && (
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 p-5">
                <FileText className="size-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-400">Nenhuma observação registrada recentemente.</p>
                <Link href="/dashboard/observacoes" className="mt-1 text-xs font-bold text-violet-600 hover:text-violet-700">
                  Fazer primeira observação →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atenção */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-xl text-gray-900">🔔 Atenção</CardTitle>
            <CardDescription className="text-gray-400">
              Alunos sem registros há +14 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.alunosSemObservacao.slice(0, 6).map((aluno) => (
              <Link
                key={aluno.id}
                href={`/dashboard/alunos/${aluno.id}`}
                className="group flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 transition-all hover:border-amber-200 hover:bg-amber-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-all group-hover:bg-amber-200">
                    <TriangleAlert className="size-3.5" />
                  </div>
                  <span className="text-sm font-bold text-amber-800">{aluno.nome}</span>
                </div>
                <ArrowRight className="size-4 text-amber-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-amber-500" />
              </Link>
            ))}

            {!summary.alunosSemObservacao.length && (
              <div className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-center text-sm font-semibold text-emerald-700">
                  Acompanhamento em dia!
                </p>
                <p className="text-center text-xs text-emerald-500">Todos os alunos têm registros recentes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

