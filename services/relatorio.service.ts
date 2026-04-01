import { Plano } from "@prisma/client";

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

  async gerar(userId: string, plano: Plano, payload: GerarRelatorioInput) {
    const observacoes = await this.observacaoRepository.getTextByAluno(userId, payload.alunoId);

    if (observacoes.length < 5) {
      throw new ValidationError("Relatorio requer no minimo 5 observacoes do aluno");
    }

    const generatedThisMonth = await this.relatorioRepository.countByUserCurrentMonth(userId);
    const monthlyLimit = plano === Plano.PRO ? PRO_PLAN_LIMITS.IA_REPORTS_PER_MONTH : FREE_PLAN_LIMITS.IA_REPORTS_PER_MONTH;

    if (generatedThisMonth >= monthlyLimit) {
      throw new PlanLimitError("Limite mensal de relatorios IA atingido", env.STRIPE_UPGRADE_URL);
    }

    const prompt = [
      "Voce e um assistente pedagogico para Educacao Infantil no Brasil.",
      "Gere um relatorio descritivo de desenvolvimento com 200 a 300 palavras.",
      "Tom: positivo, construtivo, claro para familias e coordenacao.",
      "Formato: paragrafos corridos, sem listas, sem inventar informacoes.",
      "Alinhamento BNCC: mencionar evolucao de forma natural, sem codigos tecnicos.",
      `Periodo solicitado: ${payload.periodo}`,
      "Observacoes disponiveis:",
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
      throw new ValidationError("Gemini nao retornou conteudo para o relatorio");
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
}
