import { inferEtapaTurma, type EtapaTurma } from "@/lib/etapa";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import { TurmaRepository } from "@/repositories/turma.repository";

export class ProjetoService {
  private readonly projetoRepository = new ProjetoRepository();

  private readonly turmaRepository = new TurmaRepository();

  async list(
    userId: string,
    filters: {
      categoria?: string;
      faixaEtaria?: string;
      etapa?: EtapaTurma;
      turmaId?: string;
      duracao?: string;
      busca?: string;
      salvos?: boolean;
    },
  ) {
    let etapa = filters.etapa;

    if (!etapa && filters.turmaId) {
      const turma = await this.turmaRepository.findOwnedById(userId, filters.turmaId);
      etapa = inferEtapaTurma(turma.faixaEtaria) ?? undefined;
    }

    return this.projetoRepository.list(userId, {
      ...filters,
      etapa,
    });
  }

  async detail(userId: string, id: string) {
    const projeto = await this.projetoRepository.findById(id);

    const saved = await this.projetoRepository.isSaved(userId, id);

    return {
      ...projeto,
      premium: false,
      salvo: saved,
      premiumBloqueado: false,
    };
  }

  async save(userId: string, projetoId: string) {
    return this.projetoRepository.save(userId, projetoId);
  }

  async unsave(userId: string, projetoId: string) {
    return this.projetoRepository.unsave(userId, projetoId);
  }
}
