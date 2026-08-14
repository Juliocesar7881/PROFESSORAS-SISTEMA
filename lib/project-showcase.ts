import type { EtapaTurma } from "@/lib/etapa";
import type { ProjectCoverKey } from "@/lib/project-cover";
import { PROJECT_CATALOG } from "@/lib/project-catalog";

const ETAPA_HINTS: Record<EtapaTurma, string[]> = {
  BERCARIO: ["bercario", "lactario", "0 a 1", "0 a 2", "1 a 2"],
  MATERNAL: ["maternal", "2 a 3", "3 a 4", "2-3", "3-4"],
  JARDIM: ["jardim", "4 a 5", "4-5"],
  PRE: ["pre", "pre-escola", "pre escola", "5 a 6", "5-6"],
};

const ETAPA_LABELS: Record<EtapaTurma, string> = {
  BERCARIO: "Bercario",
  MATERNAL: "Maternal",
  JARDIM: "Jardim",
  PRE: "Pre-escola",
};

export type ShowcaseProject = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  coverKey: ProjectCoverKey;
  bnccObjetivos: string[];
  problema: string;
  justificativa: string;
  objetivoGeral: string;
  objetivosEspecificos: string[];
  camposExperiencia: string[];
  metodologia: string[];
  cronograma: string;
  avaliacao: string[];
  premiumBloqueado: boolean;
  turmasIndicadas: string[];
  etapas: EtapaTurma[];
  origem: "catalogo";
  atividades: Array<{
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    duracao: number;
    materiais: string[];
    bnccCodigos: string[];
  }>;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function inferEtapasFromFaixa(faixaEtaria: string) {
  const normalized = normalizeText(faixaEtaria);
  const etapas = (Object.keys(ETAPA_HINTS) as EtapaTurma[]).filter((etapa) =>
    ETAPA_HINTS[etapa].some((hint) => normalized.includes(hint)),
  );

  return etapas;
}

export function projectMatchesEtapa(faixaEtaria: string, etapa: EtapaTurma) {
  return inferEtapasFromFaixa(faixaEtaria).includes(etapa);
}

function mapCatalogToShowcaseProject(
  project: (typeof PROJECT_CATALOG)[number],
  index: number,
): ShowcaseProject {
  const numericPrefix = String(index + 1).padStart(3, "0");
  const slug = slugify(project.titulo);
  const projectId = `catalogo-${numericPrefix}-${slug}`;
  const etapas = inferEtapasFromFaixa(project.faixaEtaria);

  return {
    id: projectId,
    titulo: project.titulo,
    descricao: project.descricao,
    categoria: project.categoria,
    faixaEtaria: project.faixaEtaria,
    duracao: project.duracao,
    coverKey: project.coverKey,
    bnccObjetivos: project.bnccObjetivos,
    problema: project.problema,
    justificativa: project.justificativa,
    objetivoGeral: project.objetivoGeral,
    objetivosEspecificos: project.objetivosEspecificos,
    camposExperiencia: project.camposExperiencia,
    metodologia: project.metodologia,
    cronograma: project.cronograma,
    avaliacao: project.avaliacao,
    premiumBloqueado: false,
    turmasIndicadas: etapas.length ? etapas.map((etapa) => ETAPA_LABELS[etapa]) : [project.faixaEtaria],
    etapas,
    origem: "catalogo",
    atividades: project.atividades.map((atividade, activityIndex) => ({
      id: `${projectId}-atv-${String(activityIndex + 1).padStart(2, "0")}`,
      titulo: atividade.titulo,
      descricao: atividade.descricao,
      categoria: atividade.categoria,
      duracao: atividade.duracao,
      materiais: atividade.materiais,
      bnccCodigos: atividade.bnccCodigos,
    })),
  };
}

export const SHOWCASE_PROJECTS: ShowcaseProject[] = PROJECT_CATALOG.map(mapCatalogToShowcaseProject);

const SHOWCASE_BY_ID = new Map(SHOWCASE_PROJECTS.map((project) => [project.id, project]));

export const SHOWCASE_TOTAL = SHOWCASE_PROJECTS.length;

export function getShowcaseProjectById(projectId: string) {
  return SHOWCASE_BY_ID.get(projectId) ?? null;
}
