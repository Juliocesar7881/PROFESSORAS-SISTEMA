"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardPenLine,
  FolderKanban,
  Images,
  LogOut,
  Menu,
  Search,
  Settings,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavigationLink = {
  href: string;
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
};

const navigationLinks: NavigationLink[] = [
  { href: "/dashboard/projetos", icon: FolderKanban, label: "Projetos", mobileLabel: "Projetos" },
  { href: "/dashboard/artes-impressao", icon: Images, label: "Impressao facil", mobileLabel: "Impressao" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Planejamento", mobileLabel: "Plano" },
  { href: "/dashboard/registros", icon: ClipboardPenLine, label: "Registros", mobileLabel: "Registros" },
  { href: "/dashboard/turmas", icon: UsersRound, label: "Turmas e criancas", mobileLabel: "Gestao" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Conta" },
];

const navGroups = [
  { title: "Ferramentas", items: navigationLinks.slice(0, 4) },
  { title: "Gestao", items: navigationLinks.slice(4) },
];

const bottomNavLinks = navigationLinks.slice(0, 5);

interface DashboardShellProps {
  userName: string;
  children: React.ReactNode;
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/dashboard/artes-impressao")) return { title: "Impressao facil", subtitle: "PDFs A4 a partir das suas imagens" };
  if (pathname.startsWith("/dashboard/planejamento")) return { title: "Planejamento", subtitle: "Semana pronta com projeto base ou escrita manual" };
  if (pathname.startsWith("/dashboard/registros")) return { title: "Registros", subtitle: "Evidencias pedagogicas e avaliacoes" };
  if (pathname.startsWith("/dashboard/turmas")) return { title: "Turmas e criancas", subtitle: "Organizacao minima para seus registros" };
  if (pathname.startsWith("/dashboard/configuracoes")) return { title: "Conta", subtitle: "Acesso gratuito, seguranca e preferencias" };
  return { title: "Projetos", subtitle: "Biblioteca pedagogica pronta para adaptar" };
}

export function DashboardShell({
  userName,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date()),
    [],
  );
  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (!parts.length) return "P";
    return parts.length === 1 ? parts[0].slice(0, 1).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userName]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`) || (href === "/dashboard/projetos" && pathname === "/dashboard");
  }

  const handleLogoutAll = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/account/logout-all", { method: "POST" });
    } finally {
      await signOut({ callbackUrl: "/login" });
      setLoggingOut(false);
    }
  };

  const renderNavLink = (item: NavigationLink) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-[background-color,color,transform] duration-200",
          active ? "bg-white/[0.2] text-white shadow-[inset_3px_0_0_#d7cbff]" : "text-white/78 hover:bg-white/[0.1] hover:text-white",
        )}
      >
        <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-white/[0.16]" : "bg-white/[0.08]")}>
          <item.icon className="size-4 text-white" />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#17213f]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#493696_0%,#5a46ae_48%,#6e59c8_100%)] md:flex">
        <div className="flex h-[76px] items-center border-b border-white/10 px-4">
          <BrandMark
            href="/dashboard/projetos"
            markClassName="rounded-xl ring-white/15"
            textClassName="[&_strong]:text-white [&_span]:text-white/65"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-hide">
          <div className="space-y-5">
            {navGroups.map((group) => (
              <section key={group.title} className="space-y-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/56">{group.title}</p>
                <div className="space-y-1">{group.items.map((item) => renderNavLink(item))}</div>
              </section>
            ))}
          </div>
        </nav>

        <div className="space-y-3 border-t border-white/10 p-3">
          <div className="rounded-2xl border border-white/16 bg-white/[0.11] p-3 shadow-[0_18px_42px_-30px_rgba(28,20,77,0.6)]">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8976df,#b19ff0)] text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{userName}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-white/68">
                  Acesso gratis
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogoutAll}
            disabled={loggingOut}
            className="w-full justify-start border border-white/14 bg-white/[0.1] text-white/86 hover:bg-white/[0.16] hover:text-white"
          >
            <LogOut className="mr-2 size-4" />
            {loggingOut ? "Saindo..." : "Sair"}
          </Button>
        </div>
      </aside>

      <section className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[264px]">
        <header className="sticky top-0 z-30 h-[76px] border-b border-[#e8e3f0] bg-white/96 px-4 shadow-[0_8px_24px_-24px_rgba(43,35,91,0.36)] backdrop-blur-xl md:px-8">
          <div className="mx-auto flex h-full w-full max-w-[1680px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e8e3f0] bg-white text-[#17213f] transition hover:bg-[#f7f4ff] md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </button>

              <div className="min-w-0">
                <p className="truncate text-xl font-bold leading-none text-[#17213f] md:text-2xl">{pageMeta.title}</p>
                <p className="mt-1.5 truncate text-sm font-medium text-[#6d6c82]">
                  {pageMeta.subtitle}
                  <span className="mx-2 hidden text-[#d8d2e4] md:inline">|</span>
                  <span className="hidden capitalize md:inline">{dateLabel}</span>
                </p>
              </div>
            </div>

            <div className="hidden min-w-[280px] max-w-md flex-1 items-center rounded-xl border border-[#e8e3f0] bg-[#fcfbff] px-3 text-[#77758a] transition focus-within:border-[#9a86e6] lg:flex">
              <Search className="mr-2 size-4" />
              <span className="text-sm">Buscar projeto, registro ou planejamento</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#e8e3f0] bg-white text-[#6757c8] transition hover:bg-[#f4f1ff]"
                aria-label="Notificacoes"
              >
                <Bell className="size-4" />
              </button>
              <div className="hidden items-center gap-2 rounded-xl border border-[#e8e3f0] bg-white px-3 py-2 md:flex">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#f1edff] text-xs font-bold text-[#6757c8]">{initials}</span>
                <div className="min-w-0">
                  <p className="max-w-[160px] truncate text-sm font-bold text-[#17213f]">{userName}</p>
                  <p className="text-[11px] font-medium text-[#6d6c82]">Acesso gratuito</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="relative flex-1">
          <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-7">
            {children}
          </main>
        </div>
      </section>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-[#2f2664]/45 backdrop-blur-sm"
            aria-label="Fechar menu"
          />
          <aside className="absolute inset-y-0 left-0 w-[88%] max-w-[392px] overflow-y-auto bg-[linear-gradient(180deg,#493696_0%,#5a46ae_48%,#6e59c8_100%)] p-4">
            <div className="mb-4 flex items-center justify-between rounded-[0.75rem] border border-white/18 bg-white/[0.12] p-3">
              <BrandMark href="/dashboard/projetos" textClassName="[&_strong]:text-white [&_span]:text-white/65" markClassName="rounded-xl ring-white/15" />
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white" aria-label="Fechar menu">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 pb-4">
              {navGroups.map((group) => (
                <section key={group.title} className="space-y-2">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/56">{group.title}</p>
                  <div className="space-y-1">{group.items.map((item) => renderNavLink(item))}</div>
                </section>
              ))}
            </div>

            <button type="button" onClick={handleLogoutAll} disabled={loggingOut} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/14 bg-white/[0.1] text-sm font-semibold text-white/88 disabled:opacity-60">
              <LogOut className="size-4" />
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#e8e3f0] bg-white/98 px-2 pb-[env(safe-area-inset-bottom,0.5rem)] pt-1.5 shadow-[0_-16px_40px_-32px_rgba(43,35,91,0.34)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {bottomNavLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-semibold transition-all",
                  active ? "border-[#ddd4f7] bg-[#f1edff] text-[#4f3ca6]" : "border-transparent text-[#77758a] active:bg-[#f7f4ff]",
                )}
              >
                <item.icon className={cn("size-[18px]", active ? "text-[#6757c8]" : "text-[#77758a]")} />
                <span className="leading-tight">{item.mobileLabel ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
