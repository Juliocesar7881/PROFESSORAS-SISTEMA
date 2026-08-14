"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="mesh-bg min-h-screen text-[#17213f]">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <section className="w-full rounded-[0.95rem] border border-[#e8e3f0] bg-white p-8 shadow-[0_30px_90px_-52px_rgba(91,58,85,0.5)] md:p-10">
            <BrandMark href="/" />
            <span className="mt-8 inline-flex rounded-full border border-[#ffd2b8] bg-[#fff4ed] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#b95018]">
              Erro inesperado
            </span>
            <h1 className="font-heading mt-3 text-3xl font-extrabold text-[#17213f] md:text-4xl">Algo deu errado nesta página</h1>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[#6d6c82] md:text-base">
              Já registramos este problema para investigação automática. Você pode tentar novamente agora mesmo sem perder o restante da sua sessão.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={reset} className="h-11 px-5 font-bold">
                <RotateCcw className="mr-2 size-4" />
                Tentar novamente
              </Button>

              <a
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-md border border-[#e8e3f0] bg-white px-5 text-sm font-semibold text-[#6d6c82] transition-colors hover:bg-[#f8f6ff]"
              >
                <AlertTriangle className="mr-2 size-4" />
                Voltar para o dashboard
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
