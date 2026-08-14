import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ProjectActivityDocument = {
  titulo: string;
  descricao: string;
  categoria?: string | null;
  duracao?: number | null;
  materiais?: string[];
  bnccCodigos?: string[];
};

export type ProjectDocument = {
  id: string;
  titulo: string;
  descricao: string;
  categoria?: string | null;
  faixaEtaria?: string | null;
  duracao?: string | null;
  problema?: string | null;
  justificativa?: string | null;
  objetivoGeral?: string | null;
  objetivosEspecificos?: string[];
  camposExperiencia?: string[];
  metodologia?: string[];
  cronograma?: string | null;
  avaliacao?: string[];
  bnccObjetivos?: string[];
  atividades?: ProjectActivityDocument[];
};

export type PlanningDayDocument = {
  diaSemana: number;
  dataLabel: string;
  diaLabel: string;
  objetivos: string;
  atividade: string;
};

export type PlanningDocument = {
  id: string;
  turmaNome: string;
  semanaInicio: Date;
  semanaFim: Date;
  nomeInstituicao?: string | null;
  nomeProfessora?: string | null;
  projetoTitulo?: string | null;
  camposExperiencia: string[];
  direitosAprendizagem: string[];
  dias: PlanningDayDocument[];
};

export type ExportFormat = "pdf" | "docx";

type ExportResult = {
  bytes: Uint8Array | Buffer;
  fileName: string;
  contentType: string;
};

