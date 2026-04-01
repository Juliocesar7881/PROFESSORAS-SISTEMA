import { subDays, subYears } from "date-fns";

import { AlunoRepository } from "@/repositories/aluno.repository";
import { AuditRepository } from "@/repositories/audit.repository";
import { TurmaRepository } from "@/repositories/turma.repository";
import { UserRepository } from "@/repositories/user.repository";

export class AccountService {
  private readonly userRepository = new UserRepository();

  private readonly turmaRepository = new TurmaRepository();

  private readonly alunoRepository = new AlunoRepository();

  private readonly auditRepository = new AuditRepository();

  async logoutEverywhere(userId: string) {
    return this.userRepository.deleteAllSessions(userId);
  }

  async deleteAccount(userId: string) {
    await this.userRepository.deleteAllSessions(userId);
    return this.userRepository.deleteAccount(userId);
  }

  async hardDeleteSoftDeletedRecords() {
    const softDeleteCutoff = subDays(new Date(), 30);
    const auditCutoff = subYears(new Date(), 2);

    const [deletedTurmas, deletedAlunos, deletedAudit] = await Promise.all([
      this.turmaRepository.hardDeleteExpired(softDeleteCutoff),
      this.alunoRepository.hardDeleteExpired(softDeleteCutoff),
      this.auditRepository.purgeOlderThan(auditCutoff),
    ]);

    return {
      turmas: deletedTurmas.count,
      alunos: deletedAlunos.count,
      auditLogs: deletedAudit.count,
    };
  }
}
