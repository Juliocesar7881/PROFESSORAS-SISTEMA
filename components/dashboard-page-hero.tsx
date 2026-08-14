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
  actions,
  borderClassName,
}: DashboardPageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-2xl border border-[#e8e3f0] bg-white p-4 shadow-[0_16px_40px_-30px_rgba(43,35,91,0.3)] md:p-5", borderClassName)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6757c8] via-[#9a86e6] to-[#ef6d98]" />

      <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#ded7f6] bg-[#f4f1ff] text-[#6757c8]">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#ded7f6] bg-[#f4f1ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6757c8]">
              {badge}
            </div>
            <h2 className="font-heading text-[1.45rem] font-bold leading-tight text-[#17213f] md:text-[1.8rem]">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-[#6d6c82]">{description}</p>
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}