const PAGE_SIZE: [number, number] = [595.28, 841.89];
const PAGE_MARGIN = 42;
const TABLE_WIDTH = PAGE_SIZE[0] - PAGE_MARGIN * 2;
const DAY_LABELS = ["", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
const DIREITOS_PADRAO = ["Conviver", "Brincar", "Participar", "Explorar", "Expressar", "Conhecer-se"];
const PROJECT_FALLBACK_AVALIACAO = [
  "Participa das propostas com interesse e envolvimento progressivo.",
  "Explora materiais, imagens, sons, movimentos e registros relacionados ao tema.",
  "Interage com colegas e adultos, respeitando combinados da rotina.",
  "Comunica descobertas por fala, gesto, desenho, movimento ou brincadeira.",
  "Demonstra avancos em autonomia, linguagem, coordenacao e participacao.",
];

function clean(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function unique(items: Array<string | null | undefined>) {
  return Array.from(new Set(items.map((item) => clean(item)).filter(Boolean)));
}

function normalizeFileNamePart(value: string) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "documento";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
}

function formatDateRange(start: Date, end: Date) {
  return `${formatDate(start)} a ${formatDate(end)}`;
}

function getActivityObjetivos(activity: ProjectActivityDocument) {
  const codes = unique(activity.bnccCodigos ?? []);
  return codes.length ? codes.join(", ") : clean(activity.categoria) || "Desenvolvimento integral";
}

function normalizeProject(project: ProjectDocument): Required<ProjectDocument> {
  const atividades = project.atividades ?? [];
  const metodologia = unique(project.metodologia?.length ? project.metodologia : atividades.map((item) => `${item.titulo}: ${item.descricao}`));
  const bncc = unique([...(project.bnccObjetivos ?? []), ...atividades.flatMap((item) => item.bnccCodigos ?? [])]);

  return {
    id: project.id,
    titulo: clean(project.titulo) || "Projeto pedagogico",
    descricao: clean(project.descricao),
    categoria: clean(project.categoria),
    faixaEtaria: clean(project.faixaEtaria),
    duracao: clean(project.duracao),
    problema: clean(project.problema) || `Que descobertas as criancas podem construir a partir do tema ${project.titulo}?`,
    justificativa:
      clean(project.justificativa) ||
      `Este projeto organiza experiencias significativas para ampliar repertorios, fortalecer a convivencia e favorecer aprendizagens relacionadas a ${clean(project.categoria) || "diferentes campos de experiencia"}.`,
    objetivoGeral:
      clean(project.objetivoGeral) ||
      `Proporcionar experiencias integradas sobre ${project.titulo}, favorecendo curiosidade, participacao, expressao e desenvolvimento integral.`,
    objetivosEspecificos: unique(project.objetivosEspecificos?.length ? project.objetivosEspecificos : project.bnccObjetivos ?? []),
    camposExperiencia: unique(project.camposExperiencia?.length ? project.camposExperiencia : bncc),
    metodologia: metodologia.length ? metodologia : ["Rodas de conversa, exploracoes orientadas, producoes da turma e registros pedagogicos."],
    cronograma: clean(project.cronograma) || clean(project.duracao) || "Periodo definido pela professora.",
    avaliacao: unique(project.avaliacao?.length ? project.avaliacao : PROJECT_FALLBACK_AVALIACAO),
    bnccObjetivos: bncc,
    atividades,
  };
}

function splitLines(
  text: string,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  fontSize: number,
  maxWidth: number,
) {
  const words = clean(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

class PdfWriter {
  private document!: PDFDocument;
  private titleFont!: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  private bodyFont!: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  private boldFont!: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  private page!: ReturnType<PDFDocument["addPage"]>;
  private y = 0;

  async init() {
    this.document = await PDFDocument.create();
    this.titleFont = await this.document.embedFont(StandardFonts.HelveticaBold);
    this.bodyFont = await this.document.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.document.embedFont(StandardFonts.HelveticaBold);
    this.addPage();
    return this;
  }

  addPage() {
    this.page = this.document.addPage(PAGE_SIZE);
    this.y = this.page.getHeight() - PAGE_MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height < PAGE_MARGIN) {
      this.addPage();
    }
  }

  drawHeader(title: string, subtitle: string) {
    this.ensureSpace(84);
    this.page.drawText("PEQUENOS PASSOS", {
      x: PAGE_MARGIN,
      y: this.y,
      size: 10,
      font: this.boldFont,
      color: rgb(0.43, 0.16, 0.85),
    });
    this.y -= 24;
    this.page.drawText(title.toUpperCase(), {
      x: PAGE_MARGIN,
      y: this.y,
      size: 20,
      font: this.titleFont,
      color: rgb(0.17, 0.14, 0.23),
    });
    this.y -= 18;
    if (subtitle) {
      this.drawParagraph(subtitle, { fontSize: 10, color: rgb(0.36, 0.45, 0.55), spacingAfter: 10 });
    }
    this.page.drawLine({
      start: { x: PAGE_MARGIN, y: this.y },
      end: { x: this.page.getWidth() - PAGE_MARGIN, y: this.y },
      thickness: 1,
      color: rgb(0.86, 0.9, 0.95),
    });
    this.y -= 18;
  }

  drawTitle(text: string) {
    this.ensureSpace(30);
    this.page.drawText(text.toUpperCase(), {
      x: PAGE_MARGIN,
      y: this.y,
      size: 12,
      font: this.boldFont,
      color: rgb(0.17, 0.14, 0.23),
    });
    this.y -= 16;
  }

  drawParagraph(
    text: string,
    options: { fontSize?: number; bold?: boolean; color?: ReturnType<typeof rgb>; spacingAfter?: number } = {},
  ) {
    const fontSize = options.fontSize ?? 10;
    const font = options.bold ? this.boldFont : this.bodyFont;
    const lines = splitLines(text, font, fontSize, TABLE_WIDTH);
    const height = lines.length * (fontSize + 4) + (options.spacingAfter ?? 8);
    this.ensureSpace(height);
    for (const line of lines) {
      this.page.drawText(line, {
        x: PAGE_MARGIN,
        y: this.y,
        size: fontSize,
        font,
        color: options.color ?? rgb(0.23, 0.3, 0.38),
      });
      this.y -= fontSize + 4;
    }
    this.y -= options.spacingAfter ?? 8;
  }

  drawBullets(items: string[]) {
    for (const item of items) {
      this.drawParagraph(`- ${item}`, { spacingAfter: 2 });
    }
    this.y -= 6;
  }

  drawPlanningTable(days: PlanningDayDocument[]) {
    const colWidths = [112, 192, TABLE_WIDTH - 112 - 192];
    const headerHeight = 24;
    const drawHeaderRow = () => {
      this.ensureSpace(headerHeight + 24);
      let x = PAGE_MARGIN;
      ["Semana", "Objetivos", "Atividade"].forEach((label, index) => {
        this.page.drawRectangle({
          x,
          y: this.y - headerHeight,
          width: colWidths[index],
          height: headerHeight,
          borderColor: rgb(0.12, 0.16, 0.22),
          borderWidth: 0.7,
          color: rgb(0.95, 0.96, 0.98),
        });
        this.page.drawText(label.toUpperCase(), {
          x: x + 6,
          y: this.y - 16,
          size: 9,
          font: this.boldFont,
          color: rgb(0.17, 0.14, 0.23),
        });
        x += colWidths[index];
      });
      this.y -= headerHeight;
    };

    drawHeaderRow();

    for (const day of days) {
      const dayText = `${day.dataLabel}\n${day.diaLabel}`;
      const dayLines = dayText.split("\n");
      const objectiveLines = splitLines(day.objetivos, this.bodyFont, 9, colWidths[1] - 12);
      const activityLines = splitLines(day.atividade, this.bodyFont, 9, colWidths[2] - 12);
      const lineCount = Math.max(dayLines.length, objectiveLines.length, activityLines.length);
      const rowHeight = Math.max(58, lineCount * 12 + 18);

      if (this.y - rowHeight < PAGE_MARGIN) {
        this.addPage();
        drawHeaderRow();
      }

      let x = PAGE_MARGIN;
      [colWidths[0], colWidths[1], colWidths[2]].forEach((width) => {
        this.page.drawRectangle({
          x,
          y: this.y - rowHeight,
          width,
          height: rowHeight,
          borderColor: rgb(0.12, 0.16, 0.22),
          borderWidth: 0.55,
          color: rgb(1, 1, 1),
        });
        x += width;
      });

      dayLines.forEach((line, index) => {
        this.page.drawText(line, {
          x: PAGE_MARGIN + 6,
          y: this.y - 16 - index * 12,
          size: 9,
          font: index === 1 ? this.boldFont : this.bodyFont,
          color: rgb(0.17, 0.14, 0.23),
        });
      });
      objectiveLines.forEach((line, index) => {
        this.page.drawText(line, {
          x: PAGE_MARGIN + colWidths[0] + 6,
          y: this.y - 16 - index * 12,
          size: 9,
          font: this.bodyFont,
          color: rgb(0.17, 0.14, 0.23),
        });
      });
      activityLines.forEach((line, index) => {
        this.page.drawText(line, {
          x: PAGE_MARGIN + colWidths[0] + colWidths[1] + 6,
          y: this.y - 16 - index * 12,
          size: 9,
          font: this.bodyFont,
          color: rgb(0.17, 0.14, 0.23),
        });
      });
      this.y -= rowHeight;
    }
  }

  save() {
    return this.document.save();
  }
}

function docxParagraph(text: string, options: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; bold?: boolean } = {}) {
  return new Paragraph({
    heading: options.heading,
    spacing: { after: options.heading ? 160 : 100 },
    children: [
      new TextRun({
        text,
        bold: options.bold ?? Boolean(options.heading),
      }),
    ],
  });
}

function docxBullets(items: string[]) {
  return items.map(
    (item) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 70 },
        children: [new TextRun(item)],
      }),
  );
}

