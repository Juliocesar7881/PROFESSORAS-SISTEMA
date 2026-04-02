export default function OfflinePage() {
  return (
    <main className="mesh-bg soft-grid min-h-screen px-6 py-16 text-foreground">
      <section className="glass-card mx-auto max-w-xl rounded-3xl border border-[#DCECF8] p-8 text-center">
        <h1 className="font-heading text-4xl text-[#1E1740]">Sem conexão no momento</h1>
        <p className="mt-4 text-[#5E5783]">
          O Planejei continua disponível para consulta local. Assim que a internet voltar,
          os dados pendentes serão sincronizados automaticamente.
        </p>
      </section>
    </main>
  );
}
