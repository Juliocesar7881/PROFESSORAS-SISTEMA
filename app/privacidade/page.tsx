export default function PrivacidadePage() {
  return (
    <main className="mesh-bg soft-grid min-h-screen px-6 py-10 text-slate-700">
      <article className="glass-card mx-auto max-w-3xl space-y-4 rounded-3xl border-none p-8 shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">LGPD</span>
        <h1 className="font-heading text-4xl text-slate-900">Política de Privacidade</h1>
        <p className="leading-relaxed">
          O Planejei coleta apenas os dados necessarios para funcionalidades pedagogicas: turmas, alunos, observacoes,
          presencas e relatorios. Dados de fotos ficam em bucket privado com URLs assinadas de 1 hora.
        </p>
        <p className="leading-relaxed">
          Clausula especifica para dados de menores: nenhum dado identificador de alunos e enviado para logs de
          monitoramento. Metadados de imagem (EXIF) sao removidos antes do armazenamento.
        </p>
        <p className="leading-relaxed">
          Direitos LGPD: acesso, correcao e apagamento. A exclusao de conta dispara cascata real dos dados de alunos e
          rotinas de hard delete apos janela de 30 dias para turmas e alunos em soft delete.
        </p>
      </article>
    </main>
  );
}
