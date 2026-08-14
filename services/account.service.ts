import { subDays, subHours, subYears } from "date-fns";

import { AlunoRepository } from "@/repositories/aluno.repository";
import { AuditRepository } from "@/repositories/audit.repository";
import { TurmaRepository } from "@/repositories/turma.repository";
import { UserRepository } from "@/repositories/user.repository";
import { RegistroRepository } from "@/repositories/registro.repository";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";

export class AccountService {
  private readonly userRepository = new UserRepository();

  private readonly turmaRepository = new TurmaRepository();

  private readonly alunoRepository = new AlunoRepository();

  private readonly auditRepository = new AuditRepository();

  private readonly registroRepository = new RegistroRepository();

  async logoutEverywhere(userId: string) {
    return this.userRepository.deleteAllSessions(userId);
  }

  async deleteAccount(userId: string) {
    const storageKeys = await this.userRepository.listOwnedStorageKeys(userId);
    if (storageKeys.length) {
      const removed = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(storageKeys);
      if (removed.error) throw removed.error;
    }

    await this.userRepository.deleteAllSessions(userId);
    const deleted = await this.userRepository.deleteAccount(userId);
    return { deleted: Boolean(deleted), removedFiles: storageKeys.length };
  }

  async hardDeleteSoftDeletedRecords() {
    const softDeleteCutoff = subDays(new Date(), 30);
    const temporaryCutoff = subHours(new Date(), 24);
    const auditCutoff = subYears(new Date(), 2);

    const [storageCandidates, deletedPhotos, staleUploads] = await Promise.all([
      this.registroRepository.listStorageForPurge(softDeleteCutoff),
      this.registroRepository.listDeletedPhotoStorageForPurge(softDeleteCutoff),
      this.registroRepository.listStalePhotoUploads(temporaryCutoff),
    ]);
    const storageKeys = [...new Set([
      ...storageCandidates.flatMap((item) => item.fotos.map((foto) => foto.storageKey)),
      ...deletedPhotos.map((foto) => foto.storageKey),
      ...staleUploads.map((foto) => foto.storageKey),
    ])];
    if (storageKeys.length) {
      await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(storageKeys);
    }

    const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET);
    const expiredExportKeys: string[] = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const listed = await bucket.list("temp-exports", { limit: 100, offset, sortBy: { column: "created_at", order: "asc" } });
      if (listed.error || !listed.data?.length) break;
      for (const file of listed.data) {
        const createdAt = file.created_at ? new Date(file.created_at) : null;
        if (createdAt && createdAt < temporaryCutoff) expiredExportKeys.push(`temp-exports/${file.name}`);
      }
      if (listed.data.length < 100) break;
    }
    if (expiredExportKeys.length) await bucket.remove(expiredExportKeys);

    const deletedPendingPhotos = await this.registroRepository.deletePhotoRows(staleUploads.map((item) => item.id));
    const deletedIndividualPhotos = await this.registroRepository.hardDeleteExpiredPhotos(softDeleteCutoff);
    const deletedRegistros = await this.registroRepository.hardDeleteExpired(softDeleteCutoff);
    const deletedAlunos = await this.alunoRepository.hardDeleteExpired(softDeleteCutoff);
    const deletedTurmas = await this.turmaRepository.hardDeleteExpired(softDeleteCutoff);
    const deletedAudit = await this.auditRepository.purgeOlderThan(auditCutoff);

    return {
      turmas: deletedTurmas.count,
      alunos: deletedAlunos.count,
      registros: deletedRegistros.count,
      arquivos: storageKeys.length,
      fotosRemovidas: deletedIndividualPhotos.count,
      uploadsPendentes: deletedPendingPhotos.count,
      exportsTemporarios: expiredExportKeys.length,
      auditLogs: deletedAudit.count,
    };
  }
}
