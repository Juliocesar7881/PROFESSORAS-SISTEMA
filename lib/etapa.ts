export const ETAPA_VALUES = ["BERCARIO", "MATERNAL", "JARDIM", "PRE"] as const;

export type EtapaTurma = (typeof ETAPA_VALUES)[number];

export const ETAPA_OPTIONS: ReadonlyArray<{ value: EtapaTurma; label: string }> = [
  { value: "BERCARIO", label: "Bercario" },
  { value: "MATERNAL", label: "Maternal" },
  { value: "JARDIM", label: "Jardim" },
  { value: "PRE", label: "Pre-escola" },
];

const ETAPA_KEYWORDS: Record<EtapaTurma, string[]> = {
  BERCARIO: ["bercario", "bercario i", "bercario ii", "0 a 1", "0 a 2", "1 a 2", "lactario"],
  MATERNAL: ["maternal", "maternal i", "maternal ii", "2 a 3", "3 a 4", "2-3", "3-4"],
  JARDIM: ["jardim", "jardim i", "jardim ii", "4 a 5", "4-5"],
  PRE: ["pre", "pre escola", "pre-escola", "5 a 6", "5-6"],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchByAgeRange(text: string): EtapaTurma | null {
  if (/(^|\D)(0|1)\s*[-a]\s*(1|2)(\D|$)/.test(text) || /ate\s*2/.test(text)) {
    return "BERCARIO";
  }

  if (/(^|\D)(2|3)\s*[-a]\s*(3|4)(\D|$)/.test(text)) {
    return "MATERNAL";
  }

  if (/(^|\D)4\s*[-a]\s*5(\D|$)/.test(text)) {
    return "JARDIM";
  }

  if (/(^|\D)5\s*[-a]\s*6(\D|$)/.test(text)) {
    return "PRE";
  }

  return null;
}

export function inferEtapaTurma(faixaEtaria: string | null | undefined): EtapaTurma | null {
  if (!faixaEtaria) {
    return null;
  }

  const normalized = normalize(faixaEtaria);

  for (const option of ETAPA_OPTIONS) {
    if (ETAPA_KEYWORDS[option.value].some((keyword) => normalized.includes(keyword))) {
      return option.value;
    }
  }

  return matchByAgeRange(normalized);
}

export function matchesEtapa(faixaEtaria: string | null | undefined, etapa: EtapaTurma) {
  const inferred = inferEtapaTurma(faixaEtaria);
  return inferred === etapa;
}

export function getEtapaLabel(etapa: EtapaTurma) {
  return ETAPA_OPTIONS.find((item) => item.value === etapa)?.label ?? etapa;
}
