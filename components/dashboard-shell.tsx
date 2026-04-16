"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FolderKanban,
  Home,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareHeart,
  NotebookPen,
  Settings,
  School,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MONTHLY_PRICE_LABEL, YEARLY_PRICE_LABEL } from "@/lib/subscription";
import { Button } from "@/components/ui/button";

type NavigationLink = {
  href: string;
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
};

const primaryLinks: NavigationLink[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard", mobileLabel: "Início" },
  { href: "/dashboard/observacoes", icon: NotebookPen, label: "Observações", mobileLabel: "Observações" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Planejamento", mobileLabel: "Plano" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Chamada", mobileLabel: "Chamada" },
  { href: "/dashboard/avaliacoes", icon: FileCheck, label: "Avaliação IA", mobileLabel: "Avaliar" },
];

const secondaryLinks: NavigationLink[] = [
  { href: "/dashboard/projetos", icon: FolderKanban, label: "Projetos" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Alunos" },
  { href: "/dashboard/turmas", icon: School, label: "Turmas" },
  { href: "/dashboard/comunidade", icon: MessageSquareHeart, label: "Comunidade" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },
];

const mobileNavLinks: NavigationLink[] = [
  primaryLinks[0],
  primaryLinks[1],
  primaryLinks[2],
  primaryLinks[3],
  primaryLinks[4],
];

const iconPalette = [
  "text-sky-600",
  "text-teal-600",
  "text-rose-500",
  "text-indigo-500",
  "text-amber-500",
  "text-cyan-600",
  "text-emerald-600",
  "text-fuchsia-500",
  "text-blue-500",
  "text-orange-500",
];

const iconBackgroundPalette = [
  "bg-sky-100",
  "bg-teal-100",
  "bg-rose-100",
  "bg-indigo-100",
  "bg-amber-100",
  "bg-cyan-100",
  "bg-emerald-100",
  "bg-fuchsia-100",
  "bg-blue-100",
  "bg-orange-100",
];

interface DashboardShellProps {
  userName: string;
  userPlano: string;
  trialExpired: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
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
    return { title: "Avaliação IA", subtitle: "Histórico de relatórios gerados" };
  }
  if (pathname.startsWith("/dashboard/comunidade")) {
    return { title: "Comunidade", subtitle: "Troca entre professoras, sem distrações" };
  }
  if (pathname.startsWith("/dashboard/configuracoes")) {
    return { title: "Configurações", subtitle: "Conta, plano e segurança" };
  }
  return { title: "Visão Geral", subtitle: "Acompanhe os indicadores da semana" };
}

