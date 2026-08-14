import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type {
  ArtesImpressaoExportInput,
  ArtesImpressaoFotosQueryInput,
  ArtesImpressaoPreset,
} from "@/dtos/artes-impressao.dto";
import { ForbiddenError, ValidationError } from "@/dtos/errors";
import { env } from "@/lib/env";
import { validateAndSanitizeImage } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ArtesImpressaoRepository, type ArtesImpressaoPhotoRecord } from "@/repositories/artes-impressao.repository";

type UploadFileInput = {
  id: string;
  file: File;
};

type PdfPhoto = {
  id: string;
  buffer: Buffer;
  alunoNome?: string;
  turmaNome?: string;
  createdAt?: Date;
  relato?: string;
};

type EmbeddedPdfPhoto = Omit<PdfPhoto, "buffer"> & {
  image: Awaited<ReturnType<PDFDocument["embedJpg"]>>;
};

const PAGE_SIZE: [number, number] = [595.28, 841.89];
const PAGE_MARGIN = 36;

type PhotoPreset = Extract<ArtesImpressaoPreset, "one" | "two" | "four" | "grid">;
type StoryPreset = Exclude<ArtesImpressaoPreset, PhotoPreset>;

const presetSlots: Record<PhotoPreset, { columns: number; rows: number; gap: number }> = {
  one: { columns: 1, rows: 1, gap: 0 },
  two: { columns: 1, rows: 2, gap: 16 },
  four: { columns: 2, rows: 2, gap: 14 },
  grid: { columns: 3, rows: 4, gap: 10 },
};

const storySlots: Record<StoryPreset, {
  rows: number;
  gap: number;
  photoRatio: number;
  fontSize: number;
  mode: "alternating" | "left";
}> = {
  "story-two": { rows: 2, gap: 22, photoRatio: 0.46, fontSize: 11, mode: "alternating" },
  "story-three": { rows: 3, gap: 18, photoRatio: 0.42, fontSize: 10, mode: "alternating" },
  "story-four": { rows: 4, gap: 13, photoRatio: 0.36, fontSize: 8.7, mode: "alternating" },
  "story-column": { rows: 3, gap: 18, photoRatio: 0.4, fontSize: 10, mode: "left" },
};

function isStoryPreset(preset: ArtesImpressaoPreset): preset is StoryPreset {
  return preset in storySlots;
}

export class ArtesImpressaoService {
  private readonly artesRepository = new ArtesImpressaoRepository();

  async listPhotos(userId: string, query: ArtesImpressaoFotosQueryInput) {
    const since =
      query.periodo === "todos"
        ? undefined
        : new Date(Date.now() - Number(query.periodo) * 24 * 60 * 60 * 1000);

    return this.artesRepository.listPhotos(userId, {
      turmaId: query.turmaId,
      alunoId: query.alunoId,
      since,
      limit: query.limit,
    });
  }

  private async normalizeImageBuffer(buffer: Buffer) {
    try {
      return await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
    } catch {
      throw new ValidationError("Nao foi possivel preparar uma das imagens para impressao.");
    }
  }

  private async downloadPhoto(storageKey: string) {
    const downloaded = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .download(storageKey);

    if (downloaded.error || !downloaded.data) {
      throw new ValidationError("Nao foi possivel baixar uma das fotos selecionadas.");
    }

    const arrayBuffer = await downloaded.data.arrayBuffer();
    return this.normalizeImageBuffer(Buffer.from(arrayBuffer));
  }

  private normalizeFileNamePart(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private splitTextByWidth(
    text: string,
    font: { widthOfTextAtSize: (text: string, size: number) => number },
    fontSize: number,
    maxWidth: number,
    maxLines = 2,
  ) {
    const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
      }

      current = word;

      if (lines.length >= maxLines) {
        break;
      }
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
    }

