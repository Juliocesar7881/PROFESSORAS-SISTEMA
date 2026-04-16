import { randomUUID } from "node:crypto";
import { startOfWeek } from "date-fns";

import type { CreateObservacaoInput } from "@/dtos/observacao.dto";
import { env } from "@/lib/env";
import { validateAndSanitizeImage } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ObservacaoRepository } from "@/repositories/observacao.repository";

export class ObservacaoService {
  private readonly observacaoRepository = new ObservacaoRepository();

  private async uploadPhotoForObservation(userId: string, observacaoId: string, imageFile: File) {
    const processedBuffer = await validateAndSanitizeImage(imageFile);
    const storageKey = `users/${userId}/observacoes/${observacaoId}/${Date.now()}-${randomUUID()}.jpg`;

    const uploaded = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(storageKey, processedBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploaded.error) {
      throw uploaded.error;
    }

    await this.observacaoRepository.attachPhoto(userId, observacaoId, storageKey);
  }

  async create(userId: string, payload: CreateObservacaoInput, imageFiles: File[] = []) {
    const observacao = await this.observacaoRepository.create(userId, payload);

    if (!imageFiles.length) {
      return {
        observacao,
        upload: {
          success: false,
          message: "Observacao salva sem foto",
        },
      };
    }

    let uploadedCount = 0;
    let failedCount = 0;

    for (const imageFile of imageFiles) {
      try {
        await this.uploadPhotoForObservation(userId, observacao.id, imageFile);
        uploadedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    if (uploadedCount > 0 && failedCount === 0) {
      return {
        observacao,
        upload: {
          success: true,
          uploadedCount,
          failedCount,
          message: uploadedCount === 1 ? "Imagem anexada com sucesso" : `${uploadedCount} imagens anexadas com sucesso`,
        },
      };
    }

    if (uploadedCount > 0 && failedCount > 0) {
      return {
        observacao,
        upload: {
          success: true,
          uploadedCount,
          failedCount,
          message: `${uploadedCount} imagem(ns) salva(s), ${failedCount} falhou(ram).`,
        },
      };
    }

    return {
      observacao,
      upload: {
        success: false,
        uploadedCount,
        failedCount,
        message: "Observacao salva, mas nao foi possivel anexar imagens.",
      },
    };
  }

  async list(userId: string, alunoId: string, categoria?: CreateObservacaoInput["categoria"]) {
    return this.observacaoRepository.listByAluno(userId, alunoId, categoria);
  }

  async remove(userId: string, observacaoId: string) {
    const observacao = await this.observacaoRepository.findOwnedById(userId, observacaoId);
    const storageKeys = observacao.fotos.map((foto) => foto.storageKey).filter(Boolean);

    if (storageKeys.length > 0) {
      const deleted = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove(storageKeys);

      if (deleted.error) {
        console.error("[observacao] falha ao remover fotos do storage", deleted.error);
      }
    }

    await this.observacaoRepository.deleteById(observacao.id);

    return {
      id: observacao.id,
      removedPhotos: storageKeys.length,
    };
  }

  async listRecent(userId: string, limit = 12) {
    return this.observacaoRepository.listRecentByUser(userId, limit);
  }

  async countThisWeek(userId: string) {
    const since = startOfWeek(new Date(), { weekStartsOn: 1 });
    return this.observacaoRepository.countByUserSince(userId, since);
  }
}
