import Link from "next/link";
import {
  BookOpenText,
  ClipboardList,
  Leaf,
  Package,
  Target,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getShowcaseProjectById } from "@/lib/project-showcase";

export default async function ProjetoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projeto = getShowcaseProjectById(id);

  if (!projeto) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
        <p>Projeto nao encontrado neste catalogo.</p>
        <Link
          href="/dashboard/projetos"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100"
        >
          Voltar para projetos
        </Link>
      </div>
    );
  }

  const materiaisUnicos = Array.from(
    new Set(
      projeto.atividades
        .flatMap((atividade) => atividade.materiais)
        .map((material) => material.trim())
        .filter(Boolean),
    ),
  );

  const codigosBncc = Array.from(
    new Set(
      projeto.atividades
        .flatMap((atividade) => atividade.bnccCodigos)
        .concat(projeto.bnccObjetivos)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card className="pf-card rounded-3xl border-sky-100/80 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pf-chip border-sky-200 bg-sky-50 text-sky-700">{projeto.categoria}</span>
            <span className="pf-chip border-teal-200 bg-teal-50 text-teal-700">{projeto.faixaEtaria}</span>
            <span className="pf-chip border-amber-200 bg-amber-50 text-amber-700">
              <Timer className="size-3.5" />
              {projeto.duracao}
            </span>
          </div>
          <CardTitle className="font-heading text-4xl text-[#223246]">{projeto.titulo}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm font-semibold text-[#4d6780]">
          <p>{projeto.descricao}</p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6f88a2]">Objetivos</p>
              <p className="mt-1 font-heading text-3xl text-[#223246]">{projeto.bnccObjetivos.length}</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6f88a2]">Materiais</p>
              <p className="mt-1 font-heading text-3xl text-[#223246]">{materiaisUnicos.length}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6f88a2]">Passos</p>
              <p className="mt-1 font-heading text-3xl text-[#223246]">{projeto.atividades.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <details open className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <summary className="cursor-pointer list-none px-4 py-3">
            <p className="font-heading text-2xl leading-none text-[#223246]">Objetivos</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#86a0b8]">O que a crianca deve desenvolver</p>
          </summary>
          <div className="border-t border-sky-100 px-4 py-4">
            <ul className="space-y-2 text-sm font-semibold text-[#4d6780]">
              {projeto.bnccObjetivos.length ? (
                projeto.bnccObjetivos.map((objetivo) => (
                  <li key={objetivo} className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                    <span className="inline-flex items-center gap-2 text-[#2e516f]">
                      <Target className="size-4 text-sky-600" />
                      {objetivo}
                    </span>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-3">Sem objetivos cadastrados.</li>
              )}
            </ul>
          </div>
        </details>

        <details className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <summary className="cursor-pointer list-none px-4 py-3">
            <p className="font-heading text-2xl leading-none text-[#223246]">Materiais</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#86a0b8]">Tudo que precisa para executar</p>
          </summary>
          <div className="border-t border-sky-100 px-4 py-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {materiaisUnicos.length ? (
                materiaisUnicos.map((material) => (
                  <li key={material} className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-sm font-semibold text-[#386b63]">
                    <span className="inline-flex items-center gap-2">
                      <Package className="size-4 text-teal-600" />
                      {material}
                    </span>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-3 text-sm font-semibold text-[#6f88a2]">Sem materiais listados.</li>
              )}
            </ul>
          </div>
        </details>

        <details className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <summary className="cursor-pointer list-none px-4 py-3">
            <p className="font-heading text-2xl leading-none text-[#223246]">Campos de Experiencia (BNCC)</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#86a0b8]">Referencias curriculares do projeto</p>
          </summary>
          <div className="border-t border-sky-100 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {codigosBncc.length ? (
                codigosBncc.map((codigo) => (
                  <span key={codigo} className="pf-chip border-rose-200 bg-rose-50 text-rose-700">
                    <Leaf className="size-3.5" />
                    {codigo}
                  </span>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-rose-200 bg-rose-50/40 p-3 text-sm font-semibold text-[#6f88a2]">Sem codigos informados.</p>
              )}
            </div>
          </div>
        </details>

        <details open className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <summary className="cursor-pointer list-none px-4 py-3">
            <p className="font-heading text-2xl leading-none text-[#223246]">Passo a Passo</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#86a0b8]">Sequencia de atividades da proposta</p>
          </summary>
          <div className="border-t border-sky-100 px-4 py-4">
            <div className="space-y-2">
              {projeto.atividades.length ? (
                projeto.atividades.map((atividade, index) => (
                  <article key={atividade.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-heading text-xl text-[#223246]">
                        {index + 1}. {atividade.titulo}
                      </p>
                      <span className="pf-chip border-amber-200 bg-amber-50 text-amber-700">
                        <Timer className="size-3.5" />
                        {atividade.duracao} min
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#4d6780]">{atividade.descricao}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6f88a2]">{atividade.categoria}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-3 text-sm font-semibold text-[#6f88a2]">Projeto sem atividades cadastradas.</p>
              )}
            </div>
          </div>
        </details>
      </section>

      <Link
        href="/dashboard/planejamento"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 px-6 text-sm font-black text-white transition hover:from-sky-600 hover:to-teal-600"
      >
        <BookOpenText className="mr-2 size-4" />
        Usar no planejamento da semana
      </Link>

      <p className="inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#6f88a2]">
        <ClipboardList className="size-3.5" />
        Dica: abra apenas a secao necessaria para manter a tela limpa.
      </p>
    </div>
  );
}