    return lines;
  }

  private formatDate(value?: Date) {
    if (!value || Number.isNaN(value.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-BR").format(value);
  }

  private buildPhotoLabel(photo: EmbeddedPdfPhoto, payload: ArtesImpressaoExportInput) {
    const parts = [
      payload.includeAlunoName ? photo.alunoNome : "",
      payload.includeTurmaName ? photo.turmaNome : "",
      payload.includeDate ? this.formatDate(photo.createdAt) : "",
    ].filter(Boolean);

    return parts.join(" | ");
  }

  private drawHeader(
    page: ReturnType<PDFDocument["addPage"]>,
    fonts: {
      title: Awaited<ReturnType<PDFDocument["embedFont"]>>;
      body: Awaited<ReturnType<PDFDocument["embedFont"]>>;
    },
    payload: ArtesImpressaoExportInput,
  ) {
    const title = payload.titulo || "Artes e Impressao";
    let cursorY = page.getHeight() - PAGE_MARGIN;

    page.drawText(title, {
      x: PAGE_MARGIN,
      y: cursorY - 2,
      size: 22,
      font: fonts.title,
      color: rgb(0.13, 0.2, 0.28),
    });
    cursorY -= 26;

    const meta = [payload.nomeEscola, payload.nomeProfessora, payload.dataLabel].filter(Boolean).join(" | ");
    if (meta) {
      page.drawText(meta, {
        x: PAGE_MARGIN,
        y: cursorY,
        size: 10,
        font: fonts.body,
        color: rgb(0.32, 0.42, 0.52),
      });
      cursorY -= 16;
    }

    if (payload.legenda) {
      for (const line of this.splitTextByWidth(payload.legenda, fonts.body, 10, page.getWidth() - PAGE_MARGIN * 2, 2)) {
        page.drawText(line, {
          x: PAGE_MARGIN,
          y: cursorY,
          size: 10,
          font: fonts.body,
          color: rgb(0.26, 0.34, 0.43),
        });
        cursorY -= 14;
      }
    }

    cursorY -= 6;
    page.drawLine({
      start: { x: PAGE_MARGIN, y: cursorY },
      end: { x: page.getWidth() - PAGE_MARGIN, y: cursorY },
      thickness: 1,
      color: rgb(0.86, 0.9, 0.95),
    });

    return cursorY - 18;
  }

  private drawPhotoInBox(
    page: ReturnType<PDFDocument["addPage"]>,
    photo: EmbeddedPdfPhoto,
    box: { x: number; y: number; width: number; height: number },
  ) {
    const scale = Math.min(box.width / photo.image.width, box.height / photo.image.height);
    const width = photo.image.width * scale;
    const height = photo.image.height * scale;

    page.drawImage(photo.image, {
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - height) / 2,
      width,
      height,
    });
  }

  private drawStoryRow(
    page: ReturnType<PDFDocument["addPage"]>,
    photo: EmbeddedPdfPhoto,
    payload: ArtesImpressaoExportInput,
    fonts: {
      title: Awaited<ReturnType<PDFDocument["embedFont"]>>;
      body: Awaited<ReturnType<PDFDocument["embedFont"]>>;
    },
    box: { x: number; y: number; width: number; height: number },
    index: number,
    config: (typeof storySlots)[StoryPreset],
  ) {
    const contentGap = config.rows === 4 ? 12 : 18;
    const photoWidth = (box.width - contentGap) * config.photoRatio;
    const textWidth = box.width - contentGap - photoWidth;
    const photoOnLeft = config.mode === "left" || index % 2 === 0;
    const photoX = photoOnLeft ? box.x : box.x + textWidth + contentGap;
    const textX = photoOnLeft ? box.x + photoWidth + contentGap : box.x;
    const innerPadding = config.rows === 4 ? 5 : 7;

    page.drawRectangle({
      x: photoX,
      y: box.y,
      width: photoWidth,
      height: box.height,
      borderWidth: 0.8,
      borderColor: rgb(0.88, 0.84, 0.87),
      color: rgb(0.995, 0.99, 0.992),
    });
    this.drawPhotoInBox(page, photo, {
      x: photoX + innerPadding,
      y: box.y + innerPadding,
      width: photoWidth - innerPadding * 2,
      height: box.height - innerPadding * 2,
    });

    let cursorY = box.y + box.height - 5;
    const label = this.buildPhotoLabel(photo, payload);
    if (label) {
      const labelLines = this.splitTextByWidth(label, fonts.title, 7.5, textWidth, 2);
      for (const line of labelLines) {
        cursorY -= 9;
        page.drawText(line, {
          x: textX,
          y: cursorY,
          size: 7.5,
          font: fonts.title,
          color: rgb(0.58, 0.34, 0.45),
        });
      }
      cursorY -= 5;
    }

    const lineHeight = config.fontSize * 1.35;
    const availableHeight = Math.max(20, cursorY - box.y - 4);
    const maxLines = Math.max(2, Math.floor(availableHeight / lineHeight));
    const relato = photo.relato?.trim() ?? "";
    const lines = relato
      ? this.splitTextByWidth(relato, fonts.body, config.fontSize, textWidth, maxLines)
      : [];

    for (const line of lines) {
      cursorY -= lineHeight;
      page.drawText(line, {
        x: textX,
        y: cursorY,
        size: config.fontSize,
        font: fonts.body,
        color: rgb(0.22, 0.19, 0.21),
      });
    }
  }

  private drawStoryPages(
    document: PDFDocument,
    photos: EmbeddedPdfPhoto[],
    payload: ArtesImpressaoExportInput,
    fonts: {
      title: Awaited<ReturnType<PDFDocument["embedFont"]>>;
      body: Awaited<ReturnType<PDFDocument["embedFont"]>>;
    },
  ) {
    if (!isStoryPreset(payload.preset)) return;
    const config = storySlots[payload.preset];

    for (let start = 0; start < photos.length; start += config.rows) {
      const pagePhotos = photos.slice(start, start + config.rows);
      const page = document.addPage(PAGE_SIZE);
      const contentTop = this.drawHeader(page, fonts, payload);
      const contentBottom = PAGE_MARGIN;
      const contentHeight = contentTop - contentBottom;
      const rowHeight = (contentHeight - config.gap * (config.rows - 1)) / config.rows;

      pagePhotos.forEach((photo, index) => {
        const y = contentTop - (index + 1) * rowHeight - index * config.gap;
        this.drawStoryRow(
          page,
          photo,
          payload,
          fonts,
          { x: PAGE_MARGIN, y, width: page.getWidth() - PAGE_MARGIN * 2, height: rowHeight },
          index,
          config,
        );
      });
    }
  }

  private async buildPdf(photos: PdfPhoto[], payload: ArtesImpressaoExportInput) {
    const document = await PDFDocument.create();
    const titleFont = await document.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await document.embedFont(StandardFonts.Helvetica);

    const embeddedPhotos: EmbeddedPdfPhoto[] = [];

    for (const photo of photos) {
      embeddedPhotos.push({
        id: photo.id,
        alunoNome: photo.alunoNome,
        turmaNome: photo.turmaNome,
        createdAt: photo.createdAt,
        relato: photo.relato,
        image: await document.embedJpg(photo.buffer),
      });
    }

    if (isStoryPreset(payload.preset)) {
      this.drawStoryPages(
        document,
        embeddedPhotos,
        payload,
        { title: titleFont, body: bodyFont },
      );
      return document.save();
    }

    const config = presetSlots[payload.preset];
    const perPage = config.columns * config.rows;

    for (let start = 0; start < embeddedPhotos.length; start += perPage) {
      const pagePhotos = embeddedPhotos.slice(start, start + perPage);
      const page = document.addPage(PAGE_SIZE);
      const contentTop = this.drawHeader(page, { title: titleFont, body: bodyFont }, payload);
      const contentBottom = PAGE_MARGIN;
      const contentWidth = page.getWidth() - PAGE_MARGIN * 2;
      const contentHeight = contentTop - contentBottom;
      const slotWidth = (contentWidth - config.gap * (config.columns - 1)) / config.columns;
      const slotHeight = (contentHeight - config.gap * (config.rows - 1)) / config.rows;

      pagePhotos.forEach((photo, index) => {
        const row = Math.floor(index / config.columns);
        const column = index % config.columns;
        const x = PAGE_MARGIN + column * (slotWidth + config.gap);
        const y = contentTop - (row + 1) * slotHeight - row * config.gap;
        const label = this.buildPhotoLabel(photo, payload);
        const labelHeight = label ? 24 : 0;
        const padding = payload.preset === "grid" ? 6 : 8;

        page.drawRectangle({
          x,
          y,
          width: slotWidth,
          height: slotHeight,
          borderWidth: 1,
          borderColor: rgb(0.86, 0.9, 0.95),
          color: rgb(1, 1, 1),
        });

        this.drawPhotoInBox(page, photo, {
          x: x + padding,
          y: y + padding + labelHeight,
          width: slotWidth - padding * 2,
          height: Math.max(10, slotHeight - padding * 2 - labelHeight),
        });

        if (label) {
          const labelLines = this.splitTextByWidth(label, bodyFont, payload.preset === "grid" ? 7 : 9, slotWidth - padding * 2, 2);
          labelLines.forEach((line, lineIndex) => {
            page.drawText(line, {
              x: x + padding,
              y: y + padding + (labelLines.length - lineIndex - 1) * 9,
              size: payload.preset === "grid" ? 7 : 9,
              font: bodyFont,
              color: rgb(0.32, 0.42, 0.52),
            });
          });
        }
      });
    }

    return document.save();
  }

  private mapExistingPhoto(record: ArtesImpressaoPhotoRecord, buffer: Buffer): PdfPhoto {
    return {
      id: record.id,
      buffer,
      alunoNome: record.observacao.aluno.nome,
      turmaNome: record.observacao.aluno.turma.nome,
      createdAt: record.observacao.createdAt,
      relato: record.observacao.texto,
    };
  }

  async exportPdf(userId: string, payload: ArtesImpressaoExportInput, uploadFiles: UploadFileInput[]) {
    if (uploadFiles.length > 40) {
      throw new ValidationError("Envie no maximo 40 fotos temporarias por PDF.");
    }

    const uploadIds = new Set(uploadFiles.map((upload) => upload.id));
    if (uploadIds.size !== uploadFiles.length) {
      throw new ValidationError("Fotos temporarias duplicadas no envio.");
    }

    const existingIds = payload.items
      .filter((item) => item.type === "existing")
      .map((item) => item.id);
    const existingRecords = await this.artesRepository.findOwnedPhotosByIds(userId, existingIds);
    const existingById = new Map(existingRecords.map((record) => [record.id, record]));

    if (new Set(existingIds).size !== existingById.size) {
      throw new ForbiddenError("Uma ou mais fotos selecionadas nao pertencem a sua conta.");
    }

    const uploadMetaById = new Map(payload.uploadMeta.map((item) => [item.id, item]));
    const uploadFilesById = new Map(uploadFiles.map((upload) => [upload.id, upload.file]));
    const existingBuffers = new Map<string, Buffer>();
    const uploadBuffers = new Map<string, Buffer>();

    for (const record of existingRecords) {
      existingBuffers.set(record.id, await this.downloadPhoto(record.storageKey));
    }

    for (const upload of uploadFiles) {
      uploadBuffers.set(upload.id, await validateAndSanitizeImage(upload.file));
    }

    const photos: PdfPhoto[] = [];

    for (const item of payload.items) {
      if (item.type === "existing") {
        const record = existingById.get(item.id);
        const buffer = existingBuffers.get(item.id);

        if (!record || !buffer) {
          throw new ForbiddenError("Uma ou mais fotos selecionadas nao pertencem a sua conta.");
        }

        photos.push(this.mapExistingPhoto(record, buffer));
        continue;
      }

      const uploadFile = uploadFilesById.get(item.id);
      const buffer = uploadBuffers.get(item.id);

      if (!uploadFile || !buffer) {
        throw new ValidationError("Uma das fotos temporarias selecionadas nao foi enviada.");
      }

      const meta = uploadMetaById.get(item.id);
      photos.push({
        id: item.id,
        buffer,
        alunoNome: meta?.alunoNome,
        turmaNome: meta?.turmaNome,
        createdAt: meta?.createdAt ?? new Date(),
        relato: meta?.relato,
      });
    }

    const bytes = await this.buildPdf(photos, payload);
    const slugSource = payload.titulo || payload.nomeEscola || "artes-impressao";
    const slug = this.normalizeFileNamePart(slugSource) || "artes-impressao";
    const dateSlug = new Date().toISOString().slice(0, 10);

    return {
      fileName: `${slug}-${dateSlug}.pdf`,
      bytes,
    };
  }
}
