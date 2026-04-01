import { endOfWeek, startOfWeek } from "date-fns";

import { AlunoRepository } from "@/repositories/aluno.repository";
import { PlanejamentoRepository } from "@/repositories/planejamento.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import { Plano } from "@prisma/client";

export class DashboardService {
  private readonly planejamentoRepository = new PlanejamentoRepository();

  private readonly alunoRepository = new AlunoRepository();

  private readonly projetoRepository = new ProjetoRepository();

  async summary(userId: string, plano: Plano) {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [planejamentos, alunosSemObservacao, projetosSalvos, streak] = await Promise.all([
      this.planejamentoRepository.listByUser(userId),
      this.alunoRepository.listWithoutRecentObservation(userId, 14),
      this.projetoRepository.list(userId, plano, { salvos: true }),
      this.planejamentoRepository.weeklyStreak(userId),
    ]);

    return {
      weekStart,
      weekEnd,
      planejamentos,
      alunosSemObservacao,
      projetosSalvos,
      streak,
    };
  }
}
