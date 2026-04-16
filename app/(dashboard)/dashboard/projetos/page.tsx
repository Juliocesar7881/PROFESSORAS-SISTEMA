"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Filter, PlayCircle, Search, Sparkles, Tv2, UsersRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type EtapaTurma, inferEtapaTurma } from "@/lib/etapa";
import { SHOWCASE_PROJECTS, SHOWCASE_TOTAL, projectMatchesEtapa, type ShowcaseProject } from "@/lib/project-showcase";
import { cn } from "@/lib/utils";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
};

type ApiProjeto = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  bnccObjetivos?: string[];
  atividades: Array<{
    id: string;
    titulo: string;
    descricao?: string;
    categoria: string;
    duracao: number;
    materiais?: string[];
    bnccCodigos?: string[];
  }>;
  salvosPor?: Array<{ userId: string }>;
};

type ProjetoCard = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  atividades: Array<{
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    duracao: number;
    materiais: string[];
    bnccCodigos: string[];
  }>;
  bnccObjetivos: string[];
  turmasIndicadas: string[];
  etapas: EtapaTurma[];
  origem: "catalogo" | "api";
};

const ETAPA_LABELS: Record<EtapaTurma, string> = {
  BERCARIO: "Bercario",
  MATERNAL: "Maternal",
  JARDIM: "Jardim",
  PRE: "Pre-escola",
};

const ETAPA_FILTER_OPTIONS: ReadonlyArray<{ value: EtapaTurma; label: string }> = [
  { value: "BERCARIO", label: "Bercario" },
  { value: "MATERNAL", label: "Maternal" },
  { value: "JARDIM", label: "Jardim" },
  { value: "PRE", label: "Pre-escola" },
];

const CATEGORY_ORDER = [
  "Natureza",
  "Linguagem",
  "Matematica",
  "Corpo",
  "Arte",
  "Sociedade",
];

