import { endOfWeek, startOfWeek } from "date-fns";

import { AlunoRepository } from "@/repositories/aluno.repository";
import { ObservacaoRepository } from "@/repositories/observacao.repository";
import { PlanejamentoRepository } from "@/repositories/planejamento.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import { RelatorioRepository } from "@/repositories/relatorio.repository";

export class DashboardService {
  private readonly planejamentoRepository = new PlanejamentoRepository();

  private readonly alunoRepository = new AlunoRepository();

  private readonly observacaoRepository = new ObservacaoRepository();

  private readonly projetoRepository = new ProjetoRepository();

  private readonly relatorioRepository = new RelatorioRepository();

  async summary(userId: string) {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [planejamentosRecentes, planejamentosSemana, alunosSemObservacao, projetosSalvos, streak, totalAlunos, observacoesSemana, relatoriosMes, observacoesRecentes] = await Promise.all([
      this.planejamentoRepository.listRecentByUser(userId, 6),
      this.planejamentoRepository.countByUserBetween(userId, weekStart, weekEnd),
      this.alunoRepository.listWithoutRecentObservation(userId, 14, 12),
      this.projetoRepository.listSavedSummaries(userId, 6),
      this.planejamentoRepository.weeklyStreak(userId),
      this.alunoRepository.countByUser(userId),
      this.observacaoRepository.countByUserSince(userId, weekStart),
      this.relatorioRepository.countByUserCurrentMonth(userId),
      this.observacaoRepository.listRecentByUser(userId, 8),
    ]);

    return {
      weekStart,
      weekEnd,
      totalAlunos,
      observacoesSemana,
      planejamentosSemana,
      relatoriosMes,
      planejamentos: planejamentosRecentes,
      observacoesRecentes,
      alunosSemObservacao,
      projetosSalvos,
      streak,
    };
  }
}
