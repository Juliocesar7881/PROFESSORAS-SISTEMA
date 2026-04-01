"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarDays, Camera, ClipboardCheck, FolderKanban, Home, LogOut, Settings, UserRound, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", icon: Home, label: "Painel Inicial" },
  { href: "/dashboard/planejamento", icon: CalendarDays, label: "Plano de Aula" },
  { href: "/dashboard/alunos", icon: UserRound, label: "Meus Alunos" },
  { href: "/dashboard/chamada", icon: ClipboardCheck, label: "Diário & Chamada" },
  { href: "/dashboard/projetos", icon: FolderKanban, label: "Projetos" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },
];

interface DashboardShellProps {
  userName: string;
  userPlano: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, userPlano, children }: DashboardShellProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const handleLogoutAll = async () => {
    await fetch("/api/account/logout-all", { method: "POST" });
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="mesh-bg soft-grid min-h-screen text-foreground">
      <div className="mx-auto w-full max-w-[1500px] p-3 md:p-6">
        <div className="grid min-h-[calc(100vh-1.5rem)] gap-4 md:grid-cols-[290px_1fr] md:gap-6">
          <motion.aside
            initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
            className="glass-card hidden overflow-hidden rounded-[2rem] p-5 md:flex md:flex-col"
          >
            <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#0BB8A8] via-[#25C7B8] to-[#3CC8A0] p-5 text-white shadow-[0_18px_42px_-28px_rgba(11,184,168,0.9)]">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-white/20 text-white ring-1 ring-white/35">
                  <Sparkles className="size-4" />
                </span>
                <p className="font-heading text-3xl">Planejei</p>
              </div>
              <p className="text-sm text-white/90">{userName}</p>
              <p className="mt-2 inline-flex rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-white">
                Plano {userPlano}
              </p>
            </div>

            <nav className="flex-1 space-y-1">
              {links.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition",
                      active
                        ? "border-[#BDEEE8] bg-[#E8FBF8] text-[#0F8F83] shadow-[0_12px_28px_-22px_rgba(11,184,168,0.8)]"
                        : "border-transparent text-[#625B86] hover:border-[#DCECF8] hover:bg-white/80 hover:text-[#1E1740]",
                    )}
                  >
                    <item.icon className={cn("size-4", active ? "text-[#0BB8A8]" : "text-[#8D88AA]")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Button
              variant="outline"
              onClick={handleLogoutAll}
              className="mt-4 w-full justify-start rounded-2xl border border-[#FFCFC5] bg-[#FFF6F3] text-[#DD5D42] hover:border-[#FFB6A6] hover:bg-[#FFEAE4]"
            >
              <LogOut className="mr-2 size-4" />
              Sair de todos os dispositivos
            </Button>
          </motion.aside>

          <section className="flex min-w-0 flex-col gap-4 md:gap-6">
            <motion.header
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, delay: 0.02 }}
              className="glass-card rounded-[1.5rem] px-4 py-3 md:px-6 md:py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6C6691]">Sala de aula em foco</p>
                  <h2 className="font-heading text-2xl leading-tight text-[#1E1740] md:text-3xl">Gestao pedagogica do dia</h2>
                </div>
                <div className="inline-flex size-10 items-center justify-center rounded-full bg-[#E7FBF8] text-[#0BB8A8] ring-1 ring-[#BCEDE7]">
                  <Camera className="size-5" />
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
                {links.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
                        active
                          ? "border-[#BDEEE8] bg-[#E8FBF8] text-[#0F8F83]"
                          : "border-[#E2EFFF] bg-white text-[#6A638D]",
                      )}
                    >
                      <item.icon className="size-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.header>

            <main className="relative flex-1">
              <motion.div
                key={pathname}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
                className="h-full"
              >
                {children}
              </motion.div>
            </main>
          </section>
        </div>
      </div>
    </div>
  );
}
