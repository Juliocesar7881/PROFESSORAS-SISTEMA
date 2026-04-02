import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  FileBarChart,
  Sparkles,
  TriangleAlert,
  UserRound,
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
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardHeader className="space-y-3">
            <CardDescription className="text-[#70849A]">Visao geral da turma</CardDescription>
            <CardTitle className="font-heading text-3xl text-[#10253B]">Acompanhe evolucao e mantenha os registros em dia</CardTitle>
            <p className="max-w-2xl text-sm text-[#4D647B]">
              Centralize observacoes, planejamentos e relatorios no mesmo fluxo para acelerar a documentacao pedagogica da semana.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/dashboard/observacoes"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[#10B7AA] px-3 text-sm font-semibold text-white transition hover:bg-[#0F9D91]"
              >
                Nova observacao
              </Link>
              <Link
                href="/dashboard/relatorios"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[#CEDCE9] bg-[#F5FAFF] px-3 text-sm font-semibold text-[#1E3A53] transition hover:border-[#B6CBDD]"
              >
                Gerar relatorio
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardHeader>
            <CardDescription className="text-[#70849A]">Consistencia de rotina</CardDescription>
            <CardTitle className="font-heading text-5xl text-[#10253B]">{summary.streak}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-[#60788F]">
            <p>semanas consecutivas com planejamento registrado</p>
            <Sparkles className="size-5 text-[#0FA398]" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A8EA3]">Alunos ativos</p>
              <p className="mt-1 text-3xl font-black text-[#10253B]">{summary.totalAlunos}</p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#E7F6FF] text-[#2E7AA8]">
              <UserRound className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A8EA3]">Observacoes semana</p>
              <p className="mt-1 text-3xl font-black text-[#10253B]">{summary.observacoesSemana}</p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#E6F9F7] text-[#119D93]">
              <BookOpenCheck className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A8EA3]">Planejamentos semana</p>
              <p className="mt-1 text-3xl font-black text-[#10253B]">{summary.planejamentosSemana}</p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#4A67B8]">
              <CalendarClock className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A8EA3]">Relatorios no mes</p>
              <p className="mt-1 text-3xl font-black text-[#10253B]">{summary.relatoriosMes}</p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#FFF2E9] text-[#B86A35]">
              <FileBarChart className="size-5" />
            </span>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-[#DBE5EF] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-2xl text-[#10253B]">Observacoes recentes</CardTitle>
            <CardDescription className="text-[#70849A]">Ultimos registros em sala</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.observacoesRecentes.slice(0, 6).map((observacao) => (
              <Link
                key={observacao.id}
                href={`/dashboard/alunos/${observacao.aluno.id}`}
                className="block rounded-xl border border-[#E4EDF6] bg-[#FAFCFF] p-3 transition hover:border-[#C8D8EA]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#10253B]">{observacao.aluno.nome}</p>
                    <p className="text-xs font-semibold text-[#6F859A]">{observacao.aluno.turma.nome} • {formatDate(observacao.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-[#EAF6F5] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#0E9489]">
                    {observacao.categoria.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-[#3E576E]">{observacao.texto}</p>
              </Link>
            ))}

            {!summary.observacoesRecentes.length && (
              <div className="rounded-xl border border-dashed border-[#C8D8EA] bg-[#F7FBFF] p-4 text-sm text-[#60788F]">
                Nenhuma observacao registrada recentemente.
              </div>
            )}

            <Link
              href="/dashboard/observacoes"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#0F9D91]"
            >
              Ver todas as observacoes
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-[#DBE5EF] bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-2xl text-[#10253B]">Acompanhamento</CardTitle>
              <CardDescription className="text-[#70849A]">Alunos sem observacao ha 14+ dias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#4D647B]">
              {summary.alunosSemObservacao.slice(0, 5).map((aluno) => (
                <Link
                  key={aluno.id}
                  href={`/dashboard/alunos/${aluno.id}`}
                  className="flex items-center justify-between rounded-xl border border-[#F3DFB6] bg-[#FFF8E9] p-2.5"
                >
                  <span className="font-semibold">{aluno.nome}</span>
                  <TriangleAlert className="size-4 text-[#D28A13]" />
                </Link>
              ))}

              {!summary.alunosSemObservacao.length && <p>Sem alertas no momento.</p>}
            </CardContent>
          </Card>

          <Card className="border-[#DBE5EF] bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-2xl text-[#10253B]">Projetos salvos</CardTitle>
              <CardDescription className="text-[#70849A]">Material pronto para uso rapido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.projetosSalvos.slice(0, 4).map((projeto) => (
                <Link
                  key={projeto.id}
                  href={`/dashboard/projetos/${projeto.id}`}
                  className="block rounded-xl border border-[#E4EDF6] bg-[#FAFCFF] p-3"
                >
                  <p className="font-semibold text-[#10253B]">{projeto.titulo}</p>
                  <p className="text-xs text-[#73879B]">{projeto.categoria} • {projeto.faixaEtaria}</p>
                </Link>
              ))}

              {!summary.projetosSalvos.length && (
                <div className="rounded-xl border border-dashed border-[#C8D8EA] bg-[#F7FBFF] p-4 text-sm text-[#60788F]">
                  Nenhum projeto salvo ainda.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-[#DBE5EF] bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 text-[#3F5870]">
            <ClipboardCheck className="size-4 text-[#10A89C]" />
            <p className="text-sm">Atualize a chamada no inicio da aula para manter os indicadores da semana corretos.</p>
          </div>
          <Link href="/dashboard/chamada" className="text-sm font-bold text-[#0F9D91]">
            Abrir chamada
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
