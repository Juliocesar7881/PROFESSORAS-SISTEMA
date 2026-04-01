export default function PrivacidadePage() {
  return (
    <main className="mesh-bg soft-grid min-h-screen px-6 py-10 text-[#4E4770]">
      <article className="glass-card mx-auto max-w-3xl space-y-4 rounded-3xl border border-[#DCECF8] p-8">
        <h1 className="font-heading text-4xl text-[#1E1740]">Politica de Privacidade</h1>
        <p>
          O Planejei coleta apenas os dados necessarios para funcionalidades pedagogicas: turmas, alunos, observacoes,
          presencas e relatorios. Dados de fotos ficam em bucket privado com URLs assinadas de 1 hora.
        </p>
        <p>
          Clausula especifica para dados de menores: nenhum dado identificador de alunos e enviado para logs de
          monitoramento. Metadados de imagem (EXIF) sao removidos antes do armazenamento.
        </p>
        <p>
          Direitos LGPD: acesso, correcao e apagamento. A exclusao de conta dispara cascata real dos dados de alunos e
          rotinas de hard delete apos janela de 30 dias para turmas e alunos em soft delete.
        </p>
      </article>
    </main>
  );
}