export function DashboardShell({ userName, userPlano, trialExpired, trialDaysLeft, trialEndsAt, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<"mensal" | "anual" | null>(null);
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date()),
    []
  );
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);
  const isPro = String(userPlano).toUpperCase() === "PRO";
  const isTrialExpired = !isPro && trialExpired;
  const shouldLockContent = isTrialExpired && pathname !== "/dashboard/configuracoes";
  const trialEndsLabel = useMemo(() => {
    if (!trialEndsAt) {
      return "";
    }

    const parsed = new Date(trialEndsAt);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-BR").format(parsed);
  }, [trialEndsAt]);

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

  const startCheckout = async (ciclo: "mensal" | "anual") => {
    setCheckoutLoading(ciclo);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciclo }),
      });

      const json = await response.json();

      if (!response.ok || !json.data?.checkoutUrl) {
        toast.error(json.error?.message ?? "Não foi possível abrir o pagamento");
        return;
      }

      window.location.href = json.data.checkoutUrl as string;
    } catch {
      toast.error("Falha ao iniciar o checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}`));

  const renderNavLink = (item: NavigationLink, index: number, compact = false) => {
    const active = isActive(item.href);
    const iconColor = iconPalette[index % iconPalette.length];
    const iconBg = iconBackgroundPalette[index % iconBackgroundPalette.length];

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
          active
            ? "bg-[#eaf5ff] text-[#267ecf] shadow-[0_8px_20px_-18px_rgba(76,164,237,0.85)]"
            : "text-[#5f7790] hover:bg-white/90 hover:text-[#223246]",
          compact && "justify-center px-2"
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active-highlight"
            className="absolute inset-0 rounded-2xl border border-sky-200/80"
            transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
          />
        )}
        <span
          className={cn(
            "relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
            active ? iconBg : "bg-white/80"
          )}
        >
          <item.icon className={cn("size-4.5", active ? iconColor : "text-[#7f97ae] group-hover:text-[#43617c]")} />
        </span>

        {!compact && <span className="relative z-10 flex-1 truncate">{item.label}</span>}
      </Link>
    );
  };

  const sidebarWidth = collapsed ? "w-[92px]" : "w-[286px]";
  const desktopSidebarOffset = collapsed ? "md:ml-[92px]" : "md:ml-[286px]";

  const mobileMoreLinks = [
    ...secondaryLinks,
    {
      href: "/dashboard/planejamento",
      icon: ClipboardList,
      label: "Planejamento completo",
    },
  ];

  const mobileMainLabel =
    [...primaryLinks, ...secondaryLinks].find((item) => isActive(item.href))?.label ??
    "Dashboard";

  return (
    <div className="pf-shell-bg min-h-screen text-[#223246]">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden h-screen shrink-0 flex-col border-r border-sky-100/90 bg-white/92 backdrop-blur-xl transition-all duration-300 md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex",
            sidebarWidth
          )}
        >
          <div className="flex items-center justify-between border-b border-sky-100/90 px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_10px_24px_-16px_rgba(76,164,237,0.9)]">
                <Image
                  src="/icons/logo-planejafacil-mark.png"
                  alt="Planejafácil"
                  width={44}
                  height={44}
                  className="size-11 object-cover"
                  priority
                />
              </span>
              {!collapsed && (
                <span>
                  <strong className="font-heading block text-[1.3rem] leading-none text-[#223246]">Planejafácil</strong>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f97ae]">plataforma educacional</span>
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
            >
              <ChevronLeft className={cn("size-4 transition", collapsed && "rotate-180")} />
            </button>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-5 scrollbar-hide">
            <section className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#8aa2b9]">Principal</p>
              )}
              {primaryLinks.map((item, index) => renderNavLink(item, index, collapsed))}
            </section>

            <section className="space-y-1 pt-3">
              {!collapsed && (
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#8aa2b9]">Módulos</p>
              )}
              {secondaryLinks.map((item, index) => renderNavLink(item, index + primaryLinks.length, collapsed))}
            </section>
          </nav>

          <div className="space-y-3 border-t border-sky-100/90 p-3">
            <div className={cn("rounded-2xl border border-sky-100 bg-sky-50/60 p-3", collapsed && "px-2")}> 
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-rose-300 text-sm font-black text-white">
                  {initials}
                </span>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#223246]">{userName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6f88a2]">
                      {isPro
                        ? "Plano PRO"
                        : isTrialExpired
                          ? "Teste expirado"
                          : `${Math.max(0, trialDaysLeft)} dia${Math.max(0, trialDaysLeft) === 1 ? "" : "s"} grátis`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogoutAll}
              className={cn(
                "w-full rounded-xl text-[#6f88a2] transition hover:bg-rose-50 hover:text-rose-500",
                collapsed ? "justify-center px-0" : "justify-start"
              )}
            >
              <LogOut className={cn("size-4", !collapsed && "mr-2")} />
              {!collapsed && "Sair"}
            </Button>
          </div>
        </aside>

        <section className={cn("flex min-w-0 flex-1 flex-col transition-[margin] duration-300", desktopSidebarOffset)}>
          <header className="sticky top-0 z-30 border-b border-sky-100/80 bg-white/82 px-4 py-3.5 backdrop-blur-xl md:px-8 md:py-5">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-600 md:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu className="size-4.5" />
                </button>

                <div>
                  <p className="font-heading text-xl leading-none text-[#223246] md:text-[1.7rem]">{pageMeta.title}</p>
                  <p className="mt-1.5 text-xs font-semibold text-[#6f88a2] md:text-sm">
                    {pageMeta.subtitle}
                    <span className="mx-1.5 hidden text-sky-200 md:inline">•</span>
                    <span className="hidden capitalize md:inline">{dateLabel}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-[#6f88a2] transition hover:bg-sky-50 hover:text-sky-600"
                >
                  <Bell className="size-4" />
                </button>
              </div>
            </div>
          </header>

          {!isPro && !isTrialExpired && (
            <div className="border-b border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50/70 px-4 py-2.5 text-[13px] font-semibold text-emerald-800 md:px-8">
              <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2.5">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100"><Clock3 className="size-3.5 text-emerald-600" /></span>
                <span>
                  ✨ Seu teste grátis está ativo — restam <strong>{Math.max(0, trialDaysLeft)} dia{Math.max(0, trialDaysLeft) === 1 ? "" : "s"}</strong>
                  {trialEndsLabel ? ` (até ${trialEndsLabel})` : ""}.
                </span>
              </div>
            </div>
          )}

          {isTrialExpired && (
            <div className="border-b border-rose-200 bg-gradient-to-r from-rose-50 to-red-50/70 px-4 py-2.5 text-[13px] font-semibold text-rose-800 md:px-8">
              <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2.5">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-rose-100"><LockKeyhole className="size-3.5 text-rose-600" /></span>
                <span>Seu período grátis de 14 dias acabou. <strong>Ative o Pro</strong> para continuar usando o sistema.</span>
              </div>
            </div>
          )}

          <div className="relative flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-12 md:pt-8"
              >
                {children}
              </motion.main>
            </AnimatePresence>

            {shouldLockContent && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
                <div className="w-full max-w-2xl rounded-3xl border border-rose-200 bg-white p-6 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.45)] md:p-7">
                  <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                    <LockKeyhole className="size-3.5" />
                    Teste encerrado
                  </p>
                  <h3 className="mt-3 font-heading text-3xl text-[#223246]">Assine para continuar usando o Planejei</h3>
                  <p className="mt-2 text-sm font-semibold text-[#5f7790]">
                    Seu acesso grátis de 14 dias terminou. Escolha o plano Pro e libere o sistema completo imediatamente.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => startCheckout("mensal")}
                      disabled={checkoutLoading !== null}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-extrabold text-white shadow-[0_16px_28px_-16px_rgba(16,185,129,0.85)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {checkoutLoading === "mensal" ? <Loader2 className="size-4 animate-spin" /> : `Assinar mensal - ${MONTHLY_PRICE_LABEL}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => startCheckout("anual")}
                      disabled={checkoutLoading !== null}
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {checkoutLoading === "anual" ? <Loader2 className="size-4 animate-spin" /> : `Assinar anual - ${YEARLY_PRICE_LABEL}`}
                    </button>
                  </div>

                  <Link
                    href="/dashboard/configuracoes"
                    className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
                  >
                    Ver detalhes da assinatura
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-[#223246]/25 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-[360px] border-r border-sky-100 bg-white p-4 md:hidden"
              initial={{ x: -360 }}
              animate={{ x: 0 }}
              exit={{ x: -360 }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-10 items-center justify-center overflow-hidden rounded-xl border border-sky-100 bg-white">
                    <Image
                      src="/icons/logo-planejafacil-mark.png"
                      alt="Planejafácil"
                      width={40}
                      height={40}
                      className="size-10 object-cover"
                    />
                  </span>
                  <div>
                    <p className="font-heading text-2xl leading-none text-[#223246]">Planejafácil</p>
                  </div>
                </div>
                <div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#8aa2b9]">{mobileMainLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-1">
                {[...primaryLinks, ...mobileMoreLinks].map((item, index) => renderNavLink(item, index))}
              </div>

              <button
                type="button"
                onClick={handleLogoutAll}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-500"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-sky-100/90 bg-white/97 px-2 pb-[env(safe-area-inset-bottom,0.5rem)] pt-1.5 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-0.5">
          {mobileNavLinks.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-bold transition-all",
                  active ? "bg-sky-50 text-sky-700" : "text-[#8da4ba] active:bg-sky-50/50"
                )}
              >
                <span className={cn(
                  "inline-flex size-8 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-sky-100" : ""
                )}>
                  <item.icon className={cn("size-[18px]", active ? iconPalette[index] : "text-[#8da4ba]")} />
                </span>
                <span>{item.mobileLabel ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
