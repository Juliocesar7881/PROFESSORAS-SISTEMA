"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  Crown,
  FileCheck,
  FileBarChart,
  FolderKanban,
  Home,
  LogOut,
  NotebookPen,
  Plus,
  School,
  Sparkles,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primaryLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Planejamentos" },
  { href: "/dashboard/projetos", icon: FolderKanban, label: "Biblioteca" },
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliações" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos" },
  { href: "/dashboard/turmas", icon: School, label: "Turmas" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada" },
];

const secondaryLinks = [
  { href: "/dashboard/observacoes", icon: NotebookPen, label: "Observações" },
  { href: "/dashboard/relatorios", icon: FileBarChart, label: "Relatórios" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },
];

const mobileLinks = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Plano" },
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliações" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos" },
  { href: "/dashboard/turmas", icon: School, label: "Turmas" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada" },
];

interface DashboardShellProps {
  userName: string;
  userPlano: string;
  children: React.ReactNode;
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/dashboard/planejamento")) {
    return { title: "Planejamento Semanal", subtitle: "Organize atividades por dia e horário" };
  }
  if (pathname.startsWith("/dashboard/projetos")) {
    return { title: "Biblioteca de Projetos", subtitle: "Projetos prontos para usar na turma" };
  }
  if (pathname.startsWith("/dashboard/avaliacoes")) {
    return { title: "Avaliações dos Alunos", subtitle: "Registros simples com apoio de IA para relatórios" };
  }
  if (pathname.startsWith("/dashboard/alunos")) {
    return { title: "Minha Turma", subtitle: "Observações, histórico e acompanhamento" };
  }
  if (pathname.startsWith("/dashboard/turmas")) {
    return { title: "Gestão de Turmas", subtitle: "Cadastre, ajuste e organize suas turmas" };
  }
  if (pathname.startsWith("/dashboard/chamada")) {
    return { title: "Chamada Digital", subtitle: "Presenças da turma em tempo real" };
  }
  if (pathname.startsWith("/dashboard/observacoes")) {
    return { title: "Observações", subtitle: "Registros pedagógicos recentes" };
  }
  if (pathname.startsWith("/dashboard/relatorios")) {
    return { title: "Relatórios", subtitle: "Textos de acompanhamento por aluno" };
  }
  if (pathname.startsWith("/dashboard/configuracoes")) {
    return { title: "Configurações", subtitle: "Conta, plano e segurança" };
  }

  return { title: "Visão Geral", subtitle: "Acompanhe os indicadores da semana" };
}

export function DashboardShell({ userName, userPlano, children }: DashboardShellProps) {
  const pathname = usePathname();
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date()), []);
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);
  const isPro = String(userPlano).toUpperCase() === "PRO";

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (!parts.length) return "P";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
  }, [userName]);

  const handleLogoutAll = async () => {
    await fetch("/api/account/logout-all", { method: "POST" });
    await signOut({ callbackUrl: "/login" });
  };

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}`));

  const renderLinkGroup = (items: Array<{ href: string; icon: LucideIcon; label: string }>) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200",
          isActive(item.href)
            ? "bg-[#FFE8EE] text-[#E11D48]"
            : "text-slate-500 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        <item.icon className={cn("size-4", isActive(item.href) ? "text-[#E11D48]" : "text-slate-400")} />
        {item.label}
      </Link>
    ));

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 soft-grid">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-[260px] flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl md:flex lg:w-[280px]">
          <div className="flex items-center gap-3 border-b border-slate-200/60 p-6">
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-[0_8px_24px_-12px_rgba(244,63,94,0.65)] ring-1 ring-white/20">
              <Sparkles className="size-4.5" />
            </div>
            <p className="font-heading text-2xl font-bold tracking-tight text-slate-900">Planejei</p>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto p-5">
            <div>
              <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Principal</p>
              <div className="space-y-1.5">{renderLinkGroup(primaryLinks)}</div>
            </div>

            <div>
              <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Gestão</p>
              <div className="space-y-1.5">{renderLinkGroup(secondaryLinks)}</div>
            </div>
          </nav>

          <div className="border-t border-slate-200/60 p-5">
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm transition-all hover:shadow-md">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-xs font-black text-white shadow-inner">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    isPro ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/50",
                  )}>
                    <Crown className="size-3" />
                    {isPro ? "Plano PRO" : "Plano Gratuito"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogoutAll}
              className="w-full justify-start rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="mr-2 size-4" />
              Sair da conta
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl tracking-tight text-slate-900 md:text-3xl">{pageMeta.title}</h1>
                <p className="mt-0.5 text-xs font-medium text-slate-500 md:text-sm">{pageMeta.subtitle} <span className="mx-1.5 hidden text-slate-300 md:inline-block">•</span> <span className="hidden md:inline-block">{dateLabel}</span></p>
              </div>

              <div className="flex items-center gap-3">
                <button className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900">
                  <Bell className="size-4.5" />
                </button>

                <Link
                  href="/dashboard/observacoes"
                  prefetch
                  className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 text-sm font-bold text-white shadow-[0_10px_20px_-10px_rgba(244,63,94,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_25px_-10px_rgba(244,63,94,0.8)]"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  <Plus className="size-4.5" />
                  <span className="hidden sm:inline">Nova observação</span>
                  <span className="sm:hidden">Nova</span>
                </Link>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-24 md:p-6 md:pb-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </section>
      </div>

      <Link
        href="/dashboard/observacoes"
        className="fixed bottom-20 right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#F43F5E] text-white shadow-[0_22px_44px_-22px_rgba(244,63,94,0.85)] transition hover:scale-105 hover:bg-[#E11D48] md:hidden"
        aria-label="Nova observação"
      >
        <Plus className="size-6" />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
          {mobileLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold",
                isActive(item.href) ? "bg-[#FFE8EE] text-[#E11D48]" : "text-slate-500",
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
