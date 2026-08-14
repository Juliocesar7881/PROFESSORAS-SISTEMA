export type User = { id: string; name?: string | null; email?: string | null; image?: string | null };
export type Turma = { id: string; nome: string; faixaEtaria?: string | null; turno?: string | null; instituicao?: string | null; ano?: number | null; _count?: { alunos: number } };
export type Crianca = { id: string; nome: string; turmaId: string; dataNasc?: string | null; contexto?: string | null; turma: { id: string; nome: string } };
export type Foto = { id: string; url?: string | null };
export type Registro = {
  id: string;
  texto: string;
  alunoId: string;
  dataRegistro: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  fotos: Foto[];
  aluno: { id: string; nome: string; turmaId: string; turma: { id: string; nome: string } };
};
export type DraftPhoto = {
  id: string;
  uri: string;
  name: string;
  type: "image/jpeg";
  size: number;
};
export type OfflineDraft = {
  id: string;
  clientMutationId: string;
  ownerUserId: string;
  remoteRecordId?: string | null;
  alunoId: string;
  texto: string;
  dataRegistro: string;
  fotos: DraftPhoto[];
  createdAt: string;
};
export type PendingPhotoUpload = {
  id: string;
  clientUploadId: string;
  ownerUserId: string;
  draftId: string;
  recordId: string;
  uri: string;
  name: string;
  type: "image/jpeg";
  size: number;
  order: number;
  phase: "waiting" | "uploading" | "confirming" | "failed";
  remotePhotoId?: string | null;
  progress: number;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type OfflineMutation = {
  id: string;
  ownerUserId?: string;
  type: "update" | "delete" | "restore";
  recordId: string;
  payload?: {
    texto: string;
    dataRegistro: string;
    alunoId: string;
    removeFotoIds?: string[];
    expectedUpdatedAt?: string;
  };
  createdAt: string;
};

export type ApiResult<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: { message: string; code?: string; details?: unknown; requestId?: string };
};
