import assert from "node:assert/strict";
import test from "node:test";

import { decidePhotoFailure } from "./photo-upload";

test("preserva a confirmacao quando apenas a resposta falha", () => {
  assert.deepEqual(decidePhotoFailure({ code: "TIMEOUT", status: 0 }, "confirming"), {
    phase: "confirming",
    retryable: true,
    clearRemotePhotoId: false,
  });
});

test("gera uma nova reserva quando o link expira", () => {
  assert.deepEqual(decidePhotoFailure({ code: "SIGNED_URL_EXPIRED", status: 403 }, "uploading"), {
    phase: "waiting",
    retryable: true,
    clearRemotePhotoId: true,
  });
});

test("nao repete automaticamente um arquivo invalido", () => {
  assert.deepEqual(decidePhotoFailure({ code: "INVALID_IMAGE", status: 415 }, "confirming"), {
    phase: "failed",
    retryable: false,
    clearRemotePhotoId: false,
  });
});
