import Link from "next/link";
import { CalendarClock, ClipboardCheck, Sparkles, TriangleAlert } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { DashboardService } from "@/services/dashboard.service";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

export default async function DashboardHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const summary = hasReachableDatabase
    ? await new DashboardService().summary(session.user.id, session.user.plano)
    : {
        streak: 0,
        planejamentos: [],
        alunosSemObservacao: [],
        projetosSalvos: [],
      };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass-card border-[#DCECF8] lg:col-span-2">
        <CardHeader>
          <CardDescription className="text-[#6A638D]">Painel principal</CardDescription>
          <CardTitle className="font-heading text-3xl text-[#1E1740]">Acompanhe o desenvolvimento da turma</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-[#4E4770]">
            Gere relatorios descritivos a partir das observacoes e mantenha o historico pedagogico atualizado para familias e coordenacao.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/alunos"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0BB8A8] px-3 text-sm font-semibold text-white transition hover:bg-[#0A9F92]"
            >
              Ir para alunos
            </Link>
            <Link
              href="/dashboard/chamada"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[#D8E9F8] bg-white px-3 text-sm font-semibold text-[#1E1740] transition hover:border-[#BFEADF] hover:bg-[#F3FCFA]"
            >
              Fazer chamada
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardDescription className="text-[#6A638D]">Streak semanal</CardDescription>
          <CardTitle className="font-heading text-4xl text-[#1E1740]">{summary.streak}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-[#6A638D]">semanas planejadas consecutivas</p>
          <Sparkles className="size-5 text-[#0BB8A8]" />
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8] lg:col-span-2">
        <CardHeader>
          <CardDescription className="text-[#6A638D]">Semana atual</CardDescription>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Planejamento da semana atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#4E4770]">
          {summary.planejamentos.slice(0, 3).map((planejamento) => (
            <div key={planejamento.id} className="flex items-center justify-between rounded-xl border border-[#E2EEFF] bg-[#F8FBFF] p-3">
              <div>
                <p className="font-semibold text-[#1E1740]">{planejamento.turma.nome}</p>
                <p className="text-[#746E98]">{new Date(planejamento.semanaInicio).toLocaleDateString("pt-BR")} ate {new Date(planejamento.semanaFim).toLocaleDateString("pt-BR")}</p>
              </div>
              <CalendarClock className="size-4 text-[#8A84AD]" />
            </div>
          ))}

          {!summary.planejamentos.length && <p>Nenhum planejamento cadastrado nesta semana.</p>}
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Acompanhamento</CardTitle>
          <CardDescription className="text-[#6A638D]">Alunos sem observacao ha 14+ dias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#4E4770]">
          {summary.alunosSemObservacao.slice(0, 5).map((aluno) => (
            <Link
              key={aluno.id}
              href={`/dashboard/alunos/${aluno.id}`}
              className="flex items-center justify-between rounded-xl border border-[#FFE1A0] bg-[#FFF7E4] p-2.5"
            >
              <span>{aluno.nome}</span>
              <TriangleAlert className="size-4 text-[#E1A11E]" />
            </Link>
          ))}
          {!summary.alunosSemObservacao.length && <p>Sem alertas no momento.</p>}
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8] lg:col-span-3">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Projetos em andamento</CardTitle>
          <CardDescription className="text-[#6A638D]">Atividades ativas para conectar ao planejamento</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          {summary.projetosSalvos.slice(0, 6).map((projeto) => (
            <Link
              key={projeto.id}
              href={`/dashboard/projetos/${projeto.id}`}
              className="rounded-xl border border-[#E2EEFF] bg-white p-3 transition hover:border-[#BDEEE8] hover:bg-[#F2FCFA]"
            >
              <p className="font-semibold text-[#1E1740]">{projeto.titulo}</p>
              <p className="text-xs text-[#746E98]">{projeto.categoria} • {projeto.faixaEtaria}</p>
            </Link>
          ))}

          {!summary.projetosSalvos.length && (
            <div className="rounded-xl border border-dashed border-[#CFE2F5] bg-[#F8FBFF] p-4 text-sm text-[#6A638D]">
              <p>Nenhum projeto salvo ainda.</p>
              <Link href="/dashboard/projetos" className="mt-2 inline-flex items-center font-semibold text-[#0BB8A8] underline">
                Abrir biblioteca de projetos
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8] lg:col-span-3">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 text-[#4E4770]">
            <ClipboardCheck className="size-4 text-[#0BB8A8]" />
            <p className="text-sm">Dica rapida: use a Chamada Digital no inicio da aula para atualizar automaticamente os indicadores do mes.</p>
          </div>
          <Link href="/dashboard/chamada" className="text-sm font-semibold text-[#0BB8A8] underline">
            Abrir chamada
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
