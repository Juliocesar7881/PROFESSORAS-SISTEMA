import { Plano } from "@prisma/client";

import { PlanLimitError } from "@/dtos/errors";
import { env } from "@/lib/env";
import { ProjetoRepository } from "@/repositories/projeto.repository";

export class ProjetoService {
  private readonly projetoRepository = new ProjetoRepository();

  async list(
    userId: string,
    plano: Plano,
    filters: {
      categoria?: string;
      faixaEtaria?: string;
      duracao?: string;
      busca?: string;
      salvos?: boolean;
    },
  ) {
    return this.projetoRepository.list(userId, plano, filters);
  }

  async detail(userId: string, plano: Plano, id: string) {
    const projeto = await this.projetoRepository.findById(id);

    if (projeto.premium && plano !== Plano.PRO) {
      throw new PlanLimitError(
        "Projeto premium disponivel apenas no Plano Pro",
        env.STRIPE_UPGRADE_URL,
      );
    }

    const saved = await this.projetoRepository.isSaved(userId, id);

    return {
      ...projeto,
      salvo: saved,
    };
  }

  async save(userId: string, projetoId: string) {
    return this.projetoRepository.save(userId, projetoId);
  }

  async unsave(userId: string, projetoId: string) {
    return this.projetoRepository.unsave(userId, projetoId);
  }
}
