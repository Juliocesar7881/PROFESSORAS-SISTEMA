import Constants from "expo-constants";
import { File, Paths, UploadType } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type {
  ApiResult,
  Crianca,
  OfflineDraft,
  PendingPhotoUpload,
  Registro,
  Turma,
  User,
} from "./types";

export const API_URL = String(
  process.env.EXPO_PUBLIC_API_URL
  || Constants.expoConfig?.extra?.apiUrl
  || "https://professoras-sistema-main.vercel.app",
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function fallbackForStatus(status: number) {
  if (status === 401 || status === 403) return "Sua sessao expirou. Entre novamente para continuar a sincronizacao.";
  if (status === 413) return "O arquivo ficou grande demais para ser enviado.";
  if (status === 415) return "Este formato de arquivo nao e aceito.";
  if (status === 429) return "Muitos envios em pouco tempo. Aguarde um minuto e tente novamente.";
  if (status >= 500) return "O servidor esta indisponivel no momento. O envio sera retomado automaticamente.";
  return "Nao foi possivel concluir esta operacao.";
}

async function parse<T>(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      response.ok ? "Resposta inesperada do servidor." : fallbackForStatus(response.status),
      response.status,
      response.status === 413 ? "FILE_TOO_LARGE" : "NON_JSON_RESPONSE",
    );
  }

  let json: ApiResult<T>;
  try {
    json = await response.json() as ApiResult<T>;
  } catch {
    throw new ApiError(fallbackForStatus(response.status), response.status, "INVALID_RESPONSE");
  }

  if (!response.ok || json.data === null) {
    const apiError = json.data === null ? json.error : null;
    throw new ApiError(
      apiError?.message || fallbackForStatus(response.status),
      response.status,
      apiError?.code,
      apiError?.details,
      apiError?.requestId,
    );
  }
  return json.data;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error && error.name === "AbortError"
        ? "A conexao demorou demais. O envio sera tentado novamente."
        : "Sem internet no momento. O registro continua protegido no aparelho.",
      0,
      error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "OFFLINE",
    );
  } finally {
    clearTimeout(timer);
  }
}

export function readableSyncError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : "Falha inesperada durante a sincronizacao.";
  }
  if (error.code === "OFFLINE") return "Sem internet. A foto continua protegida no aparelho.";
  if (error.code === "TIMEOUT") return "O envio demorou demais e sera retomado automaticamente.";
  if (error.status === 401 || error.status === 403) return "Sessao expirada. Entre novamente sem perder seus rascunhos.";
  if (error.code === "FILE_TOO_LARGE" || error.status === 413) return "A foto ficou maior que 1,25 MB apos a compactacao.";
  if (error.code === "INVALID_IMAGE" || error.status === 415) return "A imagem esta corrompida ou em formato invalido.";
  if (error.code === "LOCAL_FILE_MISSING") return "A foto nao existe mais neste aparelho.";
  if (error.code === "SIGNED_URL_EXPIRED") return "O link da foto expirou. Um novo envio sera preparado.";
  if (error.code === "PHOTO_UPLOAD_NOT_READY") return "A foto nao chegou completa ao armazenamento. O envio sera repetido.";
  if (error.status >= 500) return "Servidor temporariamente indisponivel. Tentaremos de novo.";
  return error.message;
}

export async function request<T>(token: string, path: string, init?: RequestInit, timeoutMs = 25000) {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetchWithTimeout(`${API_URL}${path}`, { ...init, headers }, timeoutMs);
  return parse<T>(response);
}

export async function publicRequest<T>(path: string) {
  return parse<T>(await fetchWithTimeout(`${API_URL}${path}`, { headers: { Accept: "application/json" } }, 12000));
}

