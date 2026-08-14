import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";

import type {
  Crianca,
  DraftPhoto,
  OfflineDraft,
  OfflineMutation,
  PendingPhotoUpload,
  Registro,
  Turma,
} from "./types";

const LEGACY_QUEUE_KEY = "@planejei/offline-drafts-v1";
const LEGACY_BASE_KEY = "@planejei/base-cache-v1";
const MIGRATION_KEY = "legacy-async-storage-v1";
const draftDirectory = new Directory(Paths.document, "planejei-drafts");

type DraftStatus = "editing" | "pending";
type DraftRow = OfflineDraft & { status: DraftStatus; updatedAt: string; lastError?: string | null };

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;

function openDatabase() {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync("planejei-registros.db");
  return databasePromise;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; }
  catch { return fallback; }
}

function safePhotoId(value?: string) {
  const normalized = value?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 90);
  return normalized && normalized.length >= 8
    ? normalized
    : `photo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePhoto(photo: Partial<DraftPhoto>, index: number): DraftPhoto {
  const file = new File(String(photo.uri ?? ""));
  return {
    id: safePhotoId(photo.id || `legacy_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`),
    uri: String(photo.uri ?? ""),
    name: String(photo.name ?? `foto-${index + 1}.jpg`),
    type: "image/jpeg",
    size: Number(photo.size ?? (file.exists ? file.size : 0)),
  };
}

function draftFromRow(row: Record<string, unknown>): DraftRow {
  const photos = parseJson<Array<Partial<DraftPhoto>>>(String(row.fotosJson || "[]"), []);
  return {
    id: String(row.id),
    clientMutationId: String(row.clientMutationId),
    ownerUserId: String(row.ownerUserId ?? ""),
    remoteRecordId: row.remoteRecordId ? String(row.remoteRecordId) : null,
    alunoId: String(row.alunoId),
    texto: String(row.texto),
    dataRegistro: String(row.dataRegistro),
    fotos: photos.map(normalizePhoto),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    status: row.status === "editing" ? "editing" : "pending",
    lastError: row.lastError ? String(row.lastError) : null,
  };
}

function photoUploadFromRow(row: Record<string, unknown>): PendingPhotoUpload {
  const rawPhase = String(row.phase ?? "waiting");
  const phase: PendingPhotoUpload["phase"] = ["waiting", "uploading", "confirming", "failed"].includes(rawPhase)
    ? rawPhase as PendingPhotoUpload["phase"]
    : "waiting";
  return {
    id: String(row.id),
    clientUploadId: String(row.clientUploadId),
    ownerUserId: String(row.ownerUserId),
    draftId: String(row.draftId),
    recordId: String(row.recordId),
    uri: String(row.uri),
    name: String(row.name),
    type: "image/jpeg",
    size: Number(row.size),
    order: Number(row.sortOrder),
    phase,
    remotePhotoId: row.remotePhotoId ? String(row.remotePhotoId) : null,
    progress: Math.max(0, Math.min(1, Number(row.progress ?? 0))),
    attempts: Number(row.attempts),
    nextAttemptAt: String(row.nextAttemptAt),
    lastError: row.lastError ? String(row.lastError) : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function upsertDraft(db: SQLite.SQLiteDatabase, draft: OfflineDraft, status: DraftStatus, error?: string | null) {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO drafts (
      id, clientMutationId, ownerUserId, remoteRecordId, alunoId, texto, dataRegistro,
      fotosJson, status, createdAt, updatedAt, lastError
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      clientMutationId = excluded.clientMutationId,
      ownerUserId = excluded.ownerUserId,
      remoteRecordId = excluded.remoteRecordId,
      alunoId = excluded.alunoId,
      texto = excluded.texto,
      dataRegistro = excluded.dataRegistro,
      fotosJson = excluded.fotosJson,
      status = excluded.status,
      updatedAt = excluded.updatedAt,
      lastError = excluded.lastError`,
    draft.id,
    draft.clientMutationId,
    draft.ownerUserId,
    draft.remoteRecordId ?? null,
    draft.alunoId,
    draft.texto,
    draft.dataRegistro,
    JSON.stringify(draft.fotos),
    status,
    draft.createdAt,
    now,
    error ?? null,
  );
}

