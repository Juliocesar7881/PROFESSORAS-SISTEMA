"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileUp, Heart, Layers3, PlayCircle, Search } from "lucide-react";

import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPaginatedPayload } from "@/lib/api-payload";
import { type EtapaTurma, inferEtapaTurma } from "@/lib/etapa";
import { getProjectCoverPath, resolveProjectCoverKey, type ProjectCoverKey } from "@/lib/project-cover";
import { SHOWCASE_PROJECTS, SHOWCASE_TOTAL, projectMatchesEtapa, type ShowcaseProject } from "@/lib/project-showcase";
import { cn } from "@/lib/utils";

type ApiProjeto = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  thumbnailKey?: string | null;
  origem?: "CATALOGO" | "IMPORTADO";
  salvo?: boolean;
  createdAt?: string;
  bnccObjetivos?: string[];
  atividadesCount?: number;
  atividades?: Array<{
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
  coverKey: ProjectCoverKey;
  atividades: Array<{
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    duracao: number;
    materiais: string[];
    bnccCodigos: string[];
  }>;
  atividadesCount: number;
  bnccObjetivos: string[];
  turmasIndicadas: string[];
  etapas: EtapaTurma[];
  origem: "catalogo" | "api" | "importado";
  salvo: boolean;
  createdAt?: string;
};

const ETAPA_LABELS: Record<EtapaTurma, string> = {
  BERCARIO: "Bercario",
  MATERNAL: "Maternal",
  JARDIM: "Jardim",
  PRE: "Pre-escola",
};

const ETAPA_FILTER_OPTIONS: ReadonlyArray<{ value: "TODAS" | EtapaTurma; label: string }> = [
  { value: "TODAS", label: "Todas as etapas" },
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
  "Musica",
  "Bem-estar",
  "Criatividade",
];

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
  if (!text) return null;
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
    coverKey: project.coverKey,
    atividades: project.atividades,
    atividadesCount: project.atividades.length,
    bnccObjetivos: project.bnccObjetivos,
    turmasIndicadas: project.turmasIndicadas,
    etapas: project.etapas,
    origem: "catalogo",
    salvo: false,
    createdAt: undefined,
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
    coverKey: resolveProjectCoverKey(
      project.titulo,
      project.categoria,
      project.thumbnailKey,
      project.origem === "IMPORTADO",
    ),
    atividades: (project.atividades ?? []).map((activity) => ({
      id: activity.id,
      titulo: activity.titulo,
      descricao: activity.descricao ?? "Atividade da proposta.",
      categoria: activity.categoria,
      duracao: activity.duracao,
      materiais: activity.materiais ?? [],
      bnccCodigos: activity.bnccCodigos ?? [],
    })),
    atividadesCount: project.atividadesCount ?? project.atividades?.length ?? 0,
    bnccObjetivos: project.bnccObjetivos ?? [],
    turmasIndicadas: etapas.length ? etapas.map((etapa) => ETAPA_LABELS[etapa]) : [project.faixaEtaria],
    etapas,
    origem: project.origem === "IMPORTADO" ? "importado" : "api",
    salvo: Boolean(project.salvo || project.salvosPor?.length),
    createdAt: project.createdAt,
  };
}

function mergeCatalogWithApi(apiProjects: ApiProjeto[]) {
  const merged = apiProjects.map(getCardFromApi);
  const byTitle = new Set(merged.map((project) => normalizeText(project.titulo)));

  for (const localProject of SHOWCASE_PROJECTS) {
    const key = normalizeText(localProject.titulo);
    if (!byTitle.has(key)) merged.push(getCardFromShowcase(localProject));
  }

  return merged;
}

function getApiProjects(data: unknown): ApiProjeto[] {
  return getPaginatedPayload<ApiProjeto>(data).items;
}