function docxTableCell(text: string, bold = false) {
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
    },
    children: text.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, bold })] })),
  });
}

export class PedagogicalDocumentExportService {
  async exportProject(project: ProjectDocument, format: ExportFormat): Promise<ExportResult> {
    const normalized = normalizeProject(project);
    const slug = normalizeFileNamePart(normalized.titulo);
    const dateSlug = new Date().toISOString().slice(0, 10);

    if (format === "docx") {
      return {
        bytes: await this.buildProjectDocx(normalized),
        fileName: `projeto-${slug}-${dateSlug}.docx`,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }

    return {
      bytes: await this.buildProjectPdf(normalized),
      fileName: `projeto-${slug}-${dateSlug}.pdf`,
      contentType: "application/pdf",
    };
  }

  async exportPlanning(planning: PlanningDocument, format: ExportFormat): Promise<ExportResult> {
    const slug = normalizeFileNamePart(planning.turmaNome);
    const dateSlug = new Date().toISOString().slice(0, 10);

    if (format === "docx") {
      return {
        bytes: await this.buildPlanningDocx(planning),
        fileName: `planejamento-semanal-${slug}-${dateSlug}.docx`,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }

    return {
      bytes: await this.buildPlanningPdf(planning),
      fileName: `planejamento-semanal-${slug}-${dateSlug}.pdf`,
      contentType: "application/pdf",
    };
  }

  private async buildProjectPdf(project: Required<ProjectDocument>) {
    const writer = await new PdfWriter().init();
    writer.drawHeader(project.titulo, [project.faixaEtaria, project.duracao, project.categoria].filter(Boolean).join(" | "));
    writer.drawTitle("Problema");
    writer.drawParagraph(clean(project.problema));
    writer.drawTitle("Justificativa");
    writer.drawParagraph(clean(project.justificativa));
    writer.drawTitle("Objetivo geral");
    writer.drawParagraph(clean(project.objetivoGeral));
    writer.drawTitle("Objetivos especificos");
    writer.drawBullets(project.objetivosEspecificos);
    writer.drawTitle("Campos de experiencia");
    writer.drawBullets(project.camposExperiencia);
    writer.drawTitle("Metodologia");
    writer.drawBullets(project.metodologia);
    writer.drawTitle("Cronograma");
    writer.drawParagraph(clean(project.cronograma));
    writer.drawTitle("Avaliacao");
    writer.drawBullets(project.avaliacao);
    return writer.save();
  }

  private async buildPlanningPdf(planning: PlanningDocument) {
    const writer = await new PdfWriter().init();
    writer.drawHeader("Planejamento semanal", `Turma: ${planning.turmaNome} | Periodo: ${formatDateRange(planning.semanaInicio, planning.semanaFim)}`);
    if (planning.nomeInstituicao) writer.drawParagraph(`Instituicao: ${planning.nomeInstituicao}`, { bold: true });
    if (planning.nomeProfessora) writer.drawParagraph(`Professora: ${planning.nomeProfessora}`, { bold: true });
    if (planning.projetoTitulo) writer.drawParagraph(`Projeto base: ${planning.projetoTitulo}`, { bold: true });
    writer.drawTitle("Campos de experiencias");
    writer.drawParagraph(planning.camposExperiencia.join("; ") || "Definidos pela professora.");
    writer.drawTitle("Direitos de aprendizagem");
    writer.drawParagraph((planning.direitosAprendizagem.length ? planning.direitosAprendizagem : DIREITOS_PADRAO).join(", "));
    writer.drawPlanningTable(planning.dias);
    return writer.save();
  }

  private async buildProjectDocx(project: Required<ProjectDocument>) {
    const children = [
      docxParagraph("Pequenos Passos", { bold: true }),
      docxParagraph(`PROJETO: ${project.titulo}`, { heading: HeadingLevel.TITLE }),
      docxParagraph(`Faixa etaria: ${project.faixaEtaria} | Duracao: ${project.duracao} | Categoria: ${project.categoria}`),
      docxParagraph(`PROBLEMA: ${project.problema}`, { bold: true }),
      docxParagraph("JUSTIFICATIVA:", { heading: HeadingLevel.HEADING_2 }),
      docxParagraph(clean(project.justificativa)),
      docxParagraph("OBJETIVO GERAL:", { heading: HeadingLevel.HEADING_2 }),
      docxParagraph(clean(project.objetivoGeral)),
      docxParagraph("OBJETIVOS ESPECIFICOS:", { heading: HeadingLevel.HEADING_2 }),
      ...docxBullets(project.objetivosEspecificos),
      docxParagraph("CAMPOS DE EXPERIENCIA:", { heading: HeadingLevel.HEADING_2 }),
      ...docxBullets(project.camposExperiencia),
      docxParagraph("METODOLOGIA:", { heading: HeadingLevel.HEADING_2 }),
      ...docxBullets(project.metodologia),
      docxParagraph(`CRONOGRAMA: ${project.cronograma}`, { heading: HeadingLevel.HEADING_2 }),
      docxParagraph("AVALIACAO:", { heading: HeadingLevel.HEADING_2 }),
      ...docxBullets(project.avaliacao),
    ];

    const document = new Document({
      sections: [{ properties: {}, children }],
    });
    return Packer.toBuffer(document);
  }

  private async buildPlanningDocx(planning: PlanningDocument) {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [docxTableCell("Semana", true), docxTableCell("Objetivos", true), docxTableCell("Atividade", true)],
        }),
        ...planning.dias.map(
          (day) =>
            new TableRow({
              children: [
                docxTableCell(`${day.dataLabel}\n${day.diaLabel}`, true),
                docxTableCell(day.objetivos),
                docxTableCell(day.atividade),
              ],
            }),
        ),
      ],
    });

    const children = [
      docxParagraph("Pequenos Passos", { bold: true }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: "PLANEJAMENTO SEMANAL", bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [new TextRun({ text: `TURMA: ${planning.turmaNome.toUpperCase()}`, bold: true })],
      }),
      docxParagraph(`Periodo: ${formatDateRange(planning.semanaInicio, planning.semanaFim)}`),
      ...(planning.nomeInstituicao ? [docxParagraph(`Instituicao: ${planning.nomeInstituicao}`)] : []),
      ...(planning.nomeProfessora ? [docxParagraph(`Professora: ${planning.nomeProfessora}`)] : []),
      ...(planning.projetoTitulo ? [docxParagraph(`Projeto base: ${planning.projetoTitulo}`)] : []),
      docxParagraph(`CAMPOS DE EXPERIENCIAS: ${planning.camposExperiencia.join("; ") || "Definidos pela professora."}`, { bold: true }),
      docxParagraph(`DIREITOS DE APRENDIZAGEM: ${(planning.direitosAprendizagem.length ? planning.direitosAprendizagem : DIREITOS_PADRAO).join(", ")}`, { bold: true }),
      table,
    ];

    const document = new Document({
      sections: [{ properties: {}, children }],
    });
    return Packer.toBuffer(document);
  }

  planningDayLabels() {
    return DAY_LABELS;
  }

  defaultDireitos() {
    return DIREITOS_PADRAO;
  }

  activityObjetivos(activity: ProjectActivityDocument) {
    return getActivityObjetivos(activity);
  }
}
