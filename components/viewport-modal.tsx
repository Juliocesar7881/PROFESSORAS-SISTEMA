"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ViewportModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function ViewportModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: ViewportModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      const preferred = panel?.querySelector<HTMLElement>("[autofocus]");
      const firstFocusable = panel?.querySelector<HTMLElement>(focusableSelector);
      (preferred ?? firstFocusable ?? panel)?.focus({ preventScroll: true });
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hidden && element.tabIndex !== -1);
      if (!focusableElements.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previousActiveElement?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] isolate flex items-end justify-center p-0 sm:items-center sm:p-5" data-modal-open="true">
      <button
        type="button"
        aria-label={`Fechar ${title}`}
        className="pf-modal-backdrop absolute inset-0 cursor-default bg-[#251e4f]/48 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "pf-modal-panel relative z-10 flex max-h-[min(92dvh,860px)] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-white/70 bg-white shadow-[0_32px_90px_-24px_rgba(24,18,62,0.48)] outline-none sm:rounded-2xl",
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eeeaf5] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-xl font-black text-[#17213f] sm:text-2xl">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm font-medium leading-relaxed text-[#6d6c82]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e8e3f0] bg-white text-[#6d6c82] shadow-sm transition-[transform,background-color,color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#d8cff2] hover:bg-[#f5f2ff] hover:text-[#6757c8] active:translate-y-0"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#eeeaf5] bg-[#fcfbff] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
