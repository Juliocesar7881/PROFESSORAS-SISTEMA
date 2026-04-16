import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Heart,
  FolderKanban,
  Lightbulb,
  MessageSquareHeart,
  Users,
  WandSparkles,
} from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardService } from "@/services/dashboard.service";

const formatDate = (value: Date | string) => new Date(value).toLocaleDateString("pt-BR");

type DashboardProjectItem = {
  id: string;
  titulo: string;
  categoria: string;
  faixaEtaria: string;
};

type DashboardObservationItem = {
  id: string;
  texto: string;
  createdAt: Date | string;
  aluno: {
    id: string;
    nome: string;
    turma: {
      nome: string;
    };
  };
};

type DashboardSummary = {
  totalAlunos: number;
  observacoesSemana: number;
  planejamentosSemana: number;
  relatoriosMes: number;
  streak: number;
  planejamentos: unknown[];
  observacoesRecentes: DashboardObservationItem[];
  alunosSemObservacao: Array<{ id: string; nome: string }>;
  projetosSalvos: DashboardProjectItem[];
};

export default async function DashboardHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const summary = (await new DashboardService().summary(session.user.id)) as DashboardSummary;

  const firstName = session.user.name?.split(" ")[0] ?? "Professora";

  const quickActions = [
    {
      title: "Observações",
      subtitle: "Registros diários da sua turma",
      href: "/dashboard/observacoes",
      icon: FileText,
      soft: "bg-sky-50",
      iconColor: "text-sky-600",
      borderActive: "border-sky-200/80",
      hoverBorder: "hover:border-sky-300",
      glowColor: "group-hover:shadow-[0_16px_36px_-12px_rgba(56,189,248,0.25)]",
    },
    {
      title: "Planejamento",
      subtitle: "Arraste atividades e clone semanas",
      href: "/dashboard/planejamento",
      icon: CalendarClock,
      soft: "bg-teal-50",
      iconColor: "text-teal-600",
      borderActive: "border-teal-200/80",
      hoverBorder: "hover:border-teal-300",
      glowColor: "group-hover:shadow-[0_16px_36px_-12px_rgba(45,212,191,0.25)]",
    },
    {
      title: "Banco de Ideias",
      subtitle: "Inspirações para faixa etária e tema",
      href: "/dashboard/projetos",
      icon: Lightbulb,
      soft: "bg-amber-50",
      iconColor: "text-amber-600",
      borderActive: "border-amber-200/80",
      hoverBorder: "hover:border-amber-300",
      glowColor: "group-hover:shadow-[0_16px_36px_-12px_rgba(251,191,36,0.25)]",
    },
    {
      title: "Avaliação com IA",
      subtitle: "Relatórios pedagógicos em um clique",
      href: "/dashboard/avaliacoes",
      icon: WandSparkles,
      soft: "bg-rose-50",
      iconColor: "text-rose-600",
      borderActive: "border-rose-200/80",
      hoverBorder: "hover:border-rose-300",
      glowColor: "group-hover:shadow-[0_16px_36px_-12px_rgba(244,63,94,0.25)]",
    },
    {
      title: "Chamada",
      subtitle: "Presente ou falta com botões grandes",
      href: "/dashboard/chamada",
      icon: ClipboardCheck,
      soft: "bg-cyan-50",
      iconColor: "text-cyan-600",
      borderActive: "border-cyan-200/80",
      hoverBorder: "hover:border-cyan-300",
      glowColor: "group-hover:shadow-[0_16px_36px_-12px_rgba(34,211,238,0.25)]",
    },
    {
      title: "Comunidade",
      subtitle: "Trocas rápidas com outras professoras",
      href: "/dashboard/comunidade",
      icon: MessageSquareHeart,
      soft: "bg-fuchsia-50",
      iconColor: "text-fuchsia-600",
      borderActive: "border-fuchsia-200/80",
      hoverBorder: "hover:border-fuchsia-300",
      glowColor: "group-hover:shadow-[0_16px_36px_-12px_rgba(217,70,239,0.25)]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero greeting */}
      <section className="pf-card overflow-hidden rounded-[1.4rem] border border-sky-100/80 bg-white p-6 md:p-9">
        <div className="max-w-2xl">
          <h2 className="font-heading text-[1.6rem] leading-tight text-[#223246] md:text-[2rem]">
            Bom dia, {firstName}. Tudo organizado para você respirar e planejar com leveza.
          </h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#5f7790] md:text-[15px]">
            {summary.streak > 0
              ? `🔥 Sequência ativa: ${summary.streak} semana${summary.streak > 1 ? "s" : ""} consecutivas.`
              : "Comece com um projeto e monte sua semana em poucos cliques."}
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "group relative flex items-center justify-between gap-5 overflow-hidden rounded-[1.4rem] border bg-white p-5 transition-all duration-300 md:p-6",
              item.borderActive,
              item.hoverBorder,
              item.glowColor,
              "hover:-translate-y-1"
            )}
          >
            <div className="absolute -right-6 -top-6 size-28 rounded-full opacity-[0.04] transition-transform duration-500 group-hover:scale-150" style={{ background: "currentColor", color: "inherit" }} />
            <div className="relative z-10 min-w-0 flex-1">
              <span className={cn("mb-3.5 flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110", item.soft)}>
                <item.icon className={cn("size-6", item.iconColor)} />
              </span>
              <p className="font-heading text-lg font-bold leading-tight text-[#1c2939] md:text-xl">{item.title}</p>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-[#647c98] line-clamp-2">{item.subtitle}</p>
            </div>
            <div className={cn("relative z-10 shrink-0 self-end rounded-full p-2.5 transition-colors duration-300", item.soft)}>
              <ArrowRight className={cn("size-4", item.iconColor)} />
            </div>
          </Link>
        ))}
      </section>

      {/* Projects + Summary */}
      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
          <CardHeader className="p-5 pb-3 md:p-6 md:pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl text-[#223246]">Projetos Favoritos</CardTitle>
                <CardDescription className="mt-1 text-[13px] font-semibold text-[#6f88a2]">
                  Seu coração pedagógico salvo para reutilizar no planejamento.
                </CardDescription>
              </div>
              <Link href="/dashboard/projetos" className="pf-chip border-sky-200 bg-sky-50 text-sky-700">
                Ver biblioteca
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2 md:p-6 md:pt-2">
            {summary.projetosSalvos.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {summary.projetosSalvos.slice(0, 6).map((projeto) => (
                  <Link
                    key={projeto.id}
                    href={`/dashboard/projetos/${projeto.id}`}
                    className="pf-card-hover rounded-2xl border border-sky-100 bg-sky-50/50 p-4"
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="pf-chip border-rose-200 bg-rose-50 text-rose-600">
                        <Heart className="size-3.5" />
                        Favorito
                      </span>
                      <span className="pf-chip">{projeto.faixaEtaria}</span>
                    </div>
                    <p className="font-heading text-lg text-[#223246] line-clamp-2">{projeto.titulo}</p>
                    <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#6f88a2]">{projeto.categoria}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="pf-empty flex flex-col items-center py-10">
                <FolderKanban className="size-8 text-sky-400" />
                <p className="mt-3">Nenhum projeto salvo ainda.</p>
                <Link href="/dashboard/projetos" className="mt-3 text-sm font-bold text-sky-600 underline underline-offset-2 hover:text-sky-500">
                  Explorar biblioteca →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
          <CardHeader className="p-5 pb-3 md:p-6 md:pb-3">
            <CardTitle className="font-heading text-xl text-[#223246]">Resumo da Semana</CardTitle>
            <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">
              Painel rápido para decisão diária.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-2 md:p-6 md:pt-2">
            {[
              { label: "Alunos", value: summary.totalAlunos, icon: Users, chipClass: "bg-sky-50 text-sky-700 border-sky-200" },
              { label: "Observações", value: summary.observacoesSemana, icon: FileText, chipClass: "bg-teal-50 text-teal-700 border-teal-200" },
              { label: "Planejamentos", value: summary.planejamentosSemana, icon: CalendarClock, chipClass: "bg-amber-50 text-amber-700 border-amber-200" },
              { label: "Relatórios IA", value: summary.relatoriosMes, icon: WandSparkles, chipClass: "bg-rose-50 text-rose-700 border-rose-200" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={cn("inline-flex size-10 items-center justify-center rounded-xl border", item.chipClass)}>
                    <item.icon className="size-4.5" />
                  </span>
                  <p className="text-sm font-bold text-[#3d5771]">{item.label}</p>
                </div>
                <p className="font-heading text-2xl text-[#223246]">{item.value}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50/60 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-teal-700">Último foco</p>
              <p className="mt-1.5 text-sm font-semibold text-teal-900">
                {summary.alunosSemObservacao.length
                  ? `${summary.alunosSemObservacao.length} aluno(s) sem registro recente.`
                  : "✅ Acompanhamento em dia para toda a turma."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent observations */}
      <section className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-xl text-[#223246]">Registros Recentes</h3>
          <Link href="/dashboard/observacoes" className="pf-chip border-sky-200 bg-sky-50 text-sky-700">
            Ver todos
          </Link>
        </div>

        {summary.observacoesRecentes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {summary.observacoesRecentes.slice(0, 4).map((observacao) => (
              <Link key={observacao.id} href={`/dashboard/alunos/${observacao.aluno.id}`} className="pf-card-hover rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[#3d5771]">{observacao.aluno.nome}</p>
                  <span className="pf-chip bg-white">{formatDate(observacao.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6f88a2]">{observacao.aluno.turma.nome}</p>
                <p className="mt-2.5 text-sm font-semibold leading-relaxed text-[#4f687f] line-clamp-2">{observacao.texto}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pf-empty">
            Nenhum registro recente encontrado. Faça sua primeira observação!
          </div>
        )}
      </section>
    </div>
  );
}
