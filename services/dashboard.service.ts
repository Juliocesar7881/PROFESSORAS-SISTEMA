import { endOfWeek, startOfWeek } from "date-fns";

import { AlunoRepository } from "@/repositories/aluno.repository";
import { ObservacaoRepository } from "@/repositories/observacao.repository";
import { PlanejamentoRepository } from "@/repositories/planejamento.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import { RelatorioRepository } from "@/repositories/relatorio.repository";
import { Plano } from "@prisma/client";

export class DashboardService {
  private readonly planejamentoRepository = new PlanejamentoRepository();

  private readonly alunoRepository = new AlunoRepository();

  private readonly observacaoRepository = new ObservacaoRepository();

  private readonly projetoRepository = new ProjetoRepository();

  private readonly relatorioRepository = new RelatorioRepository();

  async summary(userId: string, plano: Plano) {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [planejamentos, alunosSemObservacao, projetosSalvos, streak, totalAlunos, observacoesSemana, relatoriosMes, observacoesRecentes] = await Promise.all([
      this.planejamentoRepository.listByUser(userId),
      this.alunoRepository.listWithoutRecentObservation(userId, 14),
      this.projetoRepository.list(userId, plano, { salvos: true }),
      this.planejamentoRepository.weeklyStreak(userId),
      this.alunoRepository.countByUser(userId),
      this.observacaoRepository.countByUserSince(userId, weekStart),
      this.relatorioRepository.countByUserCurrentMonth(userId),
      this.observacaoRepository.listRecentByUser(userId, 8),
    ]);

    const planejamentosSemana = planejamentos.filter((planejamento) => {
      const start = new Date(planejamento.semanaInicio).getTime();
      return start >= weekStart.getTime() && start <= weekEnd.getTime();
    }).length;

    return {
      weekStart,
      weekEnd,
      totalAlunos,
      observacoesSemana,
      planejamentosSemana,
      relatoriosMes,
      planejamentos,
      observacoesRecentes,
      alunosSemObservacao,
      projetosSalvos,
      streak,
    };
  }
}