function getApiTotal(data: unknown, fallback: number) {
  return getPaginatedPayload<ApiProjeto>(data).total ?? fallback;
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<ProjetoCard[]>(() => SHOWCASE_PROJECTS.map(getCardFromShowcase));
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [etapa, setEtapa] = useState<"TODAS" | EtapaTurma>("TODAS");
  const [collection, setCollection] = useState<"todos" | "salvos" | "importados">("todos");
  const [loading, setLoading] = useState(true);
  const [usingCatalogFallback, setUsingCatalogFallback] = useState(false);
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const [totalProjetos, setTotalProjetos] = useState(SHOWCASE_TOTAL);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const responses = await Promise.all([
        fetch("/api/projetos?limit=80", { cache: "no-store" }),
        fetch("/api/projetos?salvos=true&limit=80", { cache: "no-store" }),
        fetch("/api/projetos?origem=IMPORTADO&limit=80", { cache: "no-store" }),
      ]);
      const payloads = await Promise.all(responses.map(async (response) => (
        parseJsonSafely<{ data?: ApiProjeto[] | { items: ApiProjeto[]; total?: number }; error?: { message?: string } }>(await response.text())
      )));
      const apiById = new Map<string, ApiProjeto>();
      [payloads[2], payloads[1], payloads[0]].forEach((payload) => {
        getApiProjects(payload?.data).forEach((project) => {
          if (!apiById.has(project.id)) apiById.set(project.id, project);
        });
      });
      const apiProjects = [...apiById.values()];

      if (responses.some((response) => response.ok) && apiProjects.length) {
        setProjetos(mergeCatalogWithApi(apiProjects));
        setTotalProjetos(getApiTotal(payloads[0]?.data, apiProjects.length));
        setUsingCatalogFallback(false);
        return;
      }

      setProjetos(SHOWCASE_PROJECTS.map(getCardFromShowcase));
      setTotalProjetos(SHOWCASE_TOTAL);
      setUsingCatalogFallback(true);
    } catch {
      setProjetos(SHOWCASE_PROJECTS.map(getCardFromShowcase));
      setTotalProjetos(SHOWCASE_TOTAL);
      setUsingCatalogFallback(true);
      toast.error("Exibindo catalogo local de projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleSaveProject = async (project: ProjetoCard) => {
    if (project.origem === "catalogo") {
      toast.info("Conecte o banco para salvar este projeto.");
      return;
    }

    setSavingProjectId(project.id);
    const response = await fetch("/api/projetos", {
      method: project.salvo ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projetoId: project.id }),
    });
    const payload = parseJsonSafely<{ error?: { message?: string } }>(await response.text());
    setSavingProjectId(null);

    if (!response.ok) {
      toast.error(payload?.error?.message ?? "Nao foi possivel atualizar favorito");
      return;
    }

    setProjetos((prev) => prev.map((item) => (item.id === project.id ? { ...item, salvo: !item.salvo } : item)));
  };

  const categoriasDisponiveis = useMemo(() => {
    const categories = Array.from(new Set(projetos.map((item) => item.categoria)));
    return ["TODAS", ...categories.sort((left, right) => categoryRank(left) - categoryRank(right) || left.localeCompare(right))];
  }, [projetos]);

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((project) => {
      if (collection === "salvos" && !project.salvo) return false;
      if (collection === "importados" && project.origem !== "importado") return false;
      if (categoria !== "TODAS" && categoryKey(project.categoria) !== categoryKey(categoria)) return false;
      if (etapa !== "TODAS" && !projectMatchesEtapa(project.faixaEtaria, etapa)) return false;
      if (!busca.trim()) return true;

      const normalizedSearch = normalizeText(busca);
      return (
        normalizeText(project.titulo).includes(normalizedSearch) ||
        normalizeText(project.descricao).includes(normalizedSearch) ||
        normalizeText(project.categoria).includes(normalizedSearch) ||
        project.atividades.some((activity) => normalizeText(activity.titulo).includes(normalizedSearch))
      );
    });
  }, [busca, categoria, collection, etapa, projetos]);

  const projetosOrdenados = useMemo(() => {
    return [...projetosFiltrados].sort((left, right) => {
      if (collection === "importados") {
        return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
      }
      const rankDiff = categoryRank(left.categoria) - categoryRank(right.categoria);
      if (rankDiff !== 0) return rankDiff;
      return left.titulo.localeCompare(right.titulo);
    });
  }, [collection, projetosFiltrados]);

  const savedCount = projetos.filter((project) => project.salvo).length;
  const importedCount = projetos.filter((project) => project.origem === "importado").length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <DashboardFilterBar
        title="Biblioteca de projetos"
        summary={
          <span>
            {projetosFiltrados.length} de {totalProjetos} projeto{totalProjetos !== 1 ? "s" : ""}
            <span className="mx-2 text-[#e5c4d3]">/</span>
            {etapa === "TODAS" ? "Todas as etapas" : ETAPA_LABELS[etapa]}
            {usingCatalogFallback ? (
              <>
                <span className="mx-2 text-[#e5c4d3]">/</span>
                Catalogo local
              </>
            ) : null}
          </span>
        }
        controlsClassName="lg:flex-wrap"
      >
        <ProjectImportDialog compact onCreated={() => { setCollection("importados"); void loadData(); }} />
        <div className="relative lg:w-[340px]">
          <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-[#a99ba5]" />
          <Input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="h-11 w-full rounded-xl border-2 border-[#e5c4d3] bg-white pl-10 text-sm font-bold text-[#312834] placeholder:text-[#a99ba5] focus:border-[#d8a4bb] focus:ring-2 focus:ring-[#f8dbe7]"
            placeholder="Buscar titulo, atividade ou tema..."
          />
        </div>

        <select
          className="h-11 w-full appearance-none rounded-xl border-2 border-[#e5c4d3] bg-white px-3.5 text-sm font-bold text-[#312834] focus:border-[#d8a4bb] focus:outline-none focus:ring-2 focus:ring-[#f8dbe7] lg:w-[220px]"
          value={etapa}
          onChange={(event) => setEtapa(event.target.value as "TODAS" | EtapaTurma)}
        >
          {ETAPA_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="h-11 w-full appearance-none rounded-xl border-2 border-[#e5c4d3] bg-white px-3.5 text-sm font-bold text-[#312834] focus:border-[#d8a4bb] focus:outline-none focus:ring-2 focus:ring-[#f8dbe7] lg:w-[180px]"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
        >
          {categoriasDisponiveis.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#e5c4d3] bg-white px-4 text-sm font-black text-[#a65f7f]">
          <Layers3 className="size-4" />
          {projetosFiltrados.length}
        </div>
      </DashboardFilterBar>

      <div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-[#eadde5] bg-white p-1 scrollbar-hide sm:w-fit">
        <button type="button" onClick={() => setCollection("todos")} className={cn("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition", collection === "todos" ? "bg-[#7d405d] text-white" : "text-[#74616d] hover:bg-[#f8eef3]")}>
          <Layers3 className="size-4" /> Todos
        </button>
        <button type="button" onClick={() => setCollection("salvos")} className={cn("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition", collection === "salvos" ? "bg-[#7d405d] text-white" : "text-[#74616d] hover:bg-[#f8eef3]")}>
          <Heart className="size-4" /> Projetos salvos <span className="opacity-70">{savedCount}</span>
        </button>
        <button type="button" onClick={() => setCollection("importados")} className={cn("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition", collection === "importados" ? "bg-[#7d405d] text-white" : "text-[#74616d] hover:bg-[#f8eef3]")}>
          <FileUp className="size-4" /> Projetos importados <span className="opacity-70">{importedCount}</span>
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border-2 border-[#f0e2e8] bg-white p-5 text-sm font-extrabold text-[#857582]">
          Carregando projetos...
        </div>
      )}

      {!loading && !projetosOrdenados.length && (
        <div className="rounded-2xl border-2 border-dashed border-[#e5c4d3] bg-white p-5 text-sm font-extrabold text-[#857582]">
          Nenhum projeto encontrado com os filtros atuais.
        </div>
      )}

      {!loading && projetosOrdenados.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projetosOrdenados.map((project) => {
            return (
              <article
                key={project.id}
                className="group relative overflow-hidden rounded-[1rem] border border-[#f0e2e8] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e5c4d3] hover:shadow-md"
              >
                <div className="relative aspect-[3/1.65] overflow-hidden bg-[#f4edf1]">
                  <Image
                    src={getProjectCoverPath(project.coverKey)}
                    alt={`Prévia do projeto ${project.titulo}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2f2330]/35 via-transparent to-white/5" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/75 bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#312834] shadow-sm backdrop-blur-sm">
                    {project.origem === "importado" ? "Meu projeto" : project.categoria}
                  </span>
                  {project.origem !== "importado" ? (
                    <button
                      type="button"
                      onClick={() => void toggleSaveProject(project)}
                      disabled={savingProjectId === project.id}
                      className={cn(
                        "absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-xl border border-white/75 bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60",
                        project.salvo ? "text-[#a65f7f]" : "text-[#312834]",
                      )}
                      aria-label={project.salvo ? "Remover dos favoritos" : "Salvar projeto"}
                    >
                      <Heart className={cn("size-4", project.salvo && "fill-current")} />
                    </button>
                  ) : null}
                </div>

                <div className="space-y-2.5 p-3.5">
                  <div>
                    <h3 className="line-clamp-2 font-heading text-lg leading-tight text-[#312834]">{project.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#857582]">{project.descricao}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[#e5c4d3] bg-[#fff3f7] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#a65f7f]">
                      {project.faixaEtaria}
                    </span>
                    <span className="rounded-full border border-[#e5c4d3] bg-[#fff3f7] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#a65f7f]">
                      {project.duracao}
                    </span>
                    <span className="rounded-full border border-[#e5c4d3] bg-[#fff3f7] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#a65f7f]">
                      {project.atividadesCount} atividades
                    </span>
                  </div>

                  <p className="line-clamp-1 text-xs font-bold uppercase tracking-[0.1em] text-[#857582]">
                    Etapas: {project.turmasIndicadas.join(" / ")}
                  </p>

                  <Link
                    href={`/dashboard/projetos/${project.id}`}
                    className={buttonVariants({
                      className: "h-10 w-full rounded-xl bg-[#a65f7f] text-sm font-black text-white transition hover:bg-[#8b4e6a]",
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
      )}
    </div>
  );
}
