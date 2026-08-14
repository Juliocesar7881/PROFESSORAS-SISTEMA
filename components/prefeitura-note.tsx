import { ShieldCheck } from "lucide-react";

export function PrefeituraNote() {
  return (
    <div className="break-words rounded-2xl border border-[#ddd4f7] bg-[#f7f4ff] p-4 text-sm font-medium leading-relaxed text-[#6d6c82]">
      <div className="mb-2 flex items-center gap-2 font-bold text-[#6757c8]">
        <ShieldCheck className="size-4" />
        Sobre o Pequenos Passos
      </div>
      <p>
        O Pequenos Passos <strong>complementa</strong> os sistemas oficiais da escola ou prefeitura. Ele organiza projetos, planejamento e registros pedagógicos para apoiar a rotina da professora.
      </p>
    </div>
  );
}
