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
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primaryLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard", iconColor: "text-rose-500", iconBg: "bg-rose-50", activeColor: "text-rose-600" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Planejamentos", iconColor: "text-violet-500", iconBg: "bg-violet-50", activeColor: "text-violet-600" },
  { href: "/dashboard/projetos", icon: FolderKanban, label: "Biblioteca", iconColor: "text-blue-500", iconBg: "bg-blue-50", activeColor: "text-blue-600" },
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliações", iconColor: "text-emerald-500", iconBg: "bg-emerald-50", activeColor: "text-emerald-600" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos", iconColor: "text-amber-500", iconBg: "bg-amber-50", activeColor: "text-amber-600" },
  { href: "/dashboard/turmas", icon: School, label: "Turmas", iconColor: "text-fuchsia-500", iconBg: "bg-fuchsia-50", activeColor: "text-fuchsia-600" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada", iconColor: "text-sky-500", iconBg: "bg-sky-50", activeColor: "text-sky-600" },
];

const secondaryLinks = [
  { href: "/dashboard/observacoes", icon: NotebookPen, label: "Observações", iconColor: "text-indigo-500", iconBg: "bg-indigo-50", activeColor: "text-indigo-600" },
  { href: "/dashboard/relatorios", icon: FileBarChart, label: "Relatórios", iconColor: "text-rose-500", iconBg: "bg-rose-50", activeColor: "text-rose-600" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações", iconColor: "text-gray-500", iconBg: "bg-gray-100", activeColor: "text-gray-700" },
];

const mobileLinks = [
  { href: "/dashboard", icon: Home, label: "Início", iconColor: "text-rose-500" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Plano", iconColor: "text-violet-500" },
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliações", iconColor: "text-emerald-500" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos", iconColor: "text-amber-500" },
  { href: "/dashboard/turmas", icon: School, label: "Turmas", iconColor: "text-fuchsia-500" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada", iconColor: "text-sky-500" },
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
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date()),
    []
  );
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}`));

  const renderLinkGroup = (
    items: Array<{ href: string; icon: LucideIcon; label: string; iconColor: string; iconBg: string; activeColor: string }>
  ) =>
    items.map((item) => {
      const active = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
            active
              ? "bg-[#F3F0FF] text-[#6C5CE7]"
              : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-800"
          )}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#6C5CE7]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <div
            className={cn(
              "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              active ? item.iconBg : "bg-transparent group-hover:bg-gray-100"
            )}
          >
            <item.icon className={cn("size-3.5 transition-all", active ? item.iconColor : "text-gray-400 group-hover:text-gray-600")} />
          </div>
          <span className="relative z-10 flex-1">{item.label}</span>
          {active && (
            <ChevronRight className="relative z-10 size-3 text-violet-400 opacity-60" />
          )}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-[#F8F7FF] text-gray-900" style={{ background: "linear-gradient(135deg, #F8F7FF 0%, #FAFBFE 60%, #F0FDF9 100%)" }}>
      <div className="flex min-h-screen">
        {/* ─── Sidebar ─── */}
        <aside className="hidden h-screen w-[265px] flex-col border-r border-gray-200/80 bg-white/90 backdrop-blur-xl md:flex lg:w-[280px]" style={{ boxShadow: "2px 0 20px -4px rgba(108,92,231,0.06)" }}>
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
            <div className="relative">
              <div
                className="inline-flex size-9 items-center justify-center rounded-xl shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)]"
                style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #a78bfa 100%)" }}
              >
                <Sparkles className="size-4 text-white" />
              </div>
              <div
                className="absolute -inset-1 rounded-2xl opacity-20 blur-lg"
                style={{ background: "linear-gradient(135deg, #6C5CE7, #a78bfa)" }}
              />
            </div>
            <div>
              <p className="font-heading text-xl font-bold tracking-tight text-gray-900">Planejei</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">para professoras</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5 scrollbar-hide">
            <div>
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-gray-300">
                Principal
              </p>
              <div className="space-y-0.5">{renderLinkGroup(primaryLinks)}</div>
            </div>

            <div>
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-gray-300">
                Gestão
              </p>
              <div className="space-y-0.5">{renderLinkGroup(secondaryLinks)}</div>
            </div>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-100 p-4 space-y-2">
            {/* User card */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 transition-all hover:bg-gray-100/60">
              <div className="relative">
                <div
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #a78bfa 100%)" }}
                >
                  {initials}
                </div>
                <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{userName}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      isPro
                        ? "bg-violet-50 text-violet-600 ring-1 ring-violet-200"
                        : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                    )}
                  >
                    <Crown className="size-2.5" />
                    {isPro ? "Plano PRO" : "Gratuito"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogoutAll}
              className="w-full justify-start rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 text-sm"
            >
              <LogOut className="mr-2 size-4" />
              Sair da conta
            </Button>
          </div>
        </aside>

        {/* ─── Main area ─── */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-gray-200/60 bg-white/80 px-4 py-4 backdrop-blur-xl md:px-8" style={{ boxShadow: "0 1px 0 rgba(108,92,231,0.06), 0 4px 16px -8px rgba(0,0,0,0.06)" }}>
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl tracking-tight text-gray-900 md:text-3xl">
                  {pageMeta.title}
                </h1>
                <p className="mt-0.5 text-xs font-medium text-gray-400 md:text-sm">
                  {pageMeta.subtitle}
                  <span className="mx-1.5 hidden text-gray-200 md:inline-block">•</span>
                  <span className="hidden md:inline-block capitalize">{dateLabel}</span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 shadow-sm">
                  <Bell className="size-4" />
                </button>

                <Link
                  href="/dashboard/observacoes"
                  prefetch
                  className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-sm font-bold text-white shadow-[0_4px_16px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(108,92,231,0.6)]"
                  style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
                >
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Plus className="relative size-4" />
                  <span className="relative hidden sm:inline">Nova observação</span>
                  <span className="relative sm:hidden">Nova</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Page content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-24 md:p-6 md:pb-8"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </section>
      </div>

      {/* Mobile FAB */}
      <Link
        href="/dashboard/observacoes"
        className="fixed bottom-20 right-4 z-40 inline-flex size-14 items-center justify-center rounded-full text-white shadow-[0_8px_28px_-8px_rgba(108,92,231,0.7)] transition-all hover:scale-105 active:scale-95 md:hidden"
        style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}
        aria-label="Nova observação"
      >
        <Plus className="size-6" />
      </Link>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/80 bg-white/95 px-2 py-2 backdrop-blur-xl md:hidden" style={{ boxShadow: "0 -4px 20px -4px rgba(0,0,0,0.08)" }}>
        <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
          {mobileLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-all",
                  active ? "bg-violet-50 text-violet-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <item.icon className={cn("size-4.5 transition-all", active ? "text-violet-600" : "")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
