"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { PrefeituraNote } from "@/components/prefeitura-note";
import { Button } from "@/components/ui/button";

const features = [
  { icon: BookOpen, label: "Projetos", tone: "bg-[#f1edff] text-[#6757c8]" },
  { icon: BookOpen, label: "Planejamento", tone: "bg-[#eaf9f6] text-[#278b7f]" },
  { icon: Sparkles, label: "Avaliações assistidas", tone: "bg-[#fff0f5] text-[#c64975]" },
  { icon: FileText, label: "Impressão fácil", tone: "bg-[#fff5df] text-[#b46d18]" },
  { icon: ShieldCheck, label: "Dados protegidos", tone: "bg-[#eef4ff] text-[#4c78d0]" },
];

const proofPoints = ["Sem cartão de crédito", "Acesso completo grátis", "Sem assinatura"];

function getAuthErrorMessage(errorCode: string | null | undefined) {
  if (!errorCode) return null;

  switch (errorCode) {
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
      return "Não conseguimos concluir o login com Google agora. Tente novamente.";
    case "AccessDenied":
      return "Acesso negado. Verifique sua conta Google e tente de novo.";
    case "Configuration":
      return "Não foi possível validar esta tentativa de login. Feche esta aba e tente novamente em uma janela anônima.";
    default:
      return "Não foi possível entrar agora. Tente novamente em alguns segundos.";
  }
}

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState({ google: false });
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && callbackUrl) {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAuthError(getAuthErrorMessage(params.get("error")));
    const requestedCallback = params.get("callbackUrl");
    setCallbackUrl(requestedCallback?.startsWith("/") ? requestedCallback : "/dashboard");

    if (params.has("error")) {
      params.delete("error");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProviders = async () => {
      try {
        const response = await fetch("/api/auth/providers", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as Record<string, unknown>;
        const providerIds = Object.keys(payload ?? {});

        if (mounted) {
          setAvailableProviders({ google: providerIds.includes("google") });
        }
      } catch {
        // Keep defaults and let existing auth error handling guide the user.
      } finally {
        if (mounted) setProvidersLoaded(true);
      }
    };

    loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const runSignIn = async (provider: "google") => {
    if (!availableProviders[provider]) {
      setAuthError("O login com Google não está disponível neste ambiente.");
      return;
    }

    setLoadingProvider(provider);
    setAuthError(null);

    try {
      const result = await signIn(
        provider,
        { callbackUrl: callbackUrl || "/dashboard", redirect: false },
        { prompt: "select_account" },
      );

      if (result?.error) {
        setAuthError(getAuthErrorMessage(result.error));
        return;
      }

      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      router.push(callbackUrl || "/dashboard");
    } catch {
      setAuthError("Não foi possível entrar agora. Tente novamente em alguns segundos.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const loginHint = !providersLoaded
    ? "Verificando métodos de acesso..."
    : availableProviders.google
      ? "Acesso único e seguro via Google."
      : "Nenhum método de acesso configurado.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffdfa_0%,#f7f4ff_100%)] px-4 py-6 text-[#17213f] md:px-8 md:py-10">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-2xl border border-[#e8e3f0] bg-white shadow-[0_32px_90px_-54px_rgba(43,35,91,0.42)] lg:grid-cols-[1fr_.86fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(160deg,#493696_0%,#6757c8_58%,#9a86e6_100%)] p-5 text-white md:p-10">
            <div className="relative z-10">
              <BrandMark href="/" markClassName="ring-white/15" textClassName="[&_strong]:text-white [&_span]:text-white/52" />

              <div className="mt-10 hidden max-w-2xl lg:block">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white/72">
                  Acesso Pequenos Passos
                </p>
                <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
                  Entre no painel e continue de onde parou.
                </h1>
                <p className="mt-4 text-base font-medium leading-relaxed text-white/68">
                  Projetos, impressão, planejamento e registros pedagógicos em uma rotina clara e acolhedora.
                </p>
              </div>

              <div className="mt-8 hidden gap-3 sm:grid-cols-2 lg:grid">
                {features.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.08] p-3">
                    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${feature.tone}`}>
                      <feature.icon className="size-4.5" />
                    </span>
                    <span className="text-sm font-semibold text-white/72">{feature.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 hidden justify-center lg:flex">
                <Image src="/brand/pequenos-passos-icon.png" alt="" width={420} height={420} className="h-auto w-[68%] rounded-[2rem] shadow-[0_28px_70px_-36px_rgba(23,33,63,.45)]" />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6757c8]">Acesso seguro</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#17213f]">Entre na sua conta</h2>
              <p className="mt-1 text-sm font-medium text-[#6d6c82]">{loginHint}</p>

              {!providersLoaded ? (
                <div className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ddd4f7] bg-[#fcfbff] text-sm font-semibold text-[#6d6c82]">
                  <Loader2 className="size-4 animate-spin text-[#6757c8]" />
                  Carregando métodos...
                </div>
              ) : null}

              {providersLoaded && availableProviders.google ? (
                <Button
                  type="button"
                  onClick={() => runSignIn("google")}
                  disabled={Boolean(loadingProvider)}
                  variant="outline"
                  className="mt-7 h-14 w-full justify-start gap-3.5 border-[#e8e3f0] bg-white px-5 text-sm font-semibold text-[#17213f] shadow-[0_14px_34px_-27px_rgba(43,35,91,0.24)] hover:bg-[#f8f6ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#e8e3f0] bg-white">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
                      <path fill="#EA4335" d="M12 11.2v-7a7.8 7.8 0 0 1 6.76 3.9l-3.03 5.24A3.5 3.5 0 0 0 12 11.2z" />
                      <path fill="#FBBC05" d="M21.8 12a9.8 9.8 0 0 1-1.35 5.01h-6.06a3.5 3.5 0 0 0 1.34-3.67l3.03-5.24A9.74 9.74 0 0 1 21.8 12z" />
                      <path fill="#34A853" d="M20.45 17.01A9.8 9.8 0 0 1 12 21.8a9.79 9.79 0 0 1-8.47-4.88l3.03-5.24a3.5 3.5 0 0 0 4.74 4.57l9.15.76z" />
                      <path fill="#4285F4" d="M3.53 16.92A9.8 9.8 0 0 1 2.2 12c0-1.73.45-3.35 1.24-4.75A9.79 9.79 0 0 1 12 2.2a9.8 9.8 0 0 1 6.76 2.7l-3.03 5.24A3.5 3.5 0 0 0 6.56 11.7l-3.03 5.22z" />
                    </svg>
                  </span>
                  <span>{loadingProvider === "google" ? "Conectando..." : "Continuar com Google"}</span>
                  {loadingProvider === "google" ? <Loader2 className="ml-auto size-4 animate-spin" /> : <CheckCircle2 className="ml-auto size-4 text-[#6757c8]" />}
                </Button>
              ) : null}

              {providersLoaded && !availableProviders.google ? (
                <div className="mt-4 rounded-xl border border-[#f4d49a] bg-[#fff5df] px-4 py-3 text-xs font-medium text-[#9a6818]">
                  Nenhum provedor de login está configurado neste ambiente.
                </div>
              ) : null}

              {authError ? (
                <div className="mt-4 rounded-xl border border-[#f3c4cc] bg-[#fff0f2] px-4 py-3 text-xs font-medium text-[#b83f55]">
                  {authError}
                </div>
              ) : null}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#e8e3f0]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#aaa5b7]">seguro</span>
                <div className="h-px flex-1 bg-[#e8e3f0]" />
              </div>

              <div className="space-y-2">
                {proofPoints.map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-[#3f9d65]" />
                    <span className="text-xs font-semibold text-[#6d6c82]">{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <PrefeituraNote />
              </div>

              <p className="mt-7 text-[11px] font-medium leading-relaxed text-[#6d6c82]">
                Ao continuar você concorda com os{" "}
                <Link href="/termos" className="text-[#6757c8] underline underline-offset-2">Termos de Uso</Link>{" "}
                e a{" "}
                <Link href="/privacidade" className="text-[#6757c8] underline underline-offset-2">Política de Privacidade</Link>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
