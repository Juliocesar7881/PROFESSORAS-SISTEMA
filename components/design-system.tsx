import type { LucideIcon } from "lucide-react";
import { ClipboardList } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "brand" | "neutral" | "success" | "warning" | "danger";

const toneMap: Record<Tone, { bg: string; text: string; border: string; gradient: string; stripe: string }> = {
  brand: {
    bg: "bg-[#f1edff]",
    text: "text-[#6757c8]",
    border: "border-[#ddd4f7]",
    gradient: "from-[#4f3ca6] to-[#9a86e6]",
    stripe: "bg-[#6757c8]",
  },
  neutral: {
    bg: "bg-[#f7f5fb]",
    text: "text-[#6d6c82]",
    border: "border-[#e8e3f0]",
    gradient: "from-[#6d6c82] to-[#aaa5b7]",
    stripe: "bg-[#aaa5b7]",
  },
  success: {
    bg: "bg-[#eaf9f6]",
    text: "text-[#247f75]",
    border: "border-[#bfe9e2]",
    gradient: "from-[#319c8f] to-[#65c9bd]",
    stripe: "bg-[#4bb7a9]",
  },
  warning: {
    bg: "bg-[#fff5df]",
    text: "text-[#9a6818]",
    border: "border-[#f4d49a]",
    gradient: "from-[#d88922] to-[#f6b958]",
    stripe: "bg-[#f2a43a]",
  },
  danger: {
    bg: "bg-[#fff0f5]",
    text: "text-[#bd416d]",
    border: "border-[#f5c7d8]",
    gradient: "from-[#d9507f] to-[#f38bab]",
    stripe: "bg-[#ef6d98]",
  },
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  tone = "brand",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const toneClasses = toneMap[tone];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#e8e3f0] bg-[linear-gradient(135deg,#ffffff_0%,#f8f6ff_58%,#fffaf3_100%)] p-4 shadow-[0_14px_34px_-27px_rgba(43,35,91,0.24)] transition-[border-color,box-shadow] duration-200 hover:border-[#ddd4f7] hover:shadow-[0_22px_48px_-36px_rgba(43,35,91,0.3)] md:p-5",
        className,
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", toneClasses.stripe)} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-3 pl-1">
          {Icon ? (
            <span className={cn("mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-[0.7rem] border", toneClasses.bg, toneClasses.border)}>
              <Icon className={cn("size-5", toneClasses.text)} />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className={cn("mb-1 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", toneClasses.bg, toneClasses.border, toneClasses.text)}>
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-heading text-2xl font-bold leading-tight text-[#17213f] md:text-[2rem]">{title}</h1>
            {description ? <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-[#6d6c82] md:text-base">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}

export function ModuleCard({
  title,
  description,
  icon: Icon,
  tone = "brand",
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  const toneClasses = toneMap[tone];

  return (
    <article className={cn("rounded-2xl border border-[#e8e3f0] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(43,35,91,0.22)] transition-[transform,border-color,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#d9d0f4] hover:shadow-[0_24px_48px_-34px_rgba(43,35,91,0.3)]", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-[0.65rem] border", toneClasses.bg, toneClasses.border)}>
            <Icon className={cn("size-5", toneClasses.text)} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold leading-tight text-[#17213f]">{title}</h2>
          {description ? <p className="mt-1 text-sm font-medium leading-relaxed text-[#6d6c82]">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  const toneClasses = toneMap[tone];

  return (
    <article className="rounded-2xl border border-[#e8e3f0] bg-white p-4 shadow-[0_14px_30px_-26px_rgba(43,35,91,0.2)] transition-[transform,border-color,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#d9d0f4] hover:shadow-[0_22px_42px_-32px_rgba(43,35,91,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6d6c82]">{label}</span>
        {Icon ? (
          <span className={cn("inline-flex size-9 items-center justify-center rounded-[0.6rem]", toneClasses.bg)}>
            <Icon className={cn("size-4", toneClasses.text)} />
          </span>
        ) : null}
      </div>
      <p className="font-heading mt-3 text-3xl font-bold leading-none text-[#17213f]">{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-[#6d6c82]">{detail}</p> : null}
    </article>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-[#ddd4f7] bg-[linear-gradient(135deg,#ffffff_0%,#f7f4ff_100%)] p-6 text-center", className)}>
      <span className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-xl border border-[#ddd4f7] bg-white text-[#6757c8]">
        <ClipboardList className="size-5" />
      </span>
      <h3 className="font-heading text-lg font-bold text-[#17213f]">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-relaxed text-[#6d6c82]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function FormPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-[#e8e3f0] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(43,35,91,0.22)] transition-[border-color,box-shadow] duration-200 hover:border-[#ddd4f7] hover:shadow-[0_20px_42px_-34px_rgba(43,35,91,0.28)] md:p-5", className)}>{children}</section>;
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-[#e8e3f0] bg-white p-3 shadow-[0_12px_28px_-26px_rgba(43,35,91,0.18)] transition-[border-color,box-shadow] duration-200 hover:border-[#ddd4f7] hover:shadow-[0_18px_36px_-30px_rgba(43,35,91,0.26)]", className)}>{children}</section>;
}

export function MobileActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e3f0] bg-white/98 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 shadow-[0_-18px_42px_-34px_rgba(43,35,91,0.3)] backdrop-blur-xl md:hidden", className)}>
      {children}
    </div>
  );
}
