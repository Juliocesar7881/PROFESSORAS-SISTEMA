export default function TermosPage() {
  return (
    <main className="mesh-bg soft-grid min-h-screen px-6 py-10 text-[#4E4770]">
      <article className="glass-card mx-auto max-w-3xl space-y-4 rounded-3xl border border-[#DCECF8] p-8">
        <h1 className="font-heading text-4xl text-[#1E1740]">Termos de Uso</h1>
        <p>
          A professora usuaria e a controladora dos dados pedagogicos de seus alunos. O Planejei atua como operadora,
          processando os dados exclusivamente para apoiar planejamento, observacao e comunicacao pedagogica.
        </p>
        <p>
          O uso da plataforma exige consentimento explicito no onboarding para tratamento de dados de menores, conforme
          art. 14 da LGPD (Lei 13.709/2018).
        </p>
        <p>
          Ao excluir a conta, o sistema executa apagamento em cascata dos dados vinculados e mantem logs de auditoria
          por ate 2 anos para finalidades legais e de seguranca.
        </p>
      </article>
    </main>
  );
}
