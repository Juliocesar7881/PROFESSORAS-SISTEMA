import type { OnboardingInput } from "@/dtos/onboarding.dto";
import { ConflictError } from "@/dtos/errors";
import { AlunoRepository } from "@/repositories/aluno.repository";
import { TurmaRepository } from "@/repositories/turma.repository";
import { UserRepository } from "@/repositories/user.repository";

export class OnboardingService {
  private readonly turmaRepository = new TurmaRepository();

  private readonly alunoRepository = new AlunoRepository();

  private readonly userRepository = new UserRepository();

  async run(userId: string, payload: OnboardingInput) {
    const alreadyConfigured = await this.userRepository.hasAnyTurma(userId);

    if (alreadyConfigured) {
      throw new ConflictError("Onboarding ja concluido para este usuario");
    }

    const turma = await this.turmaRepository.create(userId, payload.turma);

    const alunos = await Promise.all(
      payload.alunos.map((aluno) =>
        this.alunoRepository.create(userId, {
          nome: aluno.nome,
          dataNasc: aluno.dataNasc,
          turmaId: turma.id,
        }),
      ),
    );

    return {
      turma,
      alunos,
      consentimentoLGPD: payload.consentimentoLGPD,
    };
  }
}
