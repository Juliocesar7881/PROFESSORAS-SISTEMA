"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Star, ClipboardCheck, BarChart3, CheckCircle } from "lucide-react";

import { PrefeituraNote } from "@/components/prefeitura-note";


const features = [
  { icon: BookOpen, label: "Planejamento semanal IA", color: "text-violet-600", bg: "bg-violet-50" },
  { icon: ClipboardCheck, label: "Chamada digital", color: "text-sky-600", bg: "bg-sky-50" },
  { icon: Star, label: "Avaliações com IA", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: BarChart3, label: "Relatórios automáticos", color: "text-emerald-600", bg: "bg-emerald-50" },
];

const proofPoints = [
  "Sem cartão de crédito",
  "14 dias grátis no Pro",
  "Cancele quando quiser",
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  // Nunca mostrar skeleton — renderizar o formulário imediatamente
  // O redirect acontece via useEffect se autenticada


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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8" style={{ background: "linear-gradient(135deg, #EDE8FF 0%, #F5F3FF 40%, #E0FDF4 100%)" }}>
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 right-[-8%] h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(108,92,231,0.25) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-5%] h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,184,148,0.2) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(108,92,231,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[960px] overflow-hidden rounded-[2.5rem] border border-violet-200 bg-white shadow-[0_40px_100px_-20px_rgba(108,92,231,0.35),0_8px_32px_-8px_rgba(108,92,231,0.15)]"
      >
        {/* Gradient top accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent" />


        <div className="grid md:grid-cols-[1.15fr_0.85fr] md:items-stretch">
          {/* ─── Left: Branding + Features ─── */}
          <div className="relative flex flex-col justify-center overflow-hidden p-8 md:p-12">
            {/* Left panel soft gradient */}
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(108,92,231,0.04) 0%, rgba(0,184,148,0.03) 100%)" }} />

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative mb-7 flex items-center gap-3"
            >
              <div className="relative">
                <div className="inline-flex size-11 items-center justify-center rounded-2xl shadow-[0_6px_20px_-4px_rgba(108,92,231,0.5)]" style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #a78bfa 100%)" }}>
                  <Sparkles className="size-5 text-white" />
                </div>
                <div className="absolute -inset-1.5 rounded-3xl opacity-20 blur-xl" style={{ background: "linear-gradient(135deg, #6C5CE7, #a78bfa)" }} />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold tracking-tight text-gray-900">Planejei</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">para professoras</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600">
                <Sparkles className="size-3" />
                Assistente pedagógico com IA
              </div>
              <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
                Planeje <span style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #00B894 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>melhor</span>,{" "}
                <br className="hidden sm:block" />
                registre com <span style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FDCB6E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>carinho</span>.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                O que o sistema da prefeitura nunca foi. Rápido, bonito e feito pra você.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative mt-7 grid grid-cols-2 gap-2.5"
            >
              {features.map((feat) => (
                <div
                  key={feat.label}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
                >
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${feat.bg}`}>
                    <feat.icon className={`size-3.5 ${feat.color}`} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{feat.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mt-6"
            >
              <PrefeituraNote />
            </motion.div>
          </div>

          {/* ─── Right: Login Form ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-col justify-center border-t border-gray-100 bg-gray-50/60 p-8 md:border-l md:border-t-0 md:p-10"
          >
            <div className="mb-7">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Acesso seguro
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-gray-900">Entre na sua conta</p>
              <p className="mt-1 text-sm text-gray-500">Acesso único e seguro via Google.</p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative flex h-14 w-full items-center gap-3.5 overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-800 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
                  <path fill="#EA4335" d="M12 11.2v-7a7.8 7.8 0 0 1 6.76 3.9l-3.03 5.24A3.5 3.5 0 0 0 12 11.2z" />
                  <path fill="#FBBC05" d="M21.8 12a9.8 9.8 0 0 1-1.35 5.01h-6.06a3.5 3.5 0 0 0 1.34-3.67l3.03-5.24A9.74 9.74 0 0 1 21.8 12z" />
                  <path fill="#34A853" d="M20.45 17.01A9.8 9.8 0 0 1 12 21.8a9.79 9.79 0 0 1-8.47-4.88l3.03-5.24a3.5 3.5 0 0 0 4.74 4.57l9.15.76z" />
                  <path fill="#4285F4" d="M3.53 16.92A9.8 9.8 0 0 1 2.2 12c0-1.73.45-3.35 1.24-4.75A9.79 9.79 0 0 1 12 2.2a9.8 9.8 0 0 1 6.76 2.7l-3.03 5.24A3.5 3.5 0 0 0 6.56 11.7l-3.03 5.22z" />
                </svg>
              </div>
              <span className="relative text-gray-700">
                {loading ? "Conectando…" : "Continuar com Google"}
              </span>
              {!loading && (
                <svg className="relative ml-auto size-4 text-gray-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">seguro</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-2">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <CheckCircle className="size-3.5 shrink-0 text-emerald-500" />
                  <span className="text-xs font-medium text-gray-500">{point}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-gray-400">
              Ao continuar você concorda com os{" "}
              <Link href="/termos" className="font-semibold text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-800">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="font-semibold text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-800">
                Política de Privacidade
              </Link>
              .
            </p>
          </motion.div>
        </div>

        {/* Gradient bottom accent */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
      </motion.div>
    </main>
  );
}
