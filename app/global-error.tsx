"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="mesh-bg soft-grid min-h-screen text-slate-800">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <section className="glass-card w-full rounded-3xl border-none p-8 shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)] md:p-10">
            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-700 ring-1 ring-rose-100">
              Erro inesperado
            </span>
            <h1 className="mt-3 font-heading text-3xl text-slate-900 md:text-4xl">Algo deu errado nesta página</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
              Já registramos este problema para investigação automática. Você pode tentar novamente agora mesmo sem perder o restante da sua sessão.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={reset}
                className="h-11 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-5 font-bold text-white hover:from-rose-600 hover:to-purple-700"
              >
                <RotateCcw className="mr-2 size-4" />
                Tentar novamente
              </Button>

              <a
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
