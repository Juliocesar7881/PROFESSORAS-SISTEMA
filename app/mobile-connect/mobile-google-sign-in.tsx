"use client";

import { signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

export function MobileGoogleSignIn({
  callbackUrl,
  clearExistingSession = false,
}: {
  callbackUrl: string;
  clearExistingSession?: boolean;
}) {
  const started = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const connect = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (clearExistingSession) {
        await signOut({ callbackUrl, redirect: false });
      }

      const result = await signIn(
        "google",
        { callbackUrl, redirect: false },
        { prompt: "select_account" },
      );
      if (result?.error || !result?.url) {
        throw new Error("Nao foi possivel abrir o login do Google.");
      }
      window.location.replace(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel abrir o Google.");
      setLoading(false);
    }
  }, [callbackUrl, clearExistingSession]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void connect();
  }, [connect]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fbfaf8] px-6 text-[#17213f]">
      <div className="flex max-w-xs flex-col items-center text-center">
        {loading ? <LoaderCircle className="size-7 animate-spin text-[#6757c8]" /> : null}
        <p className="mt-4 text-sm font-bold">{loading ? "Abrindo Google..." : "Nao foi possivel continuar"}</p>
        {error ? <p className="mt-2 text-xs font-medium leading-relaxed text-[#6d6c82]">{error}</p> : null}
        {!loading ? (
          <button
            type="button"
            onClick={() => void connect()}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6757c8] px-5 text-sm font-bold text-white"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
        ) : null}
      </div>
    </main>
  );
}
