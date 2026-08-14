import { randomUUID } from "node:crypto";

import { gateway } from "@ai-sdk/gateway";
import { StatusFotoObservacao } from "@prisma/client";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { transcribe } from "ai";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import type {
  CreateRegistroInput,
  ExportRegistrosInput,
  PresignRegistroFotosInput,
  RegistroQueryInput,
  UpdateRegistroInput,
} from "@/dtos/registro.dto";
import {
  PayloadTooLargeError,
  PhotoUploadNotReadyError,
  ServiceUnavailableError,
  UnsupportedMediaTypeError,
  ValidationError,
} from "@/dtos/errors";
import {
  EXPORT_URL_TTL_SECONDS,
  MAX_DIRECT_PHOTO_SIZE_BYTES,
  MAX_PHOTOS_PER_RECORD,
} from "@/lib/constants";
import { env } from "@/lib/env";
import { transcribeGoogleAudio } from "@/lib/google-ai";
import { logServerError } from "@/lib/http";
import { validateAndSanitizeImage, validateAndSanitizeImageBuffer } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RegistroRepository, type RegistroWithRelations } from "@/repositories/registro.repository";

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_INLINE_GEMINI_AUDIO_SIZE_BYTES = 18 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set(["webm", "m4a", "mp4", "mp3", "wav", "ogg", "oga"]);
const AUDIO_CONTAINER_MIMES = new Set([
  "audio/webm",
  "video/webm",
  "audio/mp4",
  "video/mp4",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "application/ogg",
  "audio/m4a",
]);

