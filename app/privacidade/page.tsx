import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export default function PrivacidadePage() {
  return (
    <main className="mesh-bg min-h-screen px-4 py-10 text-[#17213f] md:px-6">
      <article className="mx-auto max-w-3xl rounded-[0.95rem] border border-[#e8e3f0] bg-white p-6 shadow-[0_30px_90px_-52px_rgba(91,58,85,0.5)] md:p-8">
        <BrandMark href="/" />
        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#bdeccc] bg-[#ecfdf3] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#16804a]">
          <ShieldCheck className="size-3.5" />
          LGPD
        </span>
        <h1 className="font-heading mt-4 text-4xl font-extrabold text-[#17213f]">Política de Privacidade</h1>
        <div className="mt-5 space-y-4 text-sm font-bold leading-relaxed text-[#6d6c82]">
          <p>
            O Pequenos Passos coleta apenas os dados necessários para funcionalidades pedagógicas: turmas, crianças, registros, fotos e relatórios. As fotos ficam em armazenamento privado com URLs temporárias.
          </p>
          <p>
            Cláusula específica para dados de menores: nenhum dado identificador de alunos é enviado para logs de monitoramento. Metadados de imagem (EXIF) são removidos antes do armazenamento.
          </p>
          <p>
            Direitos LGPD: acesso, correção e apagamento. A exclusão de conta dispara cascata real dos dados de alunos e rotinas de hard delete após janela de 30 dias para turmas e alunos em soft delete.
          </p>
          <p>
            Para remover sua conta e os dados associados, use o caminho de privacidade dentro do aplicativo ou acesse a{" "}
            <Link href="/excluir-conta" className="text-[#8b4164] underline underline-offset-4">
              página de exclusão de conta
            </Link>.
          </p>
        </div>
      </article>
    </main>
  );
}
