import type { CreateChamadaInput } from "@/dtos/chamada.dto";
import { ChamadaRepository } from "@/repositories/chamada.repository";

export class ChamadaService {
  private readonly chamadaRepository = new ChamadaRepository();

  async save(userId: string, payload: CreateChamadaInput) {
    const chamada = await this.chamadaRepository.save(userId, payload);

    const rates = await this.chamadaRepository.absenceRateByAluno(
      userId,
      payload.turmaId,
      payload.data.getMonth() + 1,
      payload.data.getFullYear(),
    );

    return {
      chamada,
      alertas: rates.filter((item) => item.taxaFalta >= 0.25),
    };
  }

  async listByMonth(userId: string, turmaId: string, mes: number, ano: number) {
    return this.chamadaRepository.listByMonth(userId, turmaId, mes, ano);
  }
}