function baseMime(value: string) {
  return value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function fileExtension(name: string) {
  return name.toLowerCase().split(".").pop()?.trim() ?? "";
}

function normalizeGeminiAudioMime(value: string) {
  if (value === "video/webm") return "audio/webm";
  if (value === "video/mp4" || value === "audio/x-m4a" || value === "audio/m4a") return "audio/mp4";
  if (value === "application/ogg") return "audio/ogg";
  if (value === "audio/mpeg") return "audio/mp3";
  return value || "audio/webm";
}

function hasKnownAudioSignature(buffer: Buffer) {
  if (buffer.length < 12) return false;
  const header = buffer.subarray(0, 12);
  if (header.subarray(0, 4).toString("ascii") === "OggS") return true;
  if (header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WAVE") return true;
  if (header.subarray(0, 3).toString("ascii") === "ID3") return true;
  if (header[0] === 0xff && (header[1] & 0xe0) === 0xe0) return true;
  if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) return true;
  if (header.subarray(4, 8).toString("ascii") === "ftyp") return true;
  return false;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
}

export class RegistroService {
  private readonly repository = new RegistroRepository();

  private async uploadPhoto(userId: string, registroId: string, file: File, ordem: number) {
    const buffer = await validateAndSanitizeImage(file);
    const storageKey = `users/${userId}/registros/${registroId}/${Date.now()}-${randomUUID()}.jpg`;
    const uploaded = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(storageKey, buffer, { contentType: "image/jpeg", upsert: false });

    if (uploaded.error) throw uploaded.error;
    await this.repository.attachPhoto(userId, registroId, storageKey, ordem, {
      mimeType: "image/jpeg",
      tamanhoBytes: buffer.length,
    });
  }

  private validatePhotos(files: File[]) {
    if (files.length > MAX_PHOTOS_PER_RECORD) {
      throw new ValidationError(`Envie no maximo ${MAX_PHOTOS_PER_RECORD} imagens por registro.`);
    }
  }

  async create(userId: string, payload: CreateRegistroInput, files: File[]) {
    this.validatePhotos(files);
    const created = await this.repository.create(userId, payload);

    if (created.duplicated) {
      let uploadedCount = 0;
      let failedCount = 0;
      const existingCount = created.registro.fotos.length;

      for (const [offset, file] of files.slice(existingCount).entries()) {
        try {
          await this.uploadPhoto(userId, created.registro.id, file, existingCount + offset);
          uploadedCount += 1;
        } catch (error) {
          failedCount += 1;
          logServerError("[registro] retry photo upload failed", error, {
            userId,
            registroId: created.registro.id,
          });
        }
      }

      return {
        registro: await this.repository.format(await this.repository.findOwnedById(userId, created.registro.id)),
        duplicated: true,
        upload: { uploadedCount, failedCount },
      };
    }

    let uploadedCount = 0;
    let failedCount = 0;

    for (const [index, file] of files.entries()) {
      try {
        await this.uploadPhoto(userId, created.registro.id, file, index);
        uploadedCount += 1;
      } catch (error) {
        failedCount += 1;
        logServerError("[registro] photo upload failed", error, {
          userId,
          registroId: created.registro.id,
        });
      }
    }

    const registro = await this.repository.findOwnedById(userId, created.registro.id);
    return {
      registro: await this.repository.format(registro),
      duplicated: false,
      upload: { uploadedCount, failedCount },
    };
  }

  async list(userId: string, query: RegistroQueryInput) {
    return this.repository.list(userId, query);
  }

  async find(userId: string, registroId: string) {
    return this.repository.format(await this.repository.findOwnedById(userId, registroId));
  }

  async update(userId: string, registroId: string, payload: UpdateRegistroInput, files: File[]) {
    const current = await this.repository.findOwnedById(userId, registroId);
    const remainingPhotos = current.fotos.filter((foto) => !payload.removeFotoIds.includes(foto.id)).length;

    if (remainingPhotos + files.length > MAX_PHOTOS_PER_RECORD) {
      throw new ValidationError(`Mantenha no maximo ${MAX_PHOTOS_PER_RECORD} imagens por registro.`);
    }

    await this.repository.markPhotosDeleted(userId, registroId, payload.removeFotoIds);
    await this.repository.update(userId, registroId, payload);

    let uploadedCount = 0;
    let failedCount = 0;
    for (const [index, file] of files.entries()) {
      try {
        await this.uploadPhoto(userId, registroId, file, remainingPhotos + index);
        uploadedCount += 1;
      } catch (error) {
        failedCount += 1;
        logServerError("[registro] update photo upload failed", error, { userId, registroId });
      }
    }

    const registro = await this.repository.findOwnedById(userId, registroId);
    return {
      registro: await this.repository.format(registro),
      upload: { uploadedCount, failedCount },
    };
  }

  async remove(userId: string, registroId: string) {
    return this.repository.softDelete(userId, registroId);
  }

  async restore(userId: string, registroId: string) {
    const registro = await this.repository.restore(userId, registroId);
    return this.repository.format(registro);
  }

  async presignPhotoUploads(userId: string, registroId: string, input: PresignRegistroFotosInput) {
    const reservations = await this.repository.reservePhotoUploads(userId, registroId, input.uploads);
    const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET);

    return Promise.all(reservations.map(async (photo) => {
      if (photo.status === StatusFotoObservacao.PRONTA) {
        return {
          photoId: photo.id,
          clientUploadId: photo.clientUploadId,
          status: "ready" as const,
          path: photo.storageKey,
          signedUrl: null,
          token: null,
        };
      }

      const signed = await bucket.createSignedUploadUrl(photo.storageKey, { upsert: true });
      if (signed.error || !signed.data) {
        await this.repository.markPhotoFailed(photo.id, "SIGNING_FAILED");
        logServerError("[registro] failed to sign photo upload", signed.error, {
          userId,
          registroId,
          photoId: photo.id,
        });
        throw new ServiceUnavailableError("Nao foi possivel preparar o envio da foto.");
      }

      return {
        photoId: photo.id,
        clientUploadId: photo.clientUploadId,
        status: "pending" as const,
        path: signed.data.path,
        signedUrl: signed.data.signedUrl,
        token: signed.data.token,
      };
    }));
  }

  async confirmPhotoUpload(userId: string, registroId: string, photoId: string) {
    const photo = await this.repository.findOwnedPhoto(userId, registroId, photoId);
    if (photo.status === StatusFotoObservacao.PRONTA) {
      return this.repository.format(await this.repository.findOwnedById(userId, registroId));
    }

    const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET);
    const downloaded = await bucket.download(photo.storageKey);
    if (downloaded.error || !downloaded.data) {
      await this.repository.markPhotoFailed(photo.id, "UPLOAD_NOT_FOUND");
      throw new PhotoUploadNotReadyError("A foto ainda nao chegou ao armazenamento. Tente enviar novamente.");
    }

    if (downloaded.data.size > MAX_DIRECT_PHOTO_SIZE_BYTES) {
      await this.repository.markPhotoFailed(photo.id, "FILE_TOO_LARGE");
      await bucket.remove([photo.storageKey]);
      throw new PayloadTooLargeError("A foto ultrapassou 1,25 MB depois da compactacao.");
    }

    const stagingBuffer = Buffer.from(await downloaded.data.arrayBuffer());
    try {
      const sanitized = await validateAndSanitizeImageBuffer(stagingBuffer, MAX_DIRECT_PHOTO_SIZE_BYTES);
      const finalKey = `users/${userId}/registros/${registroId}/${photo.id}.jpg`;
      const uploaded = await bucket.upload(finalKey, sanitized, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: true,
      });
      if (uploaded.error) {
        logServerError("[registro] failed to finalize photo", uploaded.error, {
          userId,
          registroId,
          photoId,
        });
        throw new ServiceUnavailableError("A foto foi recebida, mas ainda nao foi finalizada.");
      }

      await this.repository.markPhotoReady(photo.id, finalKey, sanitized.length);
      if (photo.storageKey !== finalKey) {
        const removed = await bucket.remove([photo.storageKey]);
        if (removed.error) {
          logServerError("[registro] failed to remove staged photo", removed.error, { photoId });
        }
      }

      return this.repository.format(await this.repository.findOwnedById(userId, registroId));
    } catch (error) {
      if (error instanceof ValidationError) {
        await this.repository.markPhotoFailed(photo.id, "INVALID_IMAGE");
        await bucket.remove([photo.storageKey]);
        throw new UnsupportedMediaTypeError("A imagem enviada esta corrompida ou em formato invalido.");
      }
      throw error;
    }
  }

  async cancelPhotoUpload(userId: string, registroId: string, photoId: string) {
    const photo = await this.repository.cancelPhoto(userId, registroId, photoId);
    const removed = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([photo.storageKey]);
    if (removed.error) {
      logServerError("[registro] failed to remove cancelled photo", removed.error, {
        userId,
        registroId,
        photoId,
      });
    }
    return { removed: true };
  }

  async transcribeAudio(audio: File, language = "pt") {
    if (!audio.size || audio.size > MAX_AUDIO_SIZE_BYTES) {
      throw new ValidationError("O audio deve ter no maximo 25 MB e cerca de 5 minutos.");
    }

    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const declaredMime = baseMime(audio.type);
    const extension = fileExtension(audio.name);
    const detectedType = await fileTypeFromBuffer(audioBuffer);
    const detectedMime = detectedType ? baseMime(detectedType.mime) : "";
    const validDeclaredContainer = AUDIO_CONTAINER_MIMES.has(declaredMime);
    const validDetectedContainer = AUDIO_CONTAINER_MIMES.has(detectedMime);
    const validExtension = AUDIO_EXTENSIONS.has(extension);

    // MediaRecorder commonly returns audio/webm;codecs=opus while file-type
    // identifies the same audio-only container as video/webm. Both are valid.
    if (
      !validDetectedContainer
      && !hasKnownAudioSignature(audioBuffer)
      && !(validDeclaredContainer && validExtension)
    ) {
      throw new ValidationError("Formato de audio nao suportado. Use WEBM, M4A, MP3, WAV ou OGG.");
    }

    if (audioBuffer.length <= MAX_INLINE_GEMINI_AUDIO_SIZE_BYTES && env.GEMINI_API_KEY) {
      const geminiResult = await transcribeGoogleAudio({
        audio: audioBuffer,
        language,
        mimeType: normalizeGeminiAudioMime(detectedMime || declaredMime),
      });
      const text = geminiResult?.text.trim();
      if (geminiResult && text) {
        return {
          text,
          language,
          durationInSeconds: null,
          model: geminiResult.model,
        };
      }
    }

    try {
      const result = await transcribe({
        model: gateway.transcriptionModel("xai/grok-stt"),
        audio: new Uint8Array(audioBuffer),
        providerOptions: {
          xai: { language },
        },
      });

      if (result.durationInSeconds && result.durationInSeconds > 305) {
        throw new ValidationError("O audio ultrapassou o limite de 5 minutos.");
      }

      const text = result.text.trim();
      if (!text) throw new ServiceUnavailableError("Nao foi possivel reconhecer a fala.");

      return {
        text,
        language: result.language || language,
        durationInSeconds: result.durationInSeconds ?? null,
        model: "xai/grok-stt",
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ServiceUnavailableError) throw error;
      logServerError("[registro] transcription failed", error);
      throw new ServiceUnavailableError("A transcricao esta indisponivel agora. O audio nao foi armazenado.");
    }
  }

  private async downloadImage(storageKey: string) {
    const downloaded = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).download(storageKey);
    if (downloaded.error || !downloaded.data) return null;

    const source = Buffer.from(await downloaded.data.arrayBuffer());
    const metadata = await sharp(source).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;
    const scale = Math.min(520 / width, 320 / height, 1);
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));
    const data = await sharp(source)
      .rotate()
      .resize({ width: outputWidth, height: outputHeight, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 84 })
      .toBuffer();

    return { data, width: outputWidth, height: outputHeight };
  }

  private async recordParagraphs(registro: RegistroWithRelations) {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 260, after: 80 },
        children: [new TextRun({ text: `${formatDate(registro.dataRegistro)} - ${registro.aluno.nome}`, bold: true })],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: `Turma: ${registro.aluno.turma.nome}`, color: "6B5B66", size: 20 })],
      }),
      ...registro.texto.split(/\n+/).filter(Boolean).map((text) => new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text, size: 23 })],
      })),
    ];

    for (const foto of registro.fotos) {
      const image = await this.downloadImage(foto.storageKey);
      if (!image) continue;
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 120 },
        children: [new ImageRun({
          data: image.data,
          type: "jpg",
          transformation: { width: image.width, height: image.height },
        })],
      }));
    }

    return paragraphs;
  }

  async exportWord(userId: string, input: ExportRegistrosInput) {
    const registros = await this.repository.listForExport(userId, input);
    if (!registros.length) throw new ValidationError("Nenhum registro encontrado para exportar.");

    const children: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Registros pedagogicos", bold: true, color: "6A4562" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
        children: [new TextRun({ text: "Pequenos Passos", color: "6757C8", size: 20 })],
      }),
    ];

    for (const registro of registros) {
      children.push(...await this.recordParagraphs(registro));
    }

    const document = new Document({ sections: [{ children }] });
    const bytes = await Packer.toBuffer(document);
    const firstChild = registros.every((item) => item.alunoId === registros[0].alunoId)
      ? slugify(registros[0].aluno.nome)
      : "geral";
    const date = new Date().toISOString().slice(0, 10);

    return {
      bytes,
      fileName: `registros-${firstChild || "pedagogicos"}-${date}.docx`,
      count: registros.length,
    };
  }

  async exportWordToUrl(userId: string, input: ExportRegistrosInput) {
    const result = await this.exportWord(userId, input);
    const storageKey = `temp-exports/${Date.now()}-${randomUUID()}.docx`;
    const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET);
    const uploaded = await bucket.upload(storageKey, result.bytes, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      cacheControl: "900",
      upsert: false,
    });
    if (uploaded.error) {
      logServerError("[registro] failed to store Word export", uploaded.error, { userId });
      throw new ServiceUnavailableError("Nao foi possivel preparar o arquivo Word.");
    }

    const signed = await bucket.createSignedUrl(storageKey, EXPORT_URL_TTL_SECONDS, {
      download: result.fileName,
    });
    if (signed.error || !signed.data?.signedUrl) {
      await bucket.remove([storageKey]);
      throw new ServiceUnavailableError("Nao foi possivel liberar o download do Word.");
    }

    return {
      downloadUrl: signed.data.signedUrl,
      fileName: result.fileName,
      count: result.count,
      expiresAt: new Date(Date.now() + EXPORT_URL_TTL_SECONDS * 1000).toISOString(),
    };
  }
}
