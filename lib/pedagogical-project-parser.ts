import { z } from "zod";

import {
  projetoImportadoDraftSchema,
  type ProjetoImportadoDraft,
} from "@/dtos/projeto.dto";

type SectionKey =
  | "titulo"
  | "problema"
  | "justificativa"
  | "objetivoGeral"
  | "objetivosEspecificos"
  | "camposExperiencia"
  | "metodologia"
  | "cronograma"
  | "avaliacao";

const SECTION_PATTERNS: Array<[SectionKey, RegExp]> = [
  ["titulo", /^projeto(?:\s+pedag[oó]gico)?(?:\s*[:\-]\s*(.*)|\s*)$/i],
  ["problema", /^(?:problema|quest[aã]o\s+norteadora)(?:\s*[:\-]\s*(.*)|\s*)$/i],
  ["justificativa", /^justificativa(?:\s*[:\-]\s*(.*)|\s*)$/i],
  ["objetivoGeral", /^objetivo\s+geral(?:\s*[:\-]\s*(.*)|\s*)$/i],
  [
    "objetivosEspecificos",
    /^objetivos?(?:\s+de)?\s+(?:espec[ií]ficos?|aprendizagem|desenvolvimento)(?:\s*[:\-]\s*(.*)|\s*)$/i,
  ],
  ["camposExperiencia", /^campos?\s+de\s+experi?[eê]ncias?(?:\s*[:\-]\s*(.*)|\s*)$/i],
  ["metodologia", /^(?:metodologia|desenvolvimento|propostas?|viv[eê]ncias?)(?:\s*[:\-]\s*(.*)|\s*)$/i],
  ["cronograma", /^(?:cronograma|per[ií]odo|dura[cç][aã]o)(?:\s*[:\-]\s*(.*)|\s*)$/i],
  ["avaliacao", /^avalia[cç][aã]o(?:\s*[:\-]\s*(.*)|\s*)$/i],
];

const GOOGLE_SCHEMA_KEYS = new Set(["type", "properties", "required", "items", "description"]);

function cleanJsonSchema(value: unknown, propertyMap = false): unknown {
  if (Array.isArray(value)) return value.map((item) => cleanJsonSchema(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => propertyMap || GOOGLE_SCHEMA_KEYS.has(key))
      .map(([key, item]) => [key, cleanJsonSchema(item, key === "properties")]),
  );
}

export const projetoImportadoJsonSchema = cleanJsonSchema(
  z.toJSONSchema(projetoImportadoDraftSchema),
);