export async function exchangeCode(code: string) {
  return parse<{ token: string; expiresAt: string; user: User }>(await fetchWithTimeout(`${API_URL}/api/mobile/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, deviceName: `Pequenos Passos Android ${Constants.expoConfig?.version || ""}`.trim() }),
  }));
}

export async function loadBase(token: string) {
  const turmas = await request<Turma[]>(token, "/api/turmas");
  const criancas: Crianca[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const page: { items: Crianca[]; nextCursor?: string | null } = await request(token, `/api/criancas?${params}`);
    criancas.push(...page.items);
    cursor = page.nextCursor || null;
  } while (cursor && criancas.length < 5000);

  return { turmas, criancas };
}

export async function createRegistro(token: string, draft: OfflineDraft) {
  return request<{ registro: Registro; duplicated: boolean; upload?: { uploadedCount: number; failedCount: number } }>(
    token,
    "/api/registros",
    {
      method: "POST",
      body: JSON.stringify({
        alunoId: draft.alunoId,
        texto: draft.texto,
        dataRegistro: draft.dataRegistro,
        clientMutationId: draft.clientMutationId,
      }),
    },
  );
}

export type SignedPhotoReservation = {
  photoId: string;
  clientUploadId: string;
  status: "ready" | "pending";
  path: string;
  signedUrl: string | null;
  token: string | null;
};

export async function presignRegistroPhoto(token: string, upload: PendingPhotoUpload) {
  const result = await request<{ uploads: SignedPhotoReservation[] }>(
    token,
    `/api/registros/${upload.recordId}/fotos/presign`,
    {
      method: "POST",
      body: JSON.stringify({
        uploads: [{
          clientUploadId: upload.clientUploadId,
          mimeType: upload.type,
          tamanhoBytes: upload.size,
          ordem: upload.order,
        }],
      }),
    },
  );
  const reservation = result.uploads[0];
  if (!reservation) throw new ApiError("O servidor nao reservou a foto.", 500, "MISSING_UPLOAD_RESERVATION");
  return reservation;
}

export async function uploadSignedPhoto(
  reservation: SignedPhotoReservation,
  upload: PendingPhotoUpload,
  onProgress?: (progress: number) => void,
) {
  if (reservation.status === "ready") return;
  if (!reservation.signedUrl) throw new ApiError("Link de envio ausente.", 500, "MISSING_SIGNED_URL");
  const file = new File(upload.uri);
  if (!file.exists) throw new ApiError("A foto nao existe mais neste aparelho.", 0, "LOCAL_FILE_MISSING");
  if (file.size > Math.round(1.25 * 1024 * 1024)) {
    throw new ApiError("A foto ficou maior que 1,25 MB apos a compactacao.", 413, "FILE_TOO_LARGE");
  }

  let result: Awaited<ReturnType<typeof file.upload>>;
  try {
    const task = file.createUploadTask(reservation.signedUrl, {
      httpMethod: "PUT",
      uploadType: UploadType.BINARY_CONTENT,
      mimeType: "image/jpeg",
      headers: {
        "x-upsert": "true",
        "content-type": "image/jpeg",
        "cache-control": "max-age=3600",
      },
      onProgress: ({ bytesSent, totalBytes }) => {
        if (totalBytes > 0) onProgress?.(Math.max(0, Math.min(1, bytesSent / totalBytes)));
      },
    });
    result = await task.uploadAsync();
  } catch (error) {
    throw new ApiError(
      "Sem conexao com o armazenamento. A foto continua protegida no aparelho.",
      0,
      error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "OFFLINE",
    );
  }

  if (result.status < 200 || result.status >= 300) {
    const message = result.status === 413
      ? "A foto foi recusada por ser muito grande."
      : result.status === 400 || result.status === 401 || result.status === 403
        ? "O link de envio da foto expirou. Um novo link sera gerado."
        : "O armazenamento de fotos esta indisponivel no momento.";
    const code = result.status === 413
      ? "FILE_TOO_LARGE"
      : [400, 401, 403].includes(result.status)
        ? "SIGNED_URL_EXPIRED"
        : "STORAGE_UPLOAD_FAILED";
    throw new ApiError(message, result.status, code, result.body?.slice(0, 300));
  }
  onProgress?.(1);
}

export async function confirmRegistroPhoto(token: string, recordId: string, photoId: string) {
  return request<{ registro: Registro }>(
    token,
    `/api/registros/${recordId}/fotos/${photoId}/confirmar`,
    { method: "POST" },
    30000,
  );
}

export async function cancelRegistroPhoto(token: string, recordId: string, photoId: string) {
  return request<unknown>(token, `/api/registros/${recordId}/fotos/${photoId}`, { method: "DELETE" });
}

export async function updateRegistro(
  token: string,
  id: string,
  payload: { texto: string; dataRegistro: string; alunoId: string; removeFotoIds?: string[]; expectedUpdatedAt?: string },
) {
  return request<{ registro: Registro } | Registro>(token, `/api/registros/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getRegistro(token: string, id: string) {
  return request<Registro>(token, `/api/registros/${id}`);
}

export async function exportWord(token: string, payload: object) {
  const result = await request<{
    downloadUrl: string;
    fileName: string;
    count: number;
    expiresIn: number;
  }>(token, "/api/registros/export", {
    method: "POST",
    body: JSON.stringify({ ...payload, delivery: "url" }),
  }, 60000);
  const destination = new File(Paths.cache, result.fileName || `registros-${Date.now()}.docx`);
  if (destination.exists) destination.delete();
  const file = await File.downloadFileAsync(result.downloadUrl, destination, { idempotent: true });
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    dialogTitle: "Compartilhar registros",
  });
}

export type MobileConfig = {
  latestVersion: string;
  minimumVersion: string;
  apkUrl: string | null;
  maintenance: boolean;
};
