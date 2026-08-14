import { FileText } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export default function TermosPage() {
  return (
    <main className="mesh-bg min-h-screen px-4 py-10 text-[#17213f] md:px-6">
      <article className="mx-auto max-w-3xl rounded-[0.95rem] border border-[#e8e3f0] bg-white p-6 shadow-[0_30px_90px_-52px_rgba(91,58,85,0.5)] md:p-8">
        <BrandMark href="/" />
        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#e8e3f0] bg-[#f8f6ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6757c8]">
          <FileText className="size-3.5" />
          Documento legal
        </span>
        <h1 className="font-heading mt-4 text-4xl font-extrabold text-[#17213f]">Termos de Uso</h1>
        <div className="mt-5 space-y-4 text-sm font-bold leading-relaxed text-[#6d6c82]">
          <p>
            A professora usuária é a controladora dos dados pedagógicos de seus alunos. O Pequenos Passos atua como operador, processando os dados exclusivamente para apoiar planejamento, registros e acompanhamento pedagógico.
          </p>
          <p>
            O uso da plataforma exige consentimento explícito no onboarding para tratamento de dados de menores, conforme art. 14 da LGPD (Lei 13.709/2018).
          </p>
          <p>
            Ao excluir a conta, o sistema executa apagamento em cascata dos dados vinculados e mantém logs de auditoria por até 2 anos para finalidades legais e de segurança.
          </p>
        </div>
      </article>
    </main>
  );
}
