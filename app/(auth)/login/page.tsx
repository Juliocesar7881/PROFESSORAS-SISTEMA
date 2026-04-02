"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrefeituraNote } from "@/components/prefeitura-note";

function LoginSkeleton() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] p-5 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(244,63,94,0.26),transparent_35%),radial-gradient(circle_at_86%_24%,rgba(168,85,247,0.24),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.16),transparent_36%)]" />
      <section className="relative z-10 w-full max-w-[900px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827]/85 p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.8)] backdrop-blur md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-5">
            <div className="h-7 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="h-12 w-72 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 w-80 animate-pulse rounded-xl bg-white/10" />
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-white/15" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoginSkeleton />;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/login-attempt", { method: "POST" });
      await signIn("google", { callbackUrl: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] p-5 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(244,63,94,0.26),transparent_35%),radial-gradient(circle_at_86%_24%,rgba(168,85,247,0.24),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.16),transparent_36%)]" />

      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative z-10 w-full max-w-[900px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827]/85 p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.8)] backdrop-blur md:p-8"
      >
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white/90"
            >
              <Sparkles className="size-3.5 text-[#FB7185]" />
              Planejei
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="font-heading text-4xl text-white sm:text-5xl">Entrar no Planejei</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                Seu assistente pedagógico. O que o sistema da prefeitura nunca foi.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <PrefeituraNote />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="rounded-2xl border border-white/15 bg-white/95 p-5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.85)]"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Autenticação</p>
            <p className="mb-4 text-sm text-slate-700">Acesso único por conta Google.</p>

            <Button
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#F43F5E] text-white transition-all hover:bg-[#E11D48] hover:shadow-lg active:scale-[0.98]"
            >
              <svg data-icon="inline-start" viewBox="0 0 24 24" aria-hidden="true" className="mr-2 size-4">
                <path fill="#EA4335" d="M12 11.2v-7a7.8 7.8 0 0 1 6.76 3.9l-3.03 5.24A3.5 3.5 0 0 0 12 11.2z" />
                <path fill="#FBBC05" d="M21.8 12a9.8 9.8 0 0 1-1.35 5.01h-6.06a3.5 3.5 0 0 0 1.34-3.67l3.03-5.24A9.74 9.74 0 0 1 21.8 12z" />
                <path fill="#34A853" d="M20.45 17.01A9.8 9.8 0 0 1 12 21.8a9.79 9.79 0 0 1-8.47-4.88l3.03-5.24a3.5 3.5 0 0 0 4.74 4.57l9.15.76z" />
                <path fill="#4285F4" d="M3.53 16.92A9.8 9.8 0 0 1 2.2 12c0-1.73.45-3.35 1.24-4.75A9.79 9.79 0 0 1 12 2.2a9.8 9.8 0 0 1 6.76 2.7l-3.03 5.24A3.5 3.5 0 0 0 6.56 11.7l-3.03 5.22z" />
              </svg>
              {loading ? "Conectando..." : "Entrar com Google"}
            </Button>

            <p className="mt-4 text-xs text-slate-600">
              Ao continuar você concorda com os <Link href="/termos" className="font-semibold underline">Termos</Link> e a <Link href="/privacidade" className="font-semibold underline">Política de Privacidade</Link>.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