export function initializeOfflineStorage() {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const db = await openDatabase();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY NOT NULL,
        clientMutationId TEXT NOT NULL,
        ownerUserId TEXT NOT NULL DEFAULT '',
        remoteRecordId TEXT,
        alunoId TEXT NOT NULL,
        texto TEXT NOT NULL,
        dataRegistro TEXT NOT NULL,
        fotosJson TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL CHECK(status IN ('editing', 'pending')),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        lastError TEXT
      );
      CREATE TABLE IF NOT EXISTS pending_mutations (
        id TEXT PRIMARY KEY NOT NULL,
        ownerUserId TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL CHECK(type IN ('update', 'delete', 'restore')),
        recordId TEXT NOT NULL,
        payload TEXT,
        createdAt TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        lastError TEXT
      );
      CREATE TABLE IF NOT EXISTS pending_photo_uploads (
        id TEXT PRIMARY KEY NOT NULL,
        clientUploadId TEXT NOT NULL,
        ownerUserId TEXT NOT NULL,
        draftId TEXT NOT NULL,
        recordId TEXT NOT NULL,
        uri TEXT NOT NULL,
        name TEXT NOT NULL,
        mimeType TEXT NOT NULL DEFAULT 'image/jpeg',
        size INTEGER NOT NULL,
        sortOrder INTEGER NOT NULL,
        phase TEXT NOT NULL DEFAULT 'waiting',
        remotePhotoId TEXT,
        progress REAL NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        nextAttemptAt TEXT NOT NULL,
        lastError TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(ownerUserId, recordId, clientUploadId)
      );
      CREATE TABLE IF NOT EXISTS base_cache (
        key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS records_cache (
        id TEXT PRIMARY KEY NOT NULL,
        ownerUserId TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL,
        dataRegistro TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    await ensureColumn(db, "drafts", "ownerUserId", "TEXT NOT NULL DEFAULT ''");
    await ensureColumn(db, "drafts", "remoteRecordId", "TEXT");
    await ensureColumn(db, "pending_mutations", "ownerUserId", "TEXT NOT NULL DEFAULT ''");
    await ensureColumn(db, "records_cache", "ownerUserId", "TEXT NOT NULL DEFAULT ''");
    await ensureColumn(db, "pending_photo_uploads", "phase", "TEXT NOT NULL DEFAULT 'waiting'");
    await ensureColumn(db, "pending_photo_uploads", "remotePhotoId", "TEXT");
    await ensureColumn(db, "pending_photo_uploads", "progress", "REAL NOT NULL DEFAULT 0");
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS drafts_owner_status_idx ON drafts(ownerUserId, status, createdAt);
      CREATE INDEX IF NOT EXISTS pending_mutations_owner_idx ON pending_mutations(ownerUserId, createdAt);
      CREATE INDEX IF NOT EXISTS photo_uploads_owner_due_idx ON pending_photo_uploads(ownerUserId, nextAttemptAt);
      CREATE INDEX IF NOT EXISTS records_owner_date_idx ON records_cache(ownerUserId, dataRegistro DESC, createdAt DESC);
    `);

    const migrated = await db.getFirstAsync<{ value: string }>("SELECT value FROM metadata WHERE key = ?", MIGRATION_KEY);
    if (!migrated) {
      const [legacyDraftsRaw, legacyBaseRaw] = await Promise.all([
        AsyncStorage.getItem(LEGACY_QUEUE_KEY),
        AsyncStorage.getItem(LEGACY_BASE_KEY),
      ]);
      const legacyDrafts = parseJson<Array<Omit<OfflineDraft, "ownerUserId"> & { ownerUserId?: string }>>(legacyDraftsRaw, []);
      for (const legacy of legacyDrafts) {
        await upsertDraft(db, { ...legacy, ownerUserId: legacy.ownerUserId ?? "", fotos: legacy.fotos.map(normalizePhoto) }, "pending");
      }
      if (legacyBaseRaw) {
        await db.runAsync(
          "INSERT OR REPLACE INTO base_cache (key, payload, updatedAt) VALUES (?, ?, ?)",
          "base:legacy",
          legacyBaseRaw,
          new Date().toISOString(),
        );
      }
      await db.runAsync("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", MIGRATION_KEY, new Date().toISOString());
      await AsyncStorage.multiRemove([LEGACY_QUEUE_KEY, LEGACY_BASE_KEY]);
    }
  })();

  return initializationPromise;
}

async function database() {
  await initializeOfflineStorage();
  return openDatabase();
}

export async function claimLegacyLocalData(ownerUserId: string) {
  const db = await database();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync("UPDATE drafts SET ownerUserId = ? WHERE ownerUserId = ''", ownerUserId);
    await tx.runAsync("UPDATE pending_mutations SET ownerUserId = ? WHERE ownerUserId = ''", ownerUserId);
    await tx.runAsync("UPDATE records_cache SET ownerUserId = ? WHERE ownerUserId = ''", ownerUserId);
    const legacyBase = await tx.getFirstAsync<{ payload: string }>("SELECT payload FROM base_cache WHERE key = 'base:legacy'");
    if (legacyBase) {
      await tx.runAsync(
        "INSERT OR IGNORE INTO base_cache (key, payload, updatedAt) VALUES (?, ?, ?)",
        `base:${ownerUserId}`,
        legacyBase.payload,
        new Date().toISOString(),
      );
      await tx.runAsync("DELETE FROM base_cache WHERE key = 'base:legacy'");
    }
  });
}

export async function getDrafts(ownerUserId: string) {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM drafts WHERE ownerUserId = ? AND status = 'pending' ORDER BY createdAt ASC",
    ownerUserId,
  );
  return rows.map(draftFromRow) as OfflineDraft[];
}

export async function storeDrafts(drafts: OfflineDraft[], ownerUserId: string) {
  const db = await database();
  await db.runAsync("DELETE FROM drafts WHERE ownerUserId = ? AND status = 'pending'", ownerUserId);
  for (const draft of drafts) await upsertDraft(db, { ...draft, ownerUserId }, "pending");
}

export async function savePendingDraft(draft: OfflineDraft, error?: string | null) {
  await upsertDraft(await database(), draft, "pending", error);
}

export async function saveEditingDraft(draft: OfflineDraft) {
  const db = await database();
  await db.runAsync(
    "DELETE FROM drafts WHERE ownerUserId = ? AND status = 'editing' AND id <> ?",
    draft.ownerUserId,
    draft.id,
  );
  await upsertDraft(db, draft, "editing");
}

export async function getEditingDraft(ownerUserId: string) {
  const db = await database();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM drafts WHERE ownerUserId = ? AND status = 'editing' ORDER BY updatedAt DESC LIMIT 1",
    ownerUserId,
  );
  return row ? draftFromRow(row) : null;
}

export async function removeDraft(id: string) {
  const db = await database();
  await db.runAsync("DELETE FROM drafts WHERE id = ?", id);
}

export async function clearEditingDraft(ownerUserId: string) {
  const db = await database();
  await db.runAsync("DELETE FROM drafts WHERE ownerUserId = ? AND status = 'editing'", ownerUserId);
}

export async function moveDraftPhotosToUploadQueue(draft: OfflineDraft, recordId: string) {
  const db = await database();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const [index, photo] of draft.fotos.entries()) {
      await tx.runAsync(
        `INSERT INTO pending_photo_uploads (
          id, clientUploadId, ownerUserId, draftId, recordId, uri, name, mimeType,
          size, sortOrder, phase, remotePhotoId, progress, attempts, nextAttemptAt,
          lastError, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', NULL, 0, 0, ?, NULL, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          recordId = excluded.recordId,
          uri = excluded.uri,
          name = excluded.name,
          size = excluded.size,
          sortOrder = excluded.sortOrder,
          phase = 'waiting',
          remotePhotoId = NULL,
          progress = 0,
          nextAttemptAt = excluded.nextAttemptAt,
          lastError = NULL,
          updatedAt = excluded.updatedAt`,
        photo.id,
        photo.id,
        draft.ownerUserId,
        draft.id,
        recordId,
        photo.uri,
        photo.name,
        photo.type,
        photo.size,
        index,
        now,
        now,
        now,
      );
    }
    await tx.runAsync("DELETE FROM drafts WHERE id = ? AND ownerUserId = ?", draft.id, draft.ownerUserId);
  });
}

export async function queuePhotosForRecord(
  ownerUserId: string,
  recordId: string,
  photos: DraftPhoto[],
  startOrder = 0,
) {
  if (!photos.length) return;
  const db = await database();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const [index, photo] of photos.entries()) {
      await tx.runAsync(
        `INSERT INTO pending_photo_uploads (
          id, clientUploadId, ownerUserId, draftId, recordId, uri, name, mimeType,
          size, sortOrder, phase, remotePhotoId, progress, attempts, nextAttemptAt,
          lastError, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', NULL, 0, 0, ?, NULL, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          recordId = excluded.recordId,
          uri = excluded.uri,
          name = excluded.name,
          size = excluded.size,
          sortOrder = excluded.sortOrder,
          phase = 'waiting',
          remotePhotoId = NULL,
          progress = 0,
          attempts = 0,
          nextAttemptAt = excluded.nextAttemptAt,
          lastError = NULL,
          updatedAt = excluded.updatedAt`,
        photo.id,
        photo.id,
        ownerUserId,
        `edit-${recordId}`,
        recordId,
        photo.uri,
        photo.name,
        photo.type,
        photo.size,
        startOrder + index,
        now,
        now,
        now,
      );
    }
  });
}

export async function getPendingPhotoUploads(ownerUserId: string, dueOnly = false) {
  const db = await database();
  const rows = dueOnly
    ? await db.getAllAsync<Record<string, unknown>>(
        "SELECT * FROM pending_photo_uploads WHERE ownerUserId = ? AND nextAttemptAt <= ? ORDER BY createdAt ASC",
        ownerUserId,
        new Date().toISOString(),
      )
    : await db.getAllAsync<Record<string, unknown>>(
        "SELECT * FROM pending_photo_uploads WHERE ownerUserId = ? ORDER BY createdAt ASC",
        ownerUserId,
      );
  return rows.map(photoUploadFromRow);
}

export async function completePhotoUpload(upload: PendingPhotoUpload) {
  const db = await database();
  await db.runAsync("DELETE FROM pending_photo_uploads WHERE id = ? AND ownerUserId = ?", upload.id, upload.ownerUserId);
  removePhotoFile({ id: upload.id, uri: upload.uri, name: upload.name, type: upload.type, size: upload.size });
}

export async function updatePhotoUploadPhase(
  id: string,
  ownerUserId: string,
  phase: PendingPhotoUpload["phase"],
  options?: { remotePhotoId?: string | null; progress?: number; clearError?: boolean },
) {
  const db = await database();
  const progress = options?.progress === undefined
    ? null
    : Math.max(0, Math.min(1, options.progress));
  await db.runAsync(
    `UPDATE pending_photo_uploads
     SET phase = ?,
         remotePhotoId = CASE WHEN ? = 1 THEN ? ELSE remotePhotoId END,
         progress = COALESCE(?, progress),
         lastError = CASE WHEN ? = 1 THEN NULL ELSE lastError END,
         updatedAt = ?
     WHERE id = ? AND ownerUserId = ?`,
    phase,
    options && "remotePhotoId" in options ? 1 : 0,
    options?.remotePhotoId ?? null,
    progress,
    options?.clearError ? 1 : 0,
    new Date().toISOString(),
    id,
    ownerUserId,
  );
}

function retryDelayMs(attempts: number) {
  const delays = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
  return delays[Math.min(Math.max(attempts - 1, 0), delays.length - 1)];
}

export async function failPhotoUpload(
  upload: PendingPhotoUpload,
  error: string,
  options?: { phase?: PendingPhotoUpload["phase"]; retryable?: boolean; clearRemotePhotoId?: boolean },
) {
  const db = await database();
  const attempts = upload.attempts + 1;
  const retryable = options?.retryable !== false;
  const nextAttemptAt = retryable
    ? new Date(Date.now() + retryDelayMs(attempts)).toISOString()
    : "9999-12-31T23:59:59.999Z";
  const phase = options?.phase ?? (retryable ? upload.phase : "failed");
  await db.runAsync(
    `UPDATE pending_photo_uploads
     SET attempts = ?, nextAttemptAt = ?, lastError = ?, phase = ?,
         remotePhotoId = CASE WHEN ? = 1 THEN NULL ELSE remotePhotoId END,
         progress = CASE WHEN ? = 'waiting' THEN 0 ELSE progress END,
         updatedAt = ?
     WHERE id = ? AND ownerUserId = ?`,
    attempts,
    nextAttemptAt,
    error,
    phase,
    options?.clearRemotePhotoId ? 1 : 0,
    phase,
    new Date().toISOString(),
    upload.id,
    upload.ownerUserId,
  );
}

export async function retryPhotoUpload(id: string, ownerUserId: string) {
  const db = await database();
  await db.runAsync(
    `UPDATE pending_photo_uploads
     SET nextAttemptAt = ?, lastError = NULL,
         phase = CASE WHEN phase = 'failed' THEN 'waiting' ELSE phase END,
         progress = CASE WHEN phase = 'failed' THEN 0 ELSE progress END,
         updatedAt = ?
     WHERE id = ? AND ownerUserId = ?`,
    new Date(0).toISOString(),
    new Date().toISOString(),
    id,
    ownerUserId,
  );
}

export async function discardPhotoUpload(id: string, ownerUserId: string) {
  const db = await database();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM pending_photo_uploads WHERE id = ? AND ownerUserId = ?",
    id,
    ownerUserId,
  );
  if (!row) return null;
  const upload = photoUploadFromRow(row);
  await db.runAsync("DELETE FROM pending_photo_uploads WHERE id = ? AND ownerUserId = ?", id, ownerUserId);
  removePhotoFile({ id: upload.id, uri: upload.uri, name: upload.name, type: upload.type, size: upload.size });
  return upload;
}

export async function persistPhotos(
  assets: Array<{ uri: string; fileName?: string | null; mimeType?: string | null }>,
  draftId: string,
) {
  if (!draftDirectory.exists) draftDirectory.create({ intermediates: true });
  const output: DraftPhoto[] = [];

  for (const [index, asset] of assets.entries()) {
    const clientUploadId = safePhotoId(`${draftId}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`);
    const unique = `${clientUploadId}.jpg`;
    const target = new File(draftDirectory, unique);
    if (asset.uri !== target.uri) await new File(asset.uri).copy(target);
    output.push({
      id: clientUploadId,
      uri: target.uri,
      name: asset.fileName?.replace(/\.[^.]+$/, ".jpg") || unique,
      type: "image/jpeg",
      size: target.size,
    });
  }

  return output;
}

export function removePhotoFile(photo: DraftPhoto) {
  if (!photo.uri.startsWith(draftDirectory.uri)) return;
  const file = new File(photo.uri);
  if (file.exists) file.delete();
}

export function removeDraftFiles(draft: OfflineDraft) {
  draft.fotos.forEach(removePhotoFile);
}

export function removeDraftFilesById(draftId: string) {
  if (!draftDirectory.exists) return;
  for (const entry of draftDirectory.list()) {
    if (entry instanceof File && entry.name.startsWith(`${draftId}_`)) entry.delete();
  }
}

export async function clearUserData(ownerUserId: string) {
  const db = await database();
  const [draftRows, photoRows] = await Promise.all([
    db.getAllAsync<Record<string, unknown>>("SELECT * FROM drafts WHERE ownerUserId = ?", ownerUserId),
    db.getAllAsync<Record<string, unknown>>("SELECT * FROM pending_photo_uploads WHERE ownerUserId = ?", ownerUserId),
  ]);
  draftRows.map(draftFromRow).forEach(removeDraftFiles);
  photoRows.map(photoUploadFromRow).forEach((item) => removePhotoFile({ id: item.id, uri: item.uri, name: item.name, type: item.type, size: item.size }));
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync("DELETE FROM drafts WHERE ownerUserId = ?", ownerUserId);
    await tx.runAsync("DELETE FROM pending_photo_uploads WHERE ownerUserId = ?", ownerUserId);
    await tx.runAsync("DELETE FROM pending_mutations WHERE ownerUserId = ?", ownerUserId);
    await tx.runAsync("DELETE FROM records_cache WHERE ownerUserId = ?", ownerUserId);
    await tx.runAsync("DELETE FROM base_cache WHERE key = ?", `base:${ownerUserId}`);
    await tx.runAsync("DELETE FROM preferences WHERE key LIKE ?", `${ownerUserId}:%`);
  });
}

export async function clearAllDrafts() {
  if (draftDirectory.exists) draftDirectory.delete();
  const db = await database();
  await db.execAsync("DELETE FROM drafts; DELETE FROM pending_photo_uploads; DELETE FROM pending_mutations; DELETE FROM base_cache; DELETE FROM records_cache; DELETE FROM preferences;");
  await AsyncStorage.multiRemove([LEGACY_QUEUE_KEY, LEGACY_BASE_KEY]);
}

export async function storeBase(data: { turmas: Turma[]; criancas: Crianca[] }, ownerUserId: string) {
  const db = await database();
  await db.runAsync(
    "INSERT OR REPLACE INTO base_cache (key, payload, updatedAt) VALUES (?, ?, ?)",
    `base:${ownerUserId}`,
    JSON.stringify(data),
    new Date().toISOString(),
  );
}

export async function getBase(ownerUserId: string) {
  const db = await database();
  const row = await db.getFirstAsync<{ payload: string }>("SELECT payload FROM base_cache WHERE key = ?", `base:${ownerUserId}`);
  return parseJson(row?.payload, { turmas: [] as Turma[], criancas: [] as Crianca[] });
}

export async function cacheRecords(records: Registro[], ownerUserId: string) {
  const db = await database();
  for (const record of records) {
    await db.runAsync(
      `INSERT INTO records_cache (id, ownerUserId, payload, dataRegistro, createdAt, updatedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         ownerUserId = excluded.ownerUserId,
         payload = excluded.payload,
         dataRegistro = excluded.dataRegistro,
         createdAt = excluded.createdAt,
         updatedAt = excluded.updatedAt,
         deletedAt = excluded.deletedAt`,
      record.id,
      ownerUserId,
      JSON.stringify(record),
      record.dataRegistro,
      record.createdAt,
      record.updatedAt,
      record.deletedAt ?? null,
    );
  }
}

export async function cacheRecord(record: Registro, ownerUserId: string) {
  await cacheRecords([record], ownerUserId);
}

export async function getCachedRecords(ownerUserId: string) {
  const db = await database();
  const rows = await db.getAllAsync<{ payload: string }>(
    "SELECT payload FROM records_cache WHERE ownerUserId = ? ORDER BY dataRegistro DESC, createdAt DESC",
    ownerUserId,
  );
  return rows.map((row) => parseJson<Registro | null>(row.payload, null)).filter((item): item is Registro => Boolean(item));
}

export async function removeCachedRecord(id: string, ownerUserId: string) {
  const db = await database();
  await db.runAsync("DELETE FROM records_cache WHERE id = ? AND ownerUserId = ?", id, ownerUserId);
}

export async function setPreference(key: string, value: string, ownerUserId = "global") {
  const db = await database();
  await db.runAsync("INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)", `${ownerUserId}:${key}`, value);
}

export async function getPreference(key: string, ownerUserId = "global") {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM preferences WHERE key = ?", `${ownerUserId}:${key}`);
  return row?.value ?? null;
}

export async function savePendingMutation(mutation: OfflineMutation, error?: string | null) {
  const db = await database();
  await db.runAsync(
    `INSERT INTO pending_mutations (id, ownerUserId, type, recordId, payload, createdAt, attempts, lastError)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       ownerUserId = excluded.ownerUserId,
       type = excluded.type,
       recordId = excluded.recordId,
       payload = excluded.payload,
       attempts = pending_mutations.attempts + 1,
       lastError = excluded.lastError`,
    mutation.id,
    mutation.ownerUserId ?? "",
    mutation.type,
    mutation.recordId,
    mutation.payload ? JSON.stringify(mutation.payload) : null,
    mutation.createdAt,
    error ?? null,
  );
}

export async function getPendingMutations(ownerUserId: string) {
  const db = await database();
  const rows = await db.getAllAsync<{
    id: string;
    ownerUserId: string;
    type: OfflineMutation["type"];
    recordId: string;
    payload: string | null;
    createdAt: string;
  }>(
    "SELECT id, ownerUserId, type, recordId, payload, createdAt FROM pending_mutations WHERE ownerUserId = ? ORDER BY createdAt ASC",
    ownerUserId,
  );
  return rows.map((row) => ({
    id: row.id,
    ownerUserId: row.ownerUserId,
    type: row.type,
    recordId: row.recordId,
    payload: row.payload ? parseJson<OfflineMutation["payload"]>(row.payload, undefined) : undefined,
    createdAt: row.createdAt,
  })) as OfflineMutation[];
}

export async function removePendingMutation(id: string, ownerUserId: string) {
  const db = await database();
  await db.runAsync("DELETE FROM pending_mutations WHERE id = ? AND ownerUserId = ?", id, ownerUserId);
}

export async function getSyncCounts(ownerUserId: string) {
  const db = await database();
  const [drafts, mutations, photos, photoErrors] = await Promise.all([
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM drafts WHERE ownerUserId = ? AND status = 'pending'", ownerUserId),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM pending_mutations WHERE ownerUserId = ?", ownerUserId),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM pending_photo_uploads WHERE ownerUserId = ?", ownerUserId),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM pending_photo_uploads WHERE ownerUserId = ? AND lastError IS NOT NULL", ownerUserId),
  ]);
  return {
    drafts: Number(drafts?.count ?? 0),
    mutations: Number(mutations?.count ?? 0),
    photos: Number(photos?.count ?? 0),
    photoErrors: Number(photoErrors?.count ?? 0),
  };
}
