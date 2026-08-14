import type { PendingPhotoUpload } from "../types";

type UploadError = { code?: string; status?: number };

const TERMINAL_CODES = new Set([
  "FILE_TOO_LARGE",
  "INVALID_IMAGE",
  "LOCAL_FILE_MISSING",
  "UNSUPPORTED_MEDIA_TYPE",
]);

const RESET_RESERVATION_CODES = new Set([
  "SIGNED_URL_EXPIRED",
  "PHOTO_UPLOAD_NOT_READY",
  "NOT_FOUND",
]);

export type PhotoFailureDecision = {
  phase: PendingPhotoUpload["phase"];
  retryable: boolean;
  clearRemotePhotoId: boolean;
};

export function decidePhotoFailure(
  error: UploadError,
  currentPhase: PendingPhotoUpload["phase"],
): PhotoFailureDecision {
  const code = error.code || "";
  if (TERMINAL_CODES.has(code) || error.status === 413 || error.status === 415) {
    return { phase: "failed", retryable: false, clearRemotePhotoId: false };
  }

  if (RESET_RESERVATION_CODES.has(code) || error.status === 404) {
    return { phase: "waiting", retryable: true, clearRemotePhotoId: true };
  }

  if (currentPhase === "confirming") {
    return { phase: "confirming", retryable: true, clearRemotePhotoId: false };
  }

  return { phase: "waiting", retryable: true, clearRemotePhotoId: true };
}