const categoryCoverGradient: Record<string, string> = {
  natureza: "from-emerald-500 via-teal-500 to-cyan-500",
  linguagem: "from-amber-500 via-orange-500 to-yellow-500",
  matematica: "from-blue-500 via-sky-500 to-indigo-500",
  corpo: "from-rose-500 via-pink-500 to-orange-500",
  arte: "from-fuchsia-500 via-pink-500 to-rose-500",
  sociedade: "from-cyan-500 via-teal-500 to-emerald-500",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryKey(value: string) {
  return normalizeText(value);
}

function categoryRank(value: string) {
  const index = CATEGORY_ORDER.findIndex((item) => normalizeText(item) === categoryKey(value));
  return index === -1 ? CATEGORY_ORDER.length + 1 : index;
}

function parseJsonSafely<T>(text: string): T | null {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getCardFromShowcase(project: ShowcaseProject): ProjetoCard {
  return {
    id: project.id,
    titulo: project.titulo,
    descricao: project.descricao,
    categoria: project.categoria,
    faixaEtaria: project.faixaEtaria,
    duracao: project.duracao,
    atividades: project.atividades,
    bnccObjetivos: project.bnccObjetivos,
    turmasIndicadas: project.turmasIndicadas,
    etapas: project.etapas,
    origem: "catalogo",
  };
}

function getCardFromApi(project: ApiProjeto): ProjetoCard {
  const etapaInferida = inferEtapaTurma(project.faixaEtaria);
  const etapas = etapaInferida ? [etapaInferida] : [];

  return {
    id: project.id,
    titulo: project.titulo,
    descricao: project.descricao,
    categoria: project.categoria,
    faixaEtaria: project.faixaEtaria,
    duracao: project.duracao,
    atividades: project.atividades.map((activity) => ({
      id: activity.id,
      titulo: activity.titulo,
      descricao: activity.descricao ?? "Atividade da proposta.",
      categoria: activity.categoria,
      duracao: activity.duracao,
      materiais: activity.materiais ?? [],
      bnccCodigos: activity.bnccCodigos ?? [],
    })),
    bnccObjetivos: project.bnccObjetivos ?? [],
    turmasIndicadas: etapas.length ? etapas.map((etapa) => ETAPA_LABELS[etapa]) : [project.faixaEtaria],
    etapas,
    origem: "api",
  };
}

function mergeCatalogWithApi(apiProjects: ApiProjeto[]) {
  const merged = SHOWCASE_PROJECTS.map(getCardFromShowcase);
  const byTitle = new Map(merged.map((project) => [normalizeText(project.titulo), project]));

  for (const apiProject of apiProjects) {
    const key = normalizeText(apiProject.titulo);
    const existing = byTitle.get(key);

    if (existing) {
      continue;
    }

    merged.push(getCardFromApi(apiProject));
  }

  return merged;
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<ProjetoCard[]>(() => SHOWCASE_PROJECTS.map(getCardFromShowcase));
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [turmaId, setTurmaId] = useState("TODAS");
  const [loading, setLoading] = useState(true);
  const [usingCatalogFallback, setUsingCatalogFallback] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [turmasResponse, projetosResponse] = await Promise.allSettled([
        fetch("/api/turmas", { cache: "no-store" }),
        fetch("/api/projetos", { cache: "no-store" }),
      ]);

      if (turmasResponse.status === "fulfilled") {
        const turmasPayload = parseJsonSafely<{ data?: Turma[]; error?: { message?: string } }>(
          await turmasResponse.value.text(),
        );

        if (turmasResponse.value.ok) {
          setTurmas(turmasPayload?.data ?? []);
        }
      }

      if (projetosResponse.status === "fulfilled") {
        const projetosPayload = parseJsonSafely<{ data?: ApiProjeto[]; error?: { message?: string } }>(
          await projetosResponse.value.text(),
        );

        if (projetosResponse.value.ok && Array.isArray(projetosPayload?.data) && projetosPayload.data.length) {
          setProjetos(mergeCatalogWithApi(projetosPayload.data));
          setUsingCatalogFallback(false);
          setLoading(false);
          return;
        }
      }

      setProjetos(SHOWCASE_PROJECTS.map(getCardFromShowcase));
      setUsingCatalogFallback(true);
    } catch {
      setProjetos(SHOWCASE_PROJECTS.map(getCardFromShowcase));
      setUsingCatalogFallback(true);
      toast.error("Exibindo catalogo local de projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const turmaOptions = useMemo(() => {
    if (turmas.length) {
      return turmas.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        faixaEtaria: turma.faixaEtaria,
      }));
    }

    return ETAPA_FILTER_OPTIONS.map((option) => ({
      id: `etapa:${option.value}`,
      nome: option.label,
      faixaEtaria: option.label,
    }));
  }, [turmas]);

  const etapaSelecionada = useMemo(() => {
    if (turmaId === "TODAS") {
      return null;
    }

    if (turmaId.startsWith("etapa:")) {
      return turmaId.replace("etapa:", "") as EtapaTurma;
    }

    const turma = turmas.find((item) => item.id === turmaId);
    return turma ? inferEtapaTurma(turma.faixaEtaria) : null;
  }, [turmaId, turmas]);

  const categoriasDisponiveis = useMemo(() => {
    const categories = Array.from(new Set(projetos.map((item) => item.categoria)));
    return ["TODAS", ...categories.sort((left, right) => categoryRank(left) - categoryRank(right) || left.localeCompare(right))];
  }, [projetos]);

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((project) => {
      if (categoria !== "TODAS" && categoryKey(project.categoria) !== categoryKey(categoria)) {
        return false;
      }

      if (etapaSelecionada && !projectMatchesEtapa(project.faixaEtaria, etapaSelecionada)) {
        return false;
      }

      if (!busca.trim()) {
        return true;
      }

      const normalizedSearch = normalizeText(busca);

      return (
        normalizeText(project.titulo).includes(normalizedSearch) ||
        normalizeText(project.descricao).includes(normalizedSearch) ||
        normalizeText(project.categoria).includes(normalizedSearch) ||
        project.atividades.some((activity) => normalizeText(activity.titulo).includes(normalizedSearch))
      );
    });
  }, [busca, categoria, etapaSelecionada, projetos]);

  const rowsByCategory = useMemo(() => {
    const groups = new Map<string, ProjetoCard[]>();

    for (const project of projetosFiltrados) {
      const key = project.categoria;
      const bucket = groups.get(key);

      if (bucket) {
        bucket.push(project);
      } else {
        groups.set(key, [project]);
      }
    }

    return Array.from(groups.entries()).sort((left, right) => {
      const rankDiff = categoryRank(left[0]) - categoryRank(right[0]);
      if (rankDiff !== 0) {
        return rankDiff;
      }

      return left[0].localeCompare(right[0]);
    });
  }, [projetosFiltrados]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-7 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.35),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.22),transparent_40%)]" />

        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/90">
            <Tv2 className="size-3.5" />
            Catalogo de Projetos
          </span>

          <h1 className="font-heading text-4xl tracking-tight text-white md:text-5xl">
            Selecione e reproduza ideias
            <span className="block text-sky-300">em estilo streaming</span>
          </h1>

          <p className="max-w-3xl text-sm font-semibold text-slate-200 md:text-base">
            Biblioteca com {SHOWCASE_TOTAL} projetos completos, todos com atividades, filtros por turma e categoria, e pagina detalhada.
          </p>

          {usingCatalogFallback && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-200">
              <Sparkles className="size-3.5" />
              Exibindo catalogo local completo
            </p>
          )}
        </div>
      </section>

      <Card className="rounded-3xl border-sky-100/80 bg-white shadow-sm">
        <CardContent className="space-y-4 pt-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-[#86a0b8]" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-11 w-full rounded-xl border-sky-100 bg-white pl-10 text-sm font-bold text-[#2c4359] placeholder:text-[#9bb0c2] focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              placeholder="Busque por titulo, atividade ou tema..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
            <select
              className="h-11 w-full appearance-none rounded-xl border border-sky-100 bg-white px-3.5 text-sm font-bold text-[#2c4359] focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={turmaId}
              onChange={(event) => setTurmaId(event.target.value)}
            >
              <option value="TODAS">Todas as turmas</option>
              {turmaOptions.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome} ({turma.faixaEtaria})
                </option>
              ))}
            </select>

            <select
              className="h-11 w-full appearance-none rounded-xl border border-sky-100 bg-white px-3.5 text-sm font-bold text-[#2c4359] focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            >
              {categoriasDisponiveis.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-black text-sky-700">
              <UsersRound className="size-4" />
              {projetosFiltrados.length} de {SHOWCASE_TOTAL} projetos
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#6f88a2]">
            <Filter className="size-3.5" />
            {etapaSelecionada ? `Filtrando por etapa: ${ETAPA_LABELS[etapaSelecionada]}` : "Filtrando por todas as etapas"}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-2xl border border-sky-100 bg-white p-5 text-sm font-semibold text-[#6f88a2]">
          Montando prateleiras de projetos...
        </div>
      )}

      {!loading && !rowsByCategory.length && (
        <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-5 text-sm font-semibold text-[#6f88a2]">
          Nenhum projeto encontrado com os filtros atuais.
        </div>
      )}

      {!loading && rowsByCategory.length > 0 && (
        <div className="space-y-6">
          {rowsByCategory.map(([category, projects]) => (
            <section key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl text-[#223246]">{category}</h2>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-sky-700">
                  {projects.length} titulo{projects.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-1">
                {projects.map((project) => {
                  const catKey = categoryKey(project.categoria);
                  const cover = categoryCoverGradient[catKey] ?? "from-sky-500 via-cyan-500 to-teal-500";

                  return (
                    <article
                      key={project.id}
                      className="group relative min-w-[280px] max-w-[280px] overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className={cn("relative h-36 bg-gradient-to-br", cover)}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.45),transparent_45%)]" />
                        <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#294662]">
                          {project.categoria}
                        </span>

                      </div>

                      <div className="space-y-3 p-4">
                        <div>
                          <h3 className="line-clamp-2 font-heading text-2xl leading-tight text-[#223246]">{project.titulo}</h3>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#5f7790]">{project.descricao}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-sky-700">
                            {project.faixaEtaria}
                          </span>
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-teal-700">
                            {project.duracao}
                          </span>
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">
                            {project.atividades.length} atividades
                          </span>
                        </div>

                        <p className="line-clamp-1 text-xs font-bold uppercase tracking-[0.1em] text-[#6f88a2]">
                          Turmas: {project.turmasIndicadas.join(" / ")}
                        </p>

                        <Link
                          href={`/dashboard/projetos/${project.id}`}
                          className={buttonVariants({
                            className:
                              "h-10 w-full rounded-xl bg-sky-500 text-sm font-black text-white transition hover:bg-sky-600",
                          })}
                        >
                          <PlayCircle className="mr-2 size-4" />
                          Abrir projeto
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
