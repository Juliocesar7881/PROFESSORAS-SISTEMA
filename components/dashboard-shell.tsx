"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileCheck,
  FileBarChart,
  FolderKanban,
  Home,
  LogOut,
  NotebookPen,
  Plus,
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
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliacoes" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada" },
];

const secondaryLinks = [
  { href: "/dashboard/observacoes", icon: NotebookPen, label: "Observacoes" },
  { href: "/dashboard/relatorios", icon: FileBarChart, label: "Relatorios" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configuracoes" },
];

const mobileLinks = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Plano" },
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliacoes" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada" },
];

interface DashboardShellProps {
  userName: string;
  userPlano: string;
  children: React.ReactNode;
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/dashboard/planejamento")) {
    return { title: "Planejamento Semanal", subtitle: "Organize atividades por dia e horario" };
  }
  if (pathname.startsWith("/dashboard/projetos")) {
    return { title: "Biblioteca de Projetos", subtitle: "Projetos prontos para usar na turma" };
  }
  if (pathname.startsWith("/dashboard/avaliacoes")) {
    return { title: "Avaliacoes dos Alunos", subtitle: "Registros simples com apoio de IA para relatorios" };
  }
  if (pathname.startsWith("/dashboard/alunos")) {
    return { title: "Minha Turma", subtitle: "Observacoes, historico e acompanhamento" };
  }
  if (pathname.startsWith("/dashboard/chamada")) {
    return { title: "Chamada Digital", subtitle: "Presencas da turma em tempo real" };
  }
  if (pathname.startsWith("/dashboard/observacoes")) {
    return { title: "Observacoes", subtitle: "Registros pedagogicos recentes" };
  }
  if (pathname.startsWith("/dashboard/relatorios")) {
    return { title: "Relatorios", subtitle: "Textos de acompanhamento por aluno" };
  }
  if (pathname.startsWith("/dashboard/configuracoes")) {
    return { title: "Configuracoes", subtitle: "Conta, plano e seguranca" };
  }

  return { title: "Visao Geral", subtitle: "Acompanhe os indicadores da semana" };
}

export function DashboardShell({ userName, userPlano, children }: DashboardShellProps) {
  const pathname = usePathname();
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date()), []);
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);

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
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
          isActive(item.href)
            ? "bg-[#FFE8EE] text-[#E11D48]"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        <item.icon className={cn("size-4", isActive(item.href) ? "text-[#E11D48]" : "text-slate-400")} />
        {item.label}
      </Link>
    ));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5">
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F43F5E] to-[#9333EA] text-white shadow-[0_8px_24px_-12px_rgba(244,63,94,0.55)]">
              <Sparkles className="size-4" />
            </div>
            <p className="font-heading text-2xl text-slate-900">Planejei</p>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto p-4">
            <div>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Principal</p>
              <div className="space-y-1">{renderLinkGroup(primaryLinks)}</div>
            </div>

            <div>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Gestao</p>
              <div className="space-y-1">{renderLinkGroup(secondaryLinks)}</div>
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#9333EA] text-xs font-black text-white">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{userName}</p>
                <p className="text-xs font-semibold text-purple-600">{String(userPlano).toUpperCase()}</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogoutAll}
              className="w-full justify-start rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="mr-2 size-4" />
              Sair da conta
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl text-slate-900">{pageMeta.title}</h1>
                <p className="text-xs font-semibold text-slate-500">{pageMeta.subtitle} - {dateLabel}</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                  <Bell className="size-4" />
                </button>

                <Link
                  href="/dashboard/observacoes"
                  prefetch
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[#F43F5E] px-3 text-sm font-bold text-white shadow-[0_10px_24px_-16px_rgba(244,63,94,0.75)] transition hover:bg-[#E11D48]"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nova observacao</span>
                  <span className="sm:hidden">Nova</span>
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
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
