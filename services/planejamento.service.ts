import { Plano } from "@prisma/client";

import type { CreatePlanejamentoInput } from "@/dtos/planejamento.dto";
import { PlanLimitError } from "@/dtos/errors";
import { FREE_PLAN_LIMITS } from "@/lib/constants";
import { env } from "@/lib/env";
import { PlanejamentoRepository } from "@/repositories/planejamento.repository";

export class PlanejamentoService {
  private readonly planejamentoRepository = new PlanejamentoRepository();

  async create(userId: string, plano: Plano, payload: CreatePlanejamentoInput) {
    if (plano === Plano.GRATUITO) {
      const currentCount = await this.planejamentoRepository.countByUser(userId);

      if (currentCount >= FREE_PLAN_LIMITS.MAX_PLANEJAMENTOS) {
        throw new PlanLimitError(
          "Plano gratuito permite no maximo 4 planejamentos salvos",
          env.STRIPE_UPGRADE_URL,
        );
      }
    }

    return this.planejamentoRepository.create(userId, payload);
  }

  async list(userId: string, turmaId?: string) {
    return this.planejamentoRepository.listByUser(userId, turmaId);
  }

  async streak(userId: string) {
    return this.planejamentoRepository.weeklyStreak(userId);
  }
}
