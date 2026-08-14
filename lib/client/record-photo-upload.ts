const PHOTO_TARGET_BYTES = 900 * 1024;
const PHOTO_MAX_BYTES = Math.round(1.25 * 1024 * 1024);
const PHOTO_MAX_SIDE = 1440;

export type PreparedRecordPhoto = {
  clientUploadId: string;
  file: File;
  order: number;
};

type SignedReservation = {
  photoId: string;
  clientUploadId: string;
  status: "ready" | "pending";
  signedUrl: string | null;
};

type ApiEnvelope<T> = { data: T; error: null } | { data: null; error: { message?: string } };

function errorMessage(json: unknown, fallback: string) {
  if (json && typeof json === "object" && "error" in json) {
    const value = (json as { error?: { message?: string } }).error?.message;
    if (value) return value;
  }
  return fallback;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("O navegador nao conseguiu preparar a imagem.")),
      "image/jpeg",
      quality,
    );
  });
}

async function loadImage(file: File) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = document.createElement("img");
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressRecordPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} nao e uma imagem valida.`);
  const image = await loadImage(file);
  const sourceWidth = "naturalWidth" in image ? image.naturalWidth : image.width;
  const sourceHeight = "naturalHeight" in image ? image.naturalHeight : image.height;
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(sourceWidth, sourceHeight));
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("O navegador nao conseguiu processar a imagem.");

  let blob: Blob | null = null;
  const qualities = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34];
  for (const [index, quality] of qualities.entries()) {
    if (index === 4 && blob && blob.size > PHOTO_MAX_BYTES) {
      const smallerScale = Math.min(1, 1200 / Math.max(width, height));
      width = Math.max(1, Math.round(width * smallerScale));
      height = Math.max(1, Math.round(height * smallerScale));
    }
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    blob = await canvasBlob(canvas, quality);
    if (blob.size <= PHOTO_TARGET_BYTES) break;
  }

  if ("close" in image && typeof image.close === "function") image.close();
  if (!blob || blob.size > PHOTO_MAX_BYTES) {
    throw new Error(`${file.name} continuou maior que 1,25 MB apos a compactacao.`);
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function prepareRecordPhotos(files: File[], startOrder = 0) {
  const prepared: PreparedRecordPhoto[] = [];
  for (const [index, source] of files.slice(0, 6).entries()) {
    prepared.push({
      clientUploadId: crypto.randomUUID(),
      file: await compressRecordPhoto(source),
      order: startOrder + index,
    });
  }
  return prepared;
}

async function presign(recordId: string, photo: PreparedRecordPhoto) {
  const response = await fetch(`/api/registros/${recordId}/fotos/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploads: [{
        clientUploadId: photo.clientUploadId,
        mimeType: "image/jpeg",
        tamanhoBytes: photo.file.size,
        ordem: photo.order,
      }],
    }),
  });
  const json = await response.json() as ApiEnvelope<{ uploads: SignedReservation[] }>;
  if (!response.ok || json.data === null) throw new Error(errorMessage(json, "Falha ao preparar o envio da foto."));
  const reservation = json.data.uploads[0];
  if (!reservation) throw new Error("O servidor nao reservou a foto.");
  return reservation;
}

async function uploadOne(recordId: string, photo: PreparedRecordPhoto) {
  const reservation = await presign(recordId, photo);
  if (reservation.status === "ready") return;
  if (!reservation.signedUrl) throw new Error("O link de envio da foto nao foi criado.");

  const upload = await fetch(reservation.signedUrl, {
    method: "PUT",
    headers: {
      "x-upsert": "true",
      "content-type": "image/jpeg",
      "cache-control": "max-age=3600",
    },
    body: photo.file,
  });
  if (!upload.ok) {
    throw new Error(upload.status === 413
      ? "A foto ficou grande demais para o armazenamento."
      : "A foto nao chegou ao armazenamento. Tente novamente.");
  }

  const confirmation = await fetch(`/api/registros/${recordId}/fotos/${reservation.photoId}/confirmar`, {
    method: "POST",
  });
  const json = await confirmation.json() as ApiEnvelope<unknown>;
  if (!confirmation.ok || json.data === null) throw new Error(errorMessage(json, "Falha ao confirmar a foto."));
}

export async function uploadRecordPhotos(
  recordId: string,
  photos: PreparedRecordPhoto[],
  onProgress?: (completed: number, total: number, failed: number) => void,
) {
  let cursor = 0;
  let completed = 0;
  const failed: Array<PreparedRecordPhoto & { error: string }> = [];
  const workers = Array.from({ length: Math.min(2, photos.length) }, async () => {
    while (cursor < photos.length) {
      const photo = photos[cursor];
      cursor += 1;
      try {
        await uploadOne(recordId, photo);
      } catch (error) {
        failed.push({ ...photo, error: error instanceof Error ? error.message : "Falha ao enviar foto." });
      } finally {
        completed += 1;
        onProgress?.(completed, photos.length, failed.length);
      }
    }
  });
  await Promise.all(workers);
  return { failed, uploadedCount: photos.length - failed.length };
}
