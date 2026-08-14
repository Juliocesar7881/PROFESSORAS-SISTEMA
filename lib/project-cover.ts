const LEGACY_PROJECT_COVER_KEYS = [
  "sensory",
  "music",
  "light",
  "nature",
  "movement",
  "stories",
  "water",
  "wellbeing",
  "garden",
  "community",
  "animals",
  "art",
  "math",
  "science",
  "maker",
  "culture",
  "food",
] as const;

export type ProjectCoverKey = string;

const LEGACY_COVER_KEY_SET = new Set<string>(LEGACY_PROJECT_COVER_KEYS);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugifyProjectTitle(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function isProjectCoverKey(value?: string | null): value is ProjectCoverKey {
  return Boolean(value && /^[a-z0-9-]+$/.test(value));
}

function isLegacyProjectCoverKey(value?: string | null) {
  return Boolean(value && LEGACY_COVER_KEY_SET.has(value));
}

export function getFallbackProjectCoverKey(title: string, category = ""): ProjectCoverKey {
  const value = normalizeText(`${title} ${category}`);

  if (includesAny(value, ["sensor", "textura", "cesto", "cheiro", "tecidos"])) return "sensory";
  if (includesAny(value, ["luz", "sombra"])) return "light";
  if (includesAny(value, ["astronomia", "dinossauro", "fossil", "ciencia", "cientista", "descobertas"])) return "science";
  if (includesAny(value, ["emocao", "cuidado", "saude", "direito", "acolhimento", "bem-estar"])) return "wellbeing";
  if (includesAny(value, ["corpo", "movimento", "circuito", "equilibrio", "danca", "percurso motor"])) return "movement";
  if (includesAny(value, ["animal", "animais", "inseto", "abelha", "passaro", "aves", "oceano", "marinha", "biodiversidade"])) return "animals";
  if (includesAny(value, ["agua", "chuva", "clima", "tempo", "estacoes do ano"])) return "water";
  if (includesAny(value, ["horta", "planta", "semente", "polinizacao"])) return "garden";
  if (includesAny(value, ["musica", "ritmo", "som", "cantiga"])) return "music";
  if (includesAny(value, ["culinaria", "cozinha", "alimento", "sabores", "mercado de alimentos"])) return "food";
  if (includesAny(value, ["recic", "robo", "brinquedo", "construc", "ponte", "arquitetura", "inventado"])) return "maker";
  if (includesAny(value, ["matematica", "forma", "medida", "mapa", "tesouro", "jogo", "empreendedor"])) return "math";
  if (includesAny(value, ["cidade", "comunidade", "moradia", "transito", "mercado", "profissoes"])) return "community";
  if (includesAny(value, ["cultura", "brasil", "afro", "indigena", "identidade", "diversidade", "familias", "acessibilidade", "pertencimento", "museu"])) return "culture";
  if (includesAny(value, ["historia", "narrativa", "autor", "escrita", "jornal", "quadrinho", "carta", "teatro", "livro"])) return "stories";
  if (includesAny(value, ["arte", "cor", "atelie", "argila", "barro", "tecido", "fotografia"])) return "art";
  return "nature";
}

export function getProjectCoverKey(title: string, category = ""): ProjectCoverKey {
  return slugifyProjectTitle(title) || getFallbackProjectCoverKey(title, category);
}

export function resolveProjectCoverKey(
  title: string,
  category: string,
  storedKey?: string | null,
  useFallbackWhenMissing = false,
) {
  if (!storedKey && useFallbackWhenMissing) {
    return getFallbackProjectCoverKey(title, category);
  }

  const titleKey = getProjectCoverKey(title, category);

  if (!storedKey || isLegacyProjectCoverKey(storedKey)) {
    return titleKey;
  }

  return isProjectCoverKey(storedKey) ? storedKey : titleKey;
}

export function getProjectCoverPath(key: ProjectCoverKey) {
  return `/projects/covers/${key}.webp`;
}
