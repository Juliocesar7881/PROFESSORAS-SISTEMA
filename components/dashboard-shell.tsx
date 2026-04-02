"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  FolderKanban,
  Home,
  LogOut,
  NotebookPen,
  Plus,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mainLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos" },
  { href: "/dashboard/observacoes", icon: NotebookPen, label: "Observacoes" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Planejamentos" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada" },
];

const reportLinks = [
  { href: "/dashboard/relatorios", icon: FileBarChart, label: "Gerar PDF" },
  { href: "/dashboard/projetos", icon: FolderKanban, label: "Biblioteca" },
];

const accountLinks = [
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configuracoes" },
];

interface DashboardShellProps {
  userName: string;
  userPlano: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, userPlano, children }: DashboardShellProps) {
  const pathname = usePathname();
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

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
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive(item.href)
            ? "bg-[#DDF3F1] text-[#0F9D91]"
            : "text-[#415A73] hover:bg-[#F2F6FB] hover:text-[#10253B]",
        )}
      >
        <item.icon className={cn("size-4", isActive(item.href) ? "text-[#0F9D91]" : "text-[#7F93A7]")} />
        {item.label}
      </Link>
    ));

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#10253B]">
      <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-[#DFE7F0] bg-white md:flex md:flex-col">
          <div className="flex items-center gap-2 border-b border-[#ECF1F6] px-5 py-4">
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-[#10B7AA] text-sm font-black text-white">P</div>
            <p className="font-heading text-xl text-[#129D93]">Planejei.</p>
          </div>

          <nav className="flex-1 space-y-5 p-4">
            <div>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8BA0B5]">Principal</p>
              <div className="space-y-1">{renderLinkGroup(mainLinks)}</div>
            </div>

            <div>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8BA0B5]">Relatorios</p>
              <div className="space-y-1">{renderLinkGroup(reportLinks)}</div>
            </div>

            <div>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8BA0B5]">Conta</p>
              <div className="space-y-1">{renderLinkGroup(accountLinks)}</div>
            </div>
          </nav>

          <div className="border-t border-[#ECF1F6] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="inline-flex size-9 items-center justify-center rounded-full bg-[#1578A6] text-xs font-black text-white">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#10253B]">{userName}</p>
                <p className="text-xs font-semibold text-[#71859A]">{String(userPlano).toLowerCase()} plan</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogoutAll}
              className="w-full justify-start rounded-xl border border-[#E8D6CF] bg-[#FFF7F4] text-[#B85D49] hover:bg-[#FFEDE7]"
            >
              <LogOut className="mr-2 size-4" />
              Sair de todos os dispositivos
            </Button>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#DFE7F0] bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl text-[#10253B]">Dashboard</h1>
                <p className="text-xs font-semibold text-[#7A8DA1]">{dateLabel}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-[#E5ECF4] bg-[#F6F9FC] px-3 py-2 lg:flex">
                  <Search className="size-4 text-[#90A2B5]" />
                  <input
                    type="search"
                    placeholder="Buscar aluno ou observacao..."
                    className="w-52 bg-transparent text-xs font-semibold text-[#415A73] outline-none placeholder:text-[#9AAABA]"
                  />
                </div>

                <button className="inline-flex size-9 items-center justify-center rounded-xl border border-[#E5ECF4] bg-[#F6F9FC] text-[#7B90A5]">
                  <Bell className="size-4" />
                </button>
                <button className="inline-flex size-9 items-center justify-center rounded-xl border border-[#E5ECF4] bg-[#F6F9FC] text-[#7B90A5]">
                  <ClipboardCheck className="size-4" />
                </button>

                <Link
                  href="/dashboard/observacoes"
                  prefetch
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[#10B7AA] px-3 text-sm font-bold text-white shadow-[0_10px_24px_-16px_rgba(16,183,170,0.9)] transition hover:bg-[#0E9D91]"
                >
                  <Plus className="size-4" />
                  Nova observacao
                </Link>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {mainLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
                    isActive(item.href)
                      ? "border-[#BFEAE5] bg-[#E4F8F5] text-[#0F9D91]"
                      : "border-[#E2EAF4] bg-white text-[#587087]",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </section>
      </div>
    </div>
  );
}
