import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import { MAX_PHOTO_SIZE_BYTES } from "@/lib/constants";
import { ValidationError } from "@/dtos/errors";

export async function validateAndSanitizeImage(file: File): Promise<Buffer> {
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new ValidationError("Foto excede o limite de 10MB");
  }

  const arrayBuffer = await file.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer);
  const detectedType = await fileTypeFromBuffer(sourceBuffer);

  if (!detectedType || !detectedType.mime.startsWith("image/")) {
    throw new ValidationError("Formato de imagem não suportado");
  }

  try {
    // Re-encode strips EXIF metadata by default.
    return await sharp(sourceBuffer).rotate().jpeg({ quality: 86 }).toBuffer();
  } catch {
    throw new ValidationError("Nao foi possivel processar a imagem. Tente JPG, PNG ou WEBP.");
  }
}

export function sanitizeSentryText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[cpf]")
    .replace(/\b\d{11}\b/g, "[doc]")
    .replace(/\b([A-Z][a-z]+\s){1,4}[A-Z][a-z]+\b/g, "[nome-redigido]");
}
