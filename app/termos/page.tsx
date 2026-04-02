export default function TermosPage() {
  return (
    <main className="mesh-bg soft-grid min-h-screen px-6 py-10 text-slate-700">
      <article className="glass-card mx-auto max-w-3xl space-y-4 rounded-3xl border-none p-8 shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-700 ring-1 ring-cyan-100">Documento legal</span>
        <h1 className="font-heading text-4xl text-slate-900">Termos de Uso</h1>
        <p className="leading-relaxed">
          A professora usuaria e a controladora dos dados pedagogicos de seus alunos. O Planejei atua como operadora,
          processando os dados exclusivamente para apoiar planejamento, observacao e comunicacao pedagogica.
        </p>
        <p className="leading-relaxed">
          O uso da plataforma exige consentimento explicito no onboarding para tratamento de dados de menores, conforme
          art. 14 da LGPD (Lei 13.709/2018).
        </p>
        <p className="leading-relaxed">
          Ao excluir a conta, o sistema executa apagamento em cascata dos dados vinculados e mantem logs de auditoria
          por ate 2 anos para finalidades legais e de seguranca.
        </p>
      </article>
    </main>
  );
}
