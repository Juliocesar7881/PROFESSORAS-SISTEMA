import { Plano } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { GerarRelatorioInput } from "@/dtos/relatorio.dto";
import { PlanLimitError, ValidationError } from "@/dtos/errors";
import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from "@/lib/constants";
import { env } from "@/lib/env";
import { gemini } from "@/lib/gemini";
import { ObservacaoRepository } from "@/repositories/observacao.repository";
import { RelatorioRepository } from "@/repositories/relatorio.repository";

export class RelatorioService {
  private readonly observacaoRepository = new ObservacaoRepository();

  private readonly relatorioRepository = new RelatorioRepository();

  private normalizeFileNamePart(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private splitTextByWidth(text: string, font: { widthOfTextAtSize: (text: string, size: number) => number }, fontSize: number, maxWidth: number) {
    const compactText = text.replace(/\s+/g, " ").trim();

    if (!compactText) {
      return [] as string[];
    }

    const words = compactText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        currentLine = word;
        continue;
      }

      let chunk = "";
      for (const char of word) {
        const chunkCandidate = `${chunk}${char}`;
        if (font.widthOfTextAtSize(chunkCandidate, fontSize) <= maxWidth) {
          chunk = chunkCandidate;
          continue;
        }

        if (chunk) {
          lines.push(chunk);
        }

        chunk = char;
      }

      currentLine = chunk;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private async buildRelatorioPdf(
    relatorio: Awaited<ReturnType<RelatorioRepository["findOwnedById"]>>,
  ) {
    const document = await PDFDocument.create();
    const titleFont = await document.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await document.embedFont(StandardFonts.Helvetica);
    const pageSize: [number, number] = [595.28, 841.89];
    const margin = 48;
    const contentWidth = pageSize[0] - margin * 2;

    let page = document.addPage(pageSize);
    let cursorY = page.getHeight() - margin;

    const ensureSpace = (requiredSpace: number) => {
      if (cursorY - requiredSpace >= margin) {
        return;
      }

      page = document.addPage(pageSize);
      cursorY = page.getHeight() - margin;
    };

    const drawLine = (line: string, options?: { fontSize?: number; bold?: boolean; color?: [number, number, number] }) => {
      const fontSize = options?.fontSize ?? 12;
      const font = options?.bold ? titleFont : bodyFont;
      const color = options?.color ?? [0.2, 0.24, 0.3];

      ensureSpace(fontSize + 8);
      page.drawText(line, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(color[0], color[1], color[2]),
      });

      cursorY -= fontSize + 8;
    };

    drawLine("Relatório Pedagógico", { fontSize: 24, bold: true, color: [0.05, 0.19, 0.29] });
    drawLine("Planejei - Assistente pedagógico", { fontSize: 11, color: [0.36, 0.45, 0.55] });
    cursorY -= 6;

    drawLine(`Aluno: ${relatorio.aluno.nome}`, { bold: true, fontSize: 12 });
    drawLine(`Turma: ${relatorio.aluno.turma.nome}`, { fontSize: 11 });
    drawLine(`Período: ${relatorio.periodo}`, { fontSize: 11 });
    drawLine(`Data de geração: ${new Date(relatorio.createdAt).toLocaleDateString("pt-BR")}`, { fontSize: 11 });

    cursorY -= 4;
    ensureSpace(16);
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: margin + contentWidth, y: cursorY },
      thickness: 1,
      color: rgb(0.86, 0.9, 0.95),
    });
    cursorY -= 22;

    const textLines = this.splitTextByWidth(relatorio.texto, bodyFont, 12, contentWidth);
    for (const line of textLines) {
      drawLine(line, { fontSize: 12 });
    }

    cursorY -= 10;
    drawLine("Documento gerado automaticamente pelo Planejei com base em observações registradas.", {
      fontSize: 9,
      color: [0.44, 0.49, 0.57],
    });

    return document.save();
  }

  async gerar(userId: string, plano: Plano, payload: GerarRelatorioInput) {
    const observacoes = await this.observacaoRepository.getTextByAluno(userId, payload.alunoId);

    if (observacoes.length < 5) {
      throw new ValidationError("Relatório requer no mínimo 5 observações do aluno");
    }

    const generatedThisMonth = await this.relatorioRepository.countByUserCurrentMonth(userId);
    const monthlyLimit = plano === Plano.PRO ? PRO_PLAN_LIMITS.IA_REPORTS_PER_MONTH : FREE_PLAN_LIMITS.IA_REPORTS_PER_MONTH;

    if (generatedThisMonth >= monthlyLimit) {
      throw new PlanLimitError("Limite mensal de relatórios com IA atingido", env.STRIPE_UPGRADE_URL);
    }

    const prompt = [
      "Você é um assistente pedagógico para Educação Infantil no Brasil.",
      "Gere um relatório descritivo de desenvolvimento com 200 a 300 palavras.",
      "Tom: positivo, construtivo, claro para famílias e coordenação.",
      "Formato: parágrafos corridos, sem listas, sem inventar informações.",
      "Alinhamento BNCC: mencionar evolução de forma natural, sem códigos técnicos.",
      `Período solicitado: ${payload.periodo}`,
      "Observações disponíveis:",
      ...observacoes.map((obs) => `- [${obs.categoria}] ${obs.texto}`),
    ].join("\n");

    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 700,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new ValidationError("Gemini não retornou conteúdo para o relatório");
    }

    return this.relatorioRepository.create(userId, {
      alunoId: payload.alunoId,
      periodo: payload.periodo,
      texto: text,
    });
  }

  async listar(userId: string, alunoId: string) {
    return this.relatorioRepository.listByAluno(userId, alunoId);
  }

  async listRecentByUser(userId: string, limit = 20) {
    return this.relatorioRepository.listRecentByUser(userId, limit);
  }

  async exportarPdf(userId: string, plano: Plano, relatorioId: string) {
    if (plano !== Plano.PRO) {
      throw new PlanLimitError("Exportação em PDF disponível apenas no Plano Pro", env.STRIPE_UPGRADE_URL);
    }

    const relatorio = await this.relatorioRepository.findOwnedById(userId, relatorioId);
    const bytes = await this.buildRelatorioPdf(relatorio);
    const alunoSlug = this.normalizeFileNamePart(relatorio.aluno.nome) || "aluno";
    const periodoSlug = this.normalizeFileNamePart(relatorio.periodo) || "periodo";
    const dateSlug = new Date(relatorio.createdAt).toISOString().slice(0, 10);

    return {
      fileName: `relatorio-${alunoSlug}-${periodoSlug}-${dateSlug}.pdf`,
      bytes,
    };
  }
}
