import { randomUUID } from "node:crypto";
import { startOfWeek } from "date-fns";

import type { CreateObservacaoInput } from "@/dtos/observacao.dto";
import { env } from "@/lib/env";
import { validateAndSanitizeImage } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ObservacaoRepository } from "@/repositories/observacao.repository";

export class ObservacaoService {
  private readonly observacaoRepository = new ObservacaoRepository();

  async create(userId: string, payload: CreateObservacaoInput, imageFile?: File | null) {
    const observacao = await this.observacaoRepository.create(userId, payload);

    if (!imageFile) {
      return {
        observacao,
        upload: {
          success: false,
          message: "Observacao salva sem foto",
        },
      };
    }

    try {
      const processedBuffer = await validateAndSanitizeImage(imageFile);
      const storageKey = `${randomUUID()}.jpg`;

      const uploaded = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .upload(storageKey, processedBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploaded.error) {
        throw uploaded.error;
      }

      await this.observacaoRepository.attachPhoto(userId, observacao.id, storageKey);

      return {
        observacao,
        upload: {
          success: true,
          message: "Foto anexada com sucesso",
        },
      };
    } catch {
      // Retry once without blocking the main observation flow.
      queueMicrotask(async () => {
        try {
          const processedBuffer = await validateAndSanitizeImage(imageFile);
          const storageKey = `${randomUUID()}.jpg`;

          const uploaded = await supabaseAdmin.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .upload(storageKey, processedBuffer, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (!uploaded.error) {
            await this.observacaoRepository.attachPhoto(userId, observacao.id, storageKey);
          }
        } catch {
          // Final failure intentionally ignored to keep text flow resilient.
        }
      });

      return {
        observacao,
        upload: {
          success: false,
          message: "Observacao salva. Foto em tentativa de reenvio",
        },
      };
    }
  }

  async list(userId: string, alunoId: string, categoria?: CreateObservacaoInput["categoria"]) {
    return this.observacaoRepository.listByAluno(userId, alunoId, categoria);
  }

  async listRecent(userId: string, limit = 12) {
    return this.observacaoRepository.listRecentByUser(userId, limit);
  }

  async countThisWeek(userId: string) {
    const since = startOfWeek(new Date(), { weekStartsOn: 1 });
    return this.observacaoRepository.countByUserSince(userId, since);
  }
}
