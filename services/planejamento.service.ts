import { addDays } from "date-fns";

import type { CreatePlanejamentoInput } from "@/dtos/planejamento.dto";
import {
  PedagogicalDocumentExportService,
  type ExportFormat,
  type PlanningDayDocument,
} from "@/services/pedagogical-document-export.service";
import { PlanejamentoRepository } from "@/repositories/planejamento.repository";

export class PlanejamentoService {
  private readonly planejamentoRepository = new PlanejamentoRepository();

  private readonly exportService = new PedagogicalDocumentExportService();

  async create(userId: string, payload: CreatePlanejamentoInput) {
    return this.planejamentoRepository.create(userId, payload);
  }
  async list(userId: string, turmaId?: string, semanaInicio?: Date) {
    return this.planejamentoRepository.listByUser(userId, turmaId, semanaInicio);
  }

  async streak(userId: string) {
    return this.planejamentoRepository.weeklyStreak(userId);
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
  }

  private buildDayRows(
    planejamento: Awaited<ReturnType<PlanejamentoRepository["findOwnedById"]>>,
  ): PlanningDayDocument[] {
    const dayLabels = this.exportService.planningDayLabels();

    return [1, 2, 3, 4, 5].map((diaSemana) => {
      const date = addDays(planejamento.semanaInicio, diaSemana - 1);
      const atividades = planejamento.atividades.filter((item) => item.diaSemana === diaSemana);
      const objetivos = atividades
        .map((item) => {
          if (item.objetivosTexto) return item.objetivosTexto;
          if (item.atividade) return this.exportService.activityObjetivos(item.atividade);
          return "";
        })
        .filter(Boolean)
        .join("\n");
      const atividade = atividades
        .map((item) => {
          const text = item.atividadeTexto || [item.atividade?.titulo, item.atividade?.descricao].filter(Boolean).join(": ");
          return text ? [item.horario, text].filter(Boolean).join(" - ") : "";
        })
        .filter(Boolean)
        .join("\n");

      return {
        diaSemana,
        dataLabel: this.formatDate(date),
        diaLabel: dayLabels[diaSemana] ?? "",
        objetivos: objetivos || "-",
        atividade: atividade || "-",
      };
    });
  }

  async exportDocument(userId: string, planejamentoId: string, format: ExportFormat) {
    const planejamento = await this.planejamentoRepository.findOwnedById(userId, planejamentoId);
    const camposExperiencia = planejamento.camposExperiencia.length
      ? planejamento.camposExperiencia
      : planejamento.projetoBase?.camposExperiencia ?? [];
    const direitosAprendizagem = planejamento.direitosAprendizagem.length
      ? planejamento.direitosAprendizagem
      : this.exportService.defaultDireitos();

    return this.exportService.exportPlanning(
      {
        id: planejamento.id,
        turmaNome: planejamento.grupoNome || planejamento.turma?.nome || "Grupo/Turma",
        semanaInicio: planejamento.semanaInicio,
        semanaFim: planejamento.semanaFim,
        nomeInstituicao: planejamento.nomeInstituicao,
        nomeProfessora: planejamento.nomeProfessora || planejamento.user.name,
        projetoTitulo: planejamento.projetoBase?.titulo,
        camposExperiencia,
        direitosAprendizagem,
        dias: this.buildDayRows(planejamento),
      },
      format,
    );
  }
}
