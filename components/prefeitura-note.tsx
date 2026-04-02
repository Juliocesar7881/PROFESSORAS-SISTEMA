import { ShieldCheck } from "lucide-react";

export function PrefeituraNote() {
  return (
    <div className="rounded-2xl border border-[#DCECF8] bg-[#F8FBFF] p-4 text-sm text-[#4E4770] backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 font-semibold text-[#0BB8A8]">
        <ShieldCheck className="size-4" />
        Posicionamento oficial do Planejei
      </div>
      <p>
        O Planejei <strong>não substitui</strong> o sistema da prefeitura (Betha, Sige e similares). Ele faz o que o sistema da prefeitura nunca fez: planejamento vivo, observações de aprendizagem e rotina da turma.
      </p>
    </div>
  );
}
