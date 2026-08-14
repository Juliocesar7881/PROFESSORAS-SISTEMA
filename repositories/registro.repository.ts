import { CategoriaObservacao, StatusFotoObservacao, type FotoObservacao, type Prisma } from "@prisma/client";

import type {
  CreateRegistroInput,
  ExportRegistrosInput,
  PresignRegistroFotosInput,
  RegistroQueryInput,
  UpdateRegistroInput,
} from "@/dtos/registro.dto";
import { ConflictError, ValidationError } from "@/dtos/errors";
import { MAX_PHOTOS_PER_RECORD, SIGNED_URL_TTL_SECONDS } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BaseRepository } from "@/repositories/base.repository";

const registroInclude = {
  aluno: {
    select: {
      id: true,
      nome: true,
      turmaId: true,
      turma: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
  fotos: {
    where: { deletedAt: null, status: StatusFotoObservacao.PRONTA },
    orderBy: [{ ordem: "asc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.ObservacaoInclude;

export type RegistroWithRelations = Prisma.ObservacaoGetPayload<{
  include: typeof registroInclude;
}>;

export class RegistroRepository extends BaseRepository {
  private async assertCriancaOwnership(userId: string, alunoId: string) {
    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        userId,
        deletedAt: null,
        turma: { deletedAt: null },
      },
      select: { id: true, nome: true, turmaId: true },
    });

    return this.assertFound(aluno, "Crianca nao encontrada");
  }

  private buildWhere(userId: string, query: Partial<RegistroQueryInput>): Prisma.ObservacaoWhereInput {
    const dateFilter = query.dataInicio || query.dataFim
      ? {
          ...(query.dataInicio ? { gte: query.dataInicio } : {}),
          ...(query.dataFim ? { lte: query.dataFim } : {}),
        }
      : undefined;

    return {
      userId,
      deletedAt: query.lixeira ? { not: null } : null,
      ...(query.alunoId ? { alunoId: query.alunoId } : {}),
      aluno: {
        deletedAt: null,
        turma: { deletedAt: null },
        ...(query.turmaId ? { turmaId: query.turmaId } : {}),
      },
      ...(dateFilter ? { dataRegistro: dateFilter } : {}),
      ...(query.updatedSince ? { updatedAt: { gte: query.updatedSince } } : {}),
      ...(query.q ? {
        OR: [
          { texto: { contains: query.q, mode: "insensitive" } },
          { aluno: { nome: { contains: query.q, mode: "insensitive" } } },
        ],
      } : {}),
    };
  }

  async formatMany(registros: RegistroWithRelations[]) {
    const storageKeys = registros.flatMap((registro) => registro.fotos.map((foto) => foto.storageKey));
    const signed = storageKeys.length
      ? await supabaseAdmin.storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .createSignedUrls(storageKeys, SIGNED_URL_TTL_SECONDS)
      : null;
    const urlByKey = new Map(
      storageKeys.map((storageKey, index) => [storageKey, signed?.data?.[index]?.signedUrl ?? null]),
    );

    return registros.map((registro) => ({
      ...registro,
      fotos: registro.fotos.map((foto) => ({
        ...foto,
        url: urlByKey.get(foto.storageKey) ?? null,
      })),
    }));
  }

  async format(registro: RegistroWithRelations) {
    const [formatted] = await this.formatMany([registro]);
    return formatted;
  }

  async create(userId: string, data: CreateRegistroInput) {
    await this.assertCriancaOwnership(userId, data.alunoId);

    if (data.clientMutationId) {
      const existing = await prisma.observacao.findUnique({
        where: {
          userId_clientMutationId: {
            userId,
            clientMutationId: data.clientMutationId,
          },
        },
        include: registroInclude,
      });

      if (existing) {
        return { registro: existing, duplicated: true };
      }
    }

    const registro = await prisma.observacao.create({
      data: {
        userId,
        alunoId: data.alunoId,
        texto: data.texto,
        dataRegistro: data.dataRegistro,
        clientMutationId: data.clientMutationId ?? null,
        categoria: CategoriaObservacao.APRENDIZAGEM,
      },
      include: registroInclude,
    });

    return { registro, duplicated: false };
  }

  async attachPhoto(
    userId: string,
    registroId: string,
    storageKey: string,
    ordem: number,
    metadata?: { mimeType?: string; tamanhoBytes?: number },
  ) {
    await this.findOwnedById(userId, registroId, true);

    return prisma.fotoObservacao.create({
      data: {
        observacaoId: registroId,
        storageKey,
        ordem,
        status: StatusFotoObservacao.PRONTA,
        mimeType: metadata?.mimeType ?? "image/jpeg",
        tamanhoBytes: metadata?.tamanhoBytes,
      },
    });
  }

  async reservePhotoUploads(userId: string, registroId: string, uploads: PresignRegistroFotosInput["uploads"]) {
    await this.findOwnedById(userId, registroId);
    const uniqueClientIds = new Set(uploads.map((upload) => upload.clientUploadId));
    if (uniqueClientIds.size !== uploads.length) {
      throw new ValidationError("Cada foto precisa de um identificador unico.");
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.fotoObservacao.findMany({
        where: {
          observacaoId: registroId,
          clientUploadId: { in: [...uniqueClientIds] },
        },
      });
      const existingByClientId = new Map(existing.map((photo) => [photo.clientUploadId, photo]));
      const activeCount = await tx.fotoObservacao.count({
        where: { observacaoId: registroId, deletedAt: null },
      });
      const newCount = uploads.filter((upload) => !existingByClientId.has(upload.clientUploadId)).length;

      if (activeCount + newCount > MAX_PHOTOS_PER_RECORD) {
        throw new ValidationError(`Mantenha no maximo ${MAX_PHOTOS_PER_RECORD} imagens por registro.`);
      }

      const reservations: FotoObservacao[] = [];
      for (const upload of uploads) {
        const found = existingByClientId.get(upload.clientUploadId);
        if (found?.status === StatusFotoObservacao.PRONTA && !found.deletedAt) {
          reservations.push(found);
          continue;
        }

        const storageKey = `users/${userId}/registro-uploads/${registroId}/${upload.clientUploadId}.jpg`;
        if (found) {
          reservations.push(await tx.fotoObservacao.update({
            where: { id: found.id },
            data: {
              storageKey,
              status: StatusFotoObservacao.PENDENTE,
              mimeType: upload.mimeType,
              tamanhoBytes: upload.tamanhoBytes,
              erroCodigo: null,
              ordem: upload.ordem,
              deletedAt: null,
            },
          }));
          continue;
        }

        reservations.push(await tx.fotoObservacao.create({
          data: {
            observacaoId: registroId,
            clientUploadId: upload.clientUploadId,
            storageKey,
            status: StatusFotoObservacao.PENDENTE,
            mimeType: upload.mimeType,
            tamanhoBytes: upload.tamanhoBytes,
            ordem: upload.ordem,
          },
        }));
      }

      return reservations;
    });
  }

  async findOwnedPhoto(userId: string, registroId: string, photoId: string) {
    const photo = await prisma.fotoObservacao.findFirst({
      where: {
        id: photoId,
        observacaoId: registroId,
        observacao: { userId, deletedAt: null },
        deletedAt: null,
      },
    });
    return this.assertFound(photo, "Foto nao encontrada");
  }

  async markPhotoReady(photoId: string, storageKey: string, tamanhoBytes: number) {
    return prisma.fotoObservacao.update({
      where: { id: photoId },
      data: {
        storageKey,
        status: StatusFotoObservacao.PRONTA,
        mimeType: "image/jpeg",
        tamanhoBytes,
        erroCodigo: null,
      },
    });
  }

  async markPhotoFailed(photoId: string, errorCode: string) {
    return prisma.fotoObservacao.update({
      where: { id: photoId },
      data: { status: StatusFotoObservacao.FALHOU, erroCodigo: errorCode.slice(0, 80) },
    });
  }

  async cancelPhoto(userId: string, registroId: string, photoId: string) {
    const photo = await this.findOwnedPhoto(userId, registroId, photoId);
    await prisma.fotoObservacao.update({
      where: { id: photo.id },
      data: { deletedAt: new Date() },
    });
    return photo;
  }

  async listStalePhotoUploads(cutoff: Date) {
    return prisma.fotoObservacao.findMany({
      where: {
        status: { in: [StatusFotoObservacao.PENDENTE, StatusFotoObservacao.FALHOU] },
        updatedAt: { lt: cutoff },
      },
      select: { id: true, storageKey: true },
    });
  }

  async deletePhotoRows(ids: string[]) {
    if (!ids.length) return { count: 0 };
    return prisma.fotoObservacao.deleteMany({
      where: {
        id: { in: ids },
        status: { not: StatusFotoObservacao.PRONTA },
      },
    });
  }

  async listDeletedPhotoStorageForPurge(cutoff: Date) {
    return prisma.fotoObservacao.findMany({
      where: { deletedAt: { lt: cutoff } },
      select: { id: true, storageKey: true },
    });
  }

  async hardDeleteExpiredPhotos(cutoff: Date) {
    return prisma.fotoObservacao.deleteMany({ where: { deletedAt: { lt: cutoff } } });
  }

  async list(userId: string, query: RegistroQueryInput) {
    const where = this.buildWhere(userId, query);
    const total = query.includeTotal ? await prisma.observacao.count({ where }) : null;
    const items = await prisma.observacao.findMany({
      where,
      orderBy: [{ dataRegistro: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: registroInclude,
    });

    const hasNext = items.length > query.limit;
    const visible = items.slice(0, query.limit);

    return {
      items: await this.formatMany(visible),
      nextCursor: hasNext ? visible.at(-1)?.id ?? null : null,
      total,
    };
  }

  async findOwnedById(userId: string, registroId: string, includeDeleted = false) {
    const registro = await prisma.observacao.findFirst({
      where: {
        id: registroId,
        userId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: registroInclude,
    });

    return this.assertFound(registro, "Registro nao encontrado");
  }

  async update(userId: string, registroId: string, data: UpdateRegistroInput) {
    const registro = await this.findOwnedById(userId, registroId);

    if (data.expectedUpdatedAt && registro.updatedAt.getTime() !== data.expectedUpdatedAt.getTime()) {
      throw new ConflictError(
        "Este registro foi alterado em outro lugar. Recarregue antes de salvar.",
        { serverUpdatedAt: registro.updatedAt.toISOString() },
      );
    }

    if (data.alunoId && data.alunoId !== registro.alunoId) {
      await this.assertCriancaOwnership(userId, data.alunoId);
    }

    return prisma.observacao.update({
      where: { id: registro.id },
      data: {
        ...(data.alunoId ? { alunoId: data.alunoId } : {}),
        ...(data.texto ? { texto: data.texto } : {}),
        ...(data.dataRegistro ? { dataRegistro: data.dataRegistro } : {}),
      },
      include: registroInclude,
    });
  }

  async markPhotosDeleted(userId: string, registroId: string, photoIds: string[]) {
    if (!photoIds.length) return { count: 0 };
    await this.findOwnedById(userId, registroId);

    return prisma.fotoObservacao.updateMany({
      where: {
        id: { in: photoIds },
        observacaoId: registroId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  async softDelete(userId: string, registroId: string) {
    const registro = await this.findOwnedById(userId, registroId);
    return prisma.observacao.update({
      where: { id: registro.id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(userId: string, registroId: string) {
    const registro = await this.findOwnedById(userId, registroId, true);
    return prisma.observacao.update({
      where: { id: registro.id },
      data: { deletedAt: null },
      include: registroInclude,
    });
  }

  async listSelected(userId: string, ids: string[]) {
    return prisma.observacao.findMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: null,
      },
      orderBy: [{ dataRegistro: "asc" }, { createdAt: "asc" }],
      include: registroInclude,
    });
  }

  async listForExport(userId: string, input: ExportRegistrosInput) {
    if (input.ids?.length) {
      return this.listSelected(userId, input.ids);
    }

    return prisma.observacao.findMany({
      where: this.buildWhere(userId, { ...input.filters, lixeira: false }),
      orderBy: [{ dataRegistro: "desc" }, { createdAt: "desc" }],
      take: 500,
      include: registroInclude,
    });
  }

  async listExpired(cutoff: Date) {
    return prisma.observacao.findMany({
      where: { deletedAt: { lt: cutoff } },
      select: {
        id: true,
        fotos: { select: { storageKey: true } },
      },
    });
  }

  async listStorageForPurge(cutoff: Date) {
    return prisma.observacao.findMany({
      where: {
        OR: [
          { deletedAt: { lt: cutoff } },
          { aluno: { deletedAt: { lt: cutoff } } },
          { aluno: { turma: { deletedAt: { lt: cutoff } } } },
        ],
      },
      select: { fotos: { select: { storageKey: true } } },
    });
  }

  async hardDeleteExpired(cutoff: Date) {
    return prisma.observacao.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    });
  }
}