function cleanLine(value: string) {
  return value
    .replace(/^[\s*•·▪◦‣⁃\-–—]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(lines: string[]) {
  return lines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function listFromSection(lines: string[]) {
  return compactText(lines)
    .split(/\n\s*\n|\n(?=[*•·▪◦‣⁃\-–—])/)
    .map(cleanLine)
    .filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function comparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MATCH_STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos",
  "o", "os", "para", "por", "que", "se", "um", "uma", "uns", "umas",
]);

const EXPERIENCE_FIELDS = [
  "O eu, o outro e o nós",
  "Corpo, gestos e movimentos",
  "Traços, sons, cores e formas",
  "Escuta, fala, pensamento e imaginação",
  "Espaços, tempos, quantidades, relações e transformações",
];

function meaningfulTokens(value: string) {
  return new Set(
    comparable(value)
      .split(" ")
      .filter((token) => token.length >= 4 && !MATCH_STOP_WORDS.has(token)),
  );
}

function activityMatches(source: ProjetoImportadoDraft["atividades"][number], candidate: ProjetoImportadoDraft["atividades"][number]) {
  const sourceTitle = comparable(source.titulo);
  const candidateTitle = comparable(candidate.titulo);
  if (
    sourceTitle.length >= 8
    && candidateTitle.length >= 8
    && (sourceTitle.includes(candidateTitle) || candidateTitle.includes(sourceTitle))
  ) {
    return true;
  }

  const sourceTokens = meaningfulTokens(`${source.titulo} ${source.descricao}`);
  const candidateTokens = meaningfulTokens(`${candidate.titulo} ${candidate.descricao}`);
  const shared = [...sourceTokens].filter((token) => candidateTokens.has(token)).length;
  return shared >= 3 && shared / Math.min(sourceTokens.size || 1, candidateTokens.size || 1) >= 0.45;
}

function relatedObjective(description: string, objectives: string[]) {
  const descriptionTokens = meaningfulTokens(description);
  let best = { objective: "", score: 0 };

  for (const objective of objectives) {
    const tokens = meaningfulTokens(objective);
    const score = [...tokens].filter((token) => descriptionTokens.has(token)).length;
    if (score > best.score) best = { objective, score };
  }

  return best.score >= 3 ? best.objective : "";
}

function isGenericCategory(value: string) {
  return /^(?:projeto\s+)?pedag[oó]gico|educa[cç][aã]o infantil|geral|outros?$/i.test(value.trim());
}

function summarize(value: string) {
  const sentences = value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const summary = sentences.slice(0, 2).join(" ").replace(/\s+/g, " ").trim();
  return (summary || value).slice(0, 900).trim();
}

function inferCategory(value: string) {
  if (/natureza|ambient|plant|terra|[aá]gua|sustent/i.test(value)) return "Natureza e sustentabilidade";
  if (/m[uú]sica|can[cç][aã]o|dan[cç]a|ritmo|sonor/i.test(value)) return "Música e movimento";
  if (/acolh|adapta[cç][aã]o|v[ií]nculo/i.test(value)) return "Acolhimento e convivência";
  if (/arte|pintura|desenho|cores|colagem/i.test(value)) return "Arte e expressão";
  if (/literatura|hist[oó]ria|leitura|livro/i.test(value)) return "Literatura e linguagem";
  return "Projeto pedagógico";
}

function inferAgeGroup(value: string) {
  const candidates = [
    /\bber[cç][aá]rio(?:\s+[iIvVxX]+)?\b/i,
    /\bmaternal(?:\s+[iIvVxX]+)?\b/i,
    /\bjardim(?:\s+[iIvVxX]+)?\b/i,
    /\bpr[eé](?:-escola|\s+[iIvVxX]+)\b/i,
  ];
  const match = candidates.map((pattern) => value.match(pattern)?.[0]).find(Boolean);
  return match?.replace(/\s+/g, " ").trim() || "Etapa a definir";
}

function inferDuration(cronograma: string) {
  const dates = cronograma.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g) ?? [];
  if (dates.length >= 2) return `${dates[0]} a ${dates[1]}`;
  return cronograma.slice(0, 80).trim() || "A definir";
}

function activityTitle(value: string, index: number) {
  const colonIndex = value.indexOf(":");
  const colonTitle = colonIndex >= 0 ? value.slice(0, colonIndex).trim() : "";
  if (colonTitle.length >= 3 && colonTitle.length <= 100) return colonTitle;

  const firstSentence = value.split(/[.!?;]/, 1)[0]?.trim() ?? "";
  if (firstSentence.length >= 3) {
    return firstSentence.length <= 100 ? firstSentence : `${firstSentence.slice(0, 97).trim()}...`;
  }

  return `Atividade ${index + 1}`;
}

function findHeading(line: string) {
  const candidate = line.replace(/^[\s*•·▪◦‣⁃\-–—]+/, "").trim();
  for (const [key, pattern] of SECTION_PATTERNS) {
    const match = candidate.match(pattern);
    if (match) return { key, content: match[1]?.trim() ?? "" };
  }
  return null;
}

export function parsePedagogicalProjectText(localText: string, fileName: string): ProjetoImportadoDraft {
  const sections = new Map<SectionKey, string[]>();
  let current: SectionKey | null = null;

  for (const rawLine of localText.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    const heading = line ? findHeading(line) : null;

    if (heading) {
      current = heading.key;
      if (!sections.has(current)) sections.set(current, []);
      if (heading.content) sections.get(current)!.push(heading.content);
      continue;
    }

    if (current) sections.get(current)!.push(line);
  }

  const sectionText = (key: SectionKey) => compactText(sections.get(key) ?? []);
  const objectives = listFromSection(sections.get("objetivosEspecificos") ?? []);
  const methodology = listFromSection(sections.get("metodologia") ?? []);
  const evaluation = listFromSection(sections.get("avaliacao") ?? []);
  const fields = listFromSection(sections.get("camposExperiencia") ?? []);
  const comparableDocument = comparable(localText);
  for (const field of EXPERIENCE_FIELDS) {
    if (
      comparableDocument.includes(comparable(field))
      && !fields.some((existing) => comparable(existing).includes(comparable(field)))
    ) {
      fields.push(field);
    }
  }
  const justification = sectionText("justificativa");
  const problem = sectionText("problema");
  const cronograma = sectionText("cronograma");
  const sourceTitle = sectionText("titulo").replace(/^['“”"]|['“”"]$/g, "").trim();
  const fallbackTitle = fileName.replace(/\.(?:docx|pdf|jpe?g|png|webp)$/i, "").replace(/[_-]+/g, " ");
  const title = (sourceTitle || fallbackTitle || "Projeto importado").slice(0, 180);
  const primaryCategory = inferCategory(`${title}\n${problem}`);
  const category = primaryCategory === "Projeto pedagógico"
    ? inferCategory(justification)
    : primaryCategory;
  const activities = methodology.slice(0, 100).map((description, index) => ({
    titulo: activityTitle(description, index),
    objetivoTexto: "",
    descricao: description.slice(0, 6000),
    materiais: [],
  }));

  if (!activities.length) {
    const source = problem || justification || localText.replace(/\s+/g, " ").trim();
    activities.push({
      titulo: "Desenvolvimento do projeto",
      objetivoTexto: "",
      descricao: source.slice(0, 6000),
      materiais: [],
    });
  }

  return projetoImportadoDraftSchema.parse({
    titulo: title,
    descricao: summarize(justification || problem || localText),
    categoria: category,
    faixaEtaria: inferAgeGroup(`${title}\n${problem}\n${justification}\n${localText}`),
    duracao: inferDuration(cronograma),
    bnccObjetivos: unique(localText.match(/\bEI\d{2}[A-Z]{2}\d{2}\b/gi) ?? []).map((code) => code.toUpperCase()),
    problema: problem,
    justificativa: justification,
    objetivoGeral: sectionText("objetivoGeral"),
    objetivosEspecificos: objectives,
    camposExperiencia: fields,
    metodologia: methodology,
    cronograma,
    avaliacao: evaluation,
    atividades: activities,
  });
}

export function mergeProjectDraftWithSource(
  aiDraft: ProjetoImportadoDraft,
  sourceDraft: ProjetoImportadoDraft,
): ProjetoImportadoDraft {
  const activities = aiDraft.atividades.map((activity) => ({ ...activity }));

  for (const sourceActivity of sourceDraft.atividades) {
    const matchIndex = activities.findIndex((activity) => activityMatches(sourceActivity, activity));
    if (matchIndex >= 0) {
      const matched = activities[matchIndex];
      activities[matchIndex] = {
        ...matched,
        descricao: sourceActivity.descricao.length > matched.descricao.length
          ? sourceActivity.descricao
          : matched.descricao,
      };
      continue;
    }

    activities.push({
      ...sourceActivity,
      objetivoTexto: relatedObjective(sourceActivity.descricao, aiDraft.objetivosEspecificos),
    });
  }

  const preferLongerList = (aiValues: string[], sourceValues: string[]) =>
    sourceValues.length > aiValues.length ? sourceValues : aiValues;

  return projetoImportadoDraftSchema.parse({
    ...aiDraft,
    categoria: isGenericCategory(aiDraft.categoria) ? sourceDraft.categoria : aiDraft.categoria,
    faixaEtaria: sourceDraft.faixaEtaria !== "Etapa a definir" ? sourceDraft.faixaEtaria : aiDraft.faixaEtaria,
    bnccObjetivos: unique([...sourceDraft.bnccObjetivos, ...aiDraft.bnccObjetivos]),
    objetivosEspecificos: preferLongerList(aiDraft.objetivosEspecificos, sourceDraft.objetivosEspecificos),
    camposExperiencia: preferLongerList(aiDraft.camposExperiencia, sourceDraft.camposExperiencia),
    metodologia: preferLongerList(aiDraft.metodologia, sourceDraft.metodologia),
    avaliacao: preferLongerList(aiDraft.avaliacao, sourceDraft.avaliacao),
    atividades: activities.slice(0, 100),
  });
}
