import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardPageHeroProps = {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  gradient: string;
  orbColor: string;
  actions?: ReactNode;
  borderClassName?: string;
};

export function DashboardPageHero({
  icon: Icon,
  badge,
  title,
  description,
  gradient,
  orbColor,
  actions,
  borderClassName,
}: DashboardPageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-[1.4rem] border p-6 md:p-9", borderClassName)} style={{ background: gradient }}>
      <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: orbColor }} />
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur-sm">
            <Icon className="size-3.5" />
            {badge}
          </div>
          <h2 className="font-heading text-[1.5rem] tracking-tight text-white md:text-[1.75rem]">{title}</h2>
          <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-white/75">{description}</p>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
