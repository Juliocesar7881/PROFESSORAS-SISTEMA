import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function BrandMark({
  href,
  compact = false,
  className,
  markClassName,
  textClassName,
}: BrandMarkProps) {
  const useLightText = textClassName?.includes("text-white");
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#fffdfa] shadow-[0_14px_30px_-22px_rgba(43,35,91,0.34)] ring-1 ring-[#e8e3f0]",
          markClassName,
        )}
      >
        <Image src="/brand/pequenos-passos-icon.png" alt="" width={44} height={44} className="size-full object-cover" priority />
      </span>
      {!compact && (
        <span className={cn("min-w-0 leading-none", textClassName)}>
          <strong className={cn("block text-[1.12rem] font-extrabold leading-none tracking-normal", useLightText ? "text-white" : "text-[#17213f]")}>
            Pequenos <span className={useLightText ? "text-white" : "text-[#6757c8]"}>Passos</span>
          </strong>
          <span className={cn("mt-1.5 block text-[9px] font-bold uppercase tracking-[0.12em]", useLightText ? "text-white/62" : "text-[#6d6c82]")}>
            gestão pedagógica
          </span>
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex min-w-0 items-center gap-3", className);

  if (href) {
    return (
      <Link href={href} className={classes} prefetch={false}>
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}
