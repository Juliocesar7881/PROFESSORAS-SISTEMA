"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PrefeituraNote } from "@/components/prefeitura-note";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/onboarding");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/login-attempt", { method: "POST" });
      await signIn("google", { callbackUrl: "/onboarding" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mesh-bg soft-grid relative flex min-h-screen items-center justify-center overflow-hidden p-5 md:p-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-[15%] -left-[10%] h-[42vh] w-[36vw] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
          className="absolute top-[35%] -right-[12%] h-[46vh] w-[34vw] rounded-full bg-secondary/25 blur-[120px]"
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card relative z-10 w-full max-w-[560px] rounded-[2rem] p-7 sm:p-10"
      >
        <div className="grid gap-7 md:grid-cols-[1fr_1fr] md:items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7C759E]">Planejei</p>
            <h1 className="font-heading text-4xl leading-none text-[#1E1740] sm:text-5xl">Entrar</h1>

            <p className="mt-4 text-sm leading-relaxed text-[#5F5884]">
              Seu assistente pedagogico para a rotina da Educacao Infantil.
            </p>

            <div className="mt-5">
              <PrefeituraNote />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
            <div className="rounded-2xl border border-[#DCECF8] bg-white/95 p-5 shadow-[0_18px_40px_-30px_rgba(30,23,64,0.3)]">
              <p className="mb-3 text-sm text-[#6A638D]">Acesso unico por conta Google</p>

              <Button
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={loading || status === "loading"}
                className="h-12 w-full rounded-xl bg-[#0BB8A8] text-white shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#0A9F92] active:scale-[0.99]"
              >
                <svg
                  data-icon="inline-start"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="mr-2 size-4"
                >
                  <path fill="#EA4335" d="M12 11.2v-7a7.8 7.8 0 0 1 6.76 3.9l-3.03 5.24A3.5 3.5 0 0 0 12 11.2z" />
                  <path fill="#FBBC05" d="M21.8 12a9.8 9.8 0 0 1-1.35 5.01h-6.06a3.5 3.5 0 0 0 1.34-3.67l3.03-5.24A9.74 9.74 0 0 1 21.8 12z" />
                  <path fill="#34A853" d="M20.45 17.01A9.8 9.8 0 0 1 12 21.8a9.79 9.79 0 0 1-8.47-4.88l3.03-5.24a3.5 3.5 0 0 0 4.74 4.57l9.15.76z" />
                  <path fill="#4285F4" d="M3.53 16.92A9.8 9.8 0 0 1 2.2 12c0-1.73.45-3.35 1.24-4.75A9.79 9.79 0 0 1 12 2.2a9.8 9.8 0 0 1 6.76 2.7l-3.03 5.24A3.5 3.5 0 0 0 6.56 11.7l-3.03 5.22z" />
                </svg>
                {loading ? "Conectando..." : "Entrar com Google"}
              </Button>

              <p className="mt-4 text-xs text-[#7A739E]">
                Ao continuar voce concorda com os <Link href="/termos" className="underline">Termos</Link> e a <Link href="/privacidade" className="underline">Politica de Privacidade</Link>.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
