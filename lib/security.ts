import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import { ValidationError } from "@/dtos/errors";
import { MAX_PHOTO_SIZE_BYTES } from "@/lib/constants";

const SUPPORTED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_PIXELS = 40_000_000;

export async function validateAndSanitizeImageBuffer(
  sourceBuffer: Buffer,
  maxInputBytes = MAX_PHOTO_SIZE_BYTES,
): Promise<Buffer> {
  if (sourceBuffer.length > maxInputBytes) {
    throw new ValidationError("Foto excede o limite permitido.");
  }

  const detectedType = await fileTypeFromBuffer(sourceBuffer);
  if (!detectedType || !SUPPORTED_IMAGE_MIMES.has(detectedType.mime)) {
    throw new ValidationError("Formato de imagem nao suportado. Tente JPG, PNG ou WEBP.");
  }

  try {
    const image = sharp(sourceBuffer, { limitInputPixels: MAX_IMAGE_PIXELS });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      throw new ValidationError("A foto possui dimensoes grandes demais.");
    }

    // Re-encoding strips EXIF and caps dimensions for predictable storage costs.
    return await image
      .rotate()
      .resize({ width: 1440, height: 1440, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Nao foi possivel processar a imagem. Tente JPG, PNG ou WEBP.");
  }
}

export async function validateAndSanitizeImage(file: File): Promise<Buffer> {
  return validateAndSanitizeImageBuffer(Buffer.from(await file.arrayBuffer()));
}

export function sanitizeSentryText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[cpf]")
    .replace(/\b\d{11}\b/g, "[doc]")
    .replace(/\b([A-Z][a-z]+\s){1,4}[A-Z][a-z]+\b/g, "[nome-redigido]");
}
