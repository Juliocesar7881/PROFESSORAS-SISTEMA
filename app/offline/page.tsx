import Image from "next/image";
import Link from "next/link";
import { WifiOff } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export default function OfflinePage() {
  return (
    <main className="mesh-bg min-h-screen px-4 py-10 text-[#312834] md:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center">
        <div className="grid w-full gap-6 rounded-[0.95rem] border border-[#eadde5] bg-white p-6 shadow-[0_30px_90px_-52px_rgba(91,58,85,0.5)] md:grid-cols-[.9fr_1.1fr] md:p-8">
          <div className="flex flex-col justify-center">
            <BrandMark href="/" />
            <p className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-[#f5dfa1] bg-[#fff8e5] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a6a00]">
              <WifiOff className="size-3.5" />
              Modo offline
            </p>
            <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight text-[#312834]">Sem conexão no momento</h1>
            <p className="mt-4 text-sm font-bold leading-relaxed text-[#857582]">
              O Pequenos Passos continua disponível para consulta local. Assim que a internet voltar, os dados pendentes serão sincronizados automaticamente.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex h-12 w-fit items-center rounded-md bg-[linear-gradient(135deg,#6a4562,#f0b8c9)] px-5 text-sm font-bold text-white">
              Voltar ao painel
            </Link>
          </div>
          <Image src="/brand/empty-state.png" alt="" width={640} height={480} className="h-auto w-full rounded-[0.75rem]" />
        </div>
      </section>
    </main>
  );
}
