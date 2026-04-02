export default function OfflinePage() {
  return (
    <main className="mesh-bg soft-grid min-h-screen px-6 py-16 text-foreground">
      <section className="glass-card mx-auto max-w-xl rounded-3xl border-none p-8 text-center shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-100">Modo offline</span>
        <h1 className="mt-3 font-heading text-4xl text-slate-900">Sem conexão no momento</h1>
        <p className="mt-4 text-slate-600">
          O Planejei continua disponível para consulta local. Assim que a internet voltar,
          os dados pendentes serão sincronizados automaticamente.
        </p>
      </section>
    </main>
  );
}
