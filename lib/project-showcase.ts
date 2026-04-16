import type { EtapaTurma } from "@/lib/etapa";
import { PROJECT_CATALOG } from "@/lib/project-catalog";

const TARGET_SHOWCASE_SIZE = 1000;

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

const THEME_VARIATIONS = [
  "Territorio e pertencimento",
  "Narrativas em movimento",
  "Exploracoes com natureza",
  "Descobertas matematicas",
  "Corpo e expressao",
  "Arte no cotidiano",
  "Experimentos investigativos",
  "Convivencia e cuidado",
  "Linguagem e imaginacao",
  "Cultura e identidade",
  "Musica e ritmo",
  "Brincar e criar",
  "Projetos autorais",
  "Curiosidade cientifica",
  "Ecologia na pratica",
  "Expressao oral",
  "Jogos cooperativos",
  "Leitura de mundo",
  "Tecnicas criativas",
  "Rotinas investigativas",
];

const CATEGORY_VARIATIONS = [
  "Natureza",
  "Linguagem",
  "Matematica",
  "Corpo",
  "Arte",
  "Sociedade",
  "Criatividade",
  "Musicalizacao",
  "Social",
  "Bem-estar",
];

const FAIXA_VARIATIONS = [
  "Bercario",
  "Maternal",
  "Jardim",
  "Pre-escola",
  "Maternal e Jardim",
  "Jardim e Pre-escola",
  "Maternal II",
  "Jardim II",
  "Pre I",
  "Pre II",
];

const DURATION_VARIATIONS = ["2 semanas", "3 semanas", "4 semanas", "5 semanas", "6 semanas", "8 semanas"];

const MATERIAL_POOL = [
  "papel kraft",
  "cartolina",
  "lapis de cor",
  "tinta guache",
  "cola",
  "tesoura sem ponta",
  "sucata limpa",
  "massinha",
  "argila",
  "corda",
  "arcos",
  "caixa de som",
  "livros ilustrados",
  "objetos naturais",
  "fitas coloridas",
  "blocos de montar",
  "prancheta",
  "adesivos",
  "fantoches",
  "tecidos leves",
];

const BNCC_POOL = [
  "EI01EO01",
  "EI01CG02",
  "EI01EF01",
  "EI02ET02",
  "EI02EF03",
  "EI02TS01",
  "EI02CG03",
  "EI03ET02",
  "EI03EF01",
  "EI03TS02",
  "EI03EO03",
  "EI03ET07",
  "EI03EF05",
  "EI03CG02",
  "EI03EO05",
  "EI03TS03",
  "EI03ET08",
  "EI03EF04",
  "EI03EO06",
  "EI02EO04",
];

const ACTIVITY_MOMENTS = [
  "Roda de abertura",
  "Desafio investigativo",
  "Atelie de criacao",
  "Registro coletivo",
  "Vivencia externa",
  "Jogo colaborativo",
  "Experiencia sensorial",
  "Sintese da semana",
];

export type ShowcaseProject = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  bnccObjetivos: string[];
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

function pickFromPool(pool: string[], seed: number, size: number) {
  const values: string[] = [];
  for (let index = 0; index < size; index += 1) {
    values.push(pool[(seed + index) % pool.length]);
  }
  return values;
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
    bnccObjetivos: project.bnccObjetivos,
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

function buildSyntheticProject(reference: ShowcaseProject, index: number): ShowcaseProject {
  const edition = Math.floor(index / 24) + 1;
  const theme = THEME_VARIATIONS[index % THEME_VARIATIONS.length];
  const categoria = CATEGORY_VARIATIONS[index % CATEGORY_VARIATIONS.length];
  const faixaEtaria = FAIXA_VARIATIONS[index % FAIXA_VARIATIONS.length];
  const duracao = DURATION_VARIATIONS[index % DURATION_VARIATIONS.length];
  const projectTitle = `${reference.titulo} - ${theme} ${edition}`;
  const projectSlug = slugify(projectTitle).slice(0, 48);
  const projectId = `catalogo-plus-${String(index + 1).padStart(4, "0")}-${projectSlug}`;
  const etapas = inferEtapasFromFaixa(faixaEtaria);
  const totalActivities = 4 + (index % 2);

  const atividades = Array.from({ length: totalActivities }).map((_, activityIndex) => {
    const seed = index * 11 + activityIndex * 7;
    const activityMoment = ACTIVITY_MOMENTS[(activityIndex + index) % ACTIVITY_MOMENTS.length];

    return {
      id: `${projectId}-atv-${String(activityIndex + 1).padStart(2, "0")}`,
      titulo: `${activityMoment}: ${theme}`,
      descricao: `Atividade ${activityIndex + 1} com foco em ${theme.toLowerCase()} para ${faixaEtaria.toLowerCase()}.`,
      categoria,
      duracao: 20 + ((seed % 5) + 1) * 5,
      materiais: pickFromPool(MATERIAL_POOL, seed, 4),
      bnccCodigos: pickFromPool(BNCC_POOL, seed, 2),
    };
  });

  return {
    id: projectId,
    titulo: projectTitle,
    descricao: `Projeto completo orientado por ${theme.toLowerCase()}, com trilha semanal e praticas em ${categoria.toLowerCase()}.`,
    categoria,
    faixaEtaria,
    duracao,
    bnccObjetivos: [
      `Investigar ${theme.toLowerCase()} em experiencias colaborativas.`,
      `Produzir registros e socializar descobertas em situacoes de ${categoria.toLowerCase()}.`,
      ...reference.bnccObjetivos.slice(0, 1),
    ],
    premiumBloqueado: false,
    turmasIndicadas: etapas.length ? etapas.map((etapa) => ETAPA_LABELS[etapa]) : [faixaEtaria],
    etapas,
    origem: "catalogo",
    atividades,
  };
}

const BASE_SHOWCASE_PROJECTS = PROJECT_CATALOG.map(mapCatalogToShowcaseProject);

const SYNTHETIC_SHOWCASE_PROJECTS = Array.from({
  length: Math.max(0, TARGET_SHOWCASE_SIZE - BASE_SHOWCASE_PROJECTS.length),
}).map((_, index) => buildSyntheticProject(BASE_SHOWCASE_PROJECTS[index % BASE_SHOWCASE_PROJECTS.length], index));

export const SHOWCASE_PROJECTS: ShowcaseProject[] = [...BASE_SHOWCASE_PROJECTS, ...SYNTHETIC_SHOWCASE_PROJECTS];

const SHOWCASE_BY_ID = new Map(SHOWCASE_PROJECTS.map((project) => [project.id, project]));

export const SHOWCASE_TOTAL = SHOWCASE_PROJECTS.length;

export function getShowcaseProjectById(projectId: string) {
  return SHOWCASE_BY_ID.get(projectId) ?? null;
}
