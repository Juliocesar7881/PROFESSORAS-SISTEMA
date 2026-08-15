import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardFilterBarProps = {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
  controlsClassName?: string;
};

export function DashboardFilterBar({
  title,
  summary,
  children,
  className,
  controlsClassName,
}: DashboardFilterBarProps) {
  return (
    <section
      className={cn(
        "rounded-[0.8rem] border border-[#e8e3f0] bg-white px-4 py-3 shadow-[0_10px_28px_-26px_rgba(91,58,85,0.24)] transition-[border-color,box-shadow] duration-200 hover:border-[#d9d0f4] hover:shadow-[0_18px_38px_-30px_rgba(43,35,91,0.3)] md:px-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-[1.12rem] font-bold leading-tight text-[#17213f]">{title}</h2>
          {summary ? <div className="mt-1 text-sm font-medium text-[#6d6c82]">{summary}</div> : null}
        </div>

        <div className={cn("grid min-w-0 gap-2 sm:grid-cols-2 lg:flex lg:items-center lg:justify-end", controlsClassName)}>
          {children}
        </div>
      </div>
    </section>
  );
}
