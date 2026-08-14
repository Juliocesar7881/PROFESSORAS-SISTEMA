import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, AppState, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import {
  API_URL,
  ApiError,
  cancelRegistroPhoto,
  confirmRegistroPhoto,
  createRegistro,
  exchangeCode,
  loadBase,
  presignRegistroPhoto,
  type MobileConfig,
  publicRequest,
  readableSyncError,
  request,
  updateRegistro,
  uploadSignedPhoto,
} from "../api";
import {
  cacheRecord,
  claimLegacyLocalData,
  clearUserData,
  completePhotoUpload,
  discardPhotoUpload,
  failPhotoUpload,
  getBase,
  getDrafts,
  getPendingMutations,
  getPendingPhotoUploads,
  getSyncCounts,
  initializeOfflineStorage,
  moveDraftPhotosToUploadQueue,
  queuePhotosForRecord,
  removePendingMutation,
  retryPhotoUpload,
  savePendingDraft,
  savePendingMutation,
  storeBase,
  updatePhotoUploadPhase,
} from "../offline";
import { colors } from "../theme";
import type { Crianca, DraftPhoto, OfflineDraft, OfflineMutation, PendingPhotoUpload, Registro, Turma, User } from "../types";
import { decidePhotoFailure } from "../utils/photo-upload";
import { compareVersions } from "../utils/version";
import { useFeedback } from "./FeedbackProvider";

const TOKEN_KEY = "planejei_mobile_token";
const USER_KEY = "planejei_mobile_user";
const SESSION_EXPIRY_KEY = "planejei_mobile_session_expiry";

type AppContextValue = {
  token: string | null;
  user: User | null;
  ready: boolean;
  online: boolean;
  loginLoading: boolean;
  accountBusy: boolean;
  syncing: boolean;
  pendingCount: number;
  pendingPhotos: PendingPhotoUpload[];
  lastSyncError: string | null;
  refreshKey: number;
  turmas: Turma[];
  criancas: Crianca[];
  login: () => Promise<void>;
  logout: () => void;
  refreshBase: () => Promise<void>;
  syncNow: (forcePhotos?: boolean) => Promise<void>;
  retryPhoto: (id: string) => Promise<void>;
  discardPhoto: (id: string) => Promise<void>;
  queueDraft: (draft: OfflineDraft) => Promise<void>;
  queueRecordPhotos: (recordId: string, photos: DraftPhoto[], startOrder?: number) => Promise<void>;
  queueRecordMutation: (mutation: OfflineMutation) => Promise<void>;
  recordSaved: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

async function mapWithConcurrency<T>(items: T[], limit: number, handler: (item: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await handler(item);
    }
  }));
}

function isExpiredSession(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function parseStoredUser(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value) as User; }
  catch { return null; }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const feedback = useFeedback();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotoUpload[]>([]);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [requiredUpdate, setRequiredUpdate] = useState<MobileConfig | null>(null);
  const syncLock = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);
  const onlineRef = useRef(true);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { onlineRef.current = online; }, [online]);

  const refreshPendingState = useCallback(async (ownerUserId?: string) => {
    const owner = ownerUserId ?? userRef.current?.id;
    if (!owner) {
      setPendingCount(0);
      setPendingPhotos([]);
      return;
    }
    const [counts, photos] = await Promise.all([
      getSyncCounts(owner),
      getPendingPhotoUploads(owner),
    ]);
    setPendingCount(counts.drafts + counts.mutations + counts.photos);
    setPendingPhotos(photos);
  }, []);

  const reflectPhotoState = useCallback((id: string, patch: Partial<PendingPhotoUpload>) => {
    setPendingPhotos((current) => current.map((photo) => photo.id === id ? { ...photo, ...patch } : photo));
  }, []);

  const clearSession = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(SESSION_EXPIRY_KEY),
    ]);
    tokenRef.current = null;
    userRef.current = null;
    setToken(null);
    setUser(null);
    setTurmas([]);
    setCriancas([]);
    setPendingCount(0);
    setPendingPhotos([]);
  }, []);

  const expireSession = useCallback(async () => {
    await clearSession();
    feedback("Sua sessao expirou. Entre novamente; seus registros continuam protegidos no aparelho.", {
      tone: "warning",
      duration: 7000,
    });
  }, [clearSession, feedback]);

  const refreshBaseWithToken = useCallback(async (activeToken: string, ownerUserId: string) => {
    const base = await loadBase(activeToken);
    setTurmas(base.turmas);
    setCriancas(base.criancas);
    await storeBase(base, ownerUserId);
  }, []);

  const refreshBase = useCallback(async () => {
    const activeToken = tokenRef.current;
    const activeUser = userRef.current;
    if (!activeToken || !activeUser || !onlineRef.current) return;
    try {
      await refreshBaseWithToken(activeToken, activeUser.id);
    } catch (error) {
      if (isExpiredSession(error)) await expireSession();
      else throw error;
    }
  }, [expireSession, refreshBaseWithToken]);

  const syncNow = useCallback(async (forcePhotos = false) => {
    const activeToken = tokenRef.current;
    const activeUser = userRef.current;
    if (!activeToken || !activeUser || !onlineRef.current || syncLock.current) return;

    const ownerUserId = activeUser.id;
    syncLock.current = true;
    setSyncing(true);
    setLastSyncError(null);
    let changedRecords = false;
    let expired = false;

    try {
      await claimLegacyLocalData(ownerUserId);
      const drafts = await getDrafts(ownerUserId);

      for (const draft of drafts) {
        try {
          const result = await createRegistro(activeToken, draft);
          await cacheRecord(result.registro, ownerUserId);
          await moveDraftPhotosToUploadQueue(draft, result.registro.id);
          changedRecords = true;
        } catch (error) {
          if (isExpiredSession(error)) {
            expired = true;
            break;
          }
          const message = readableSyncError(error);
          setLastSyncError(message);
          await savePendingDraft(draft, message);
        }
      }

      if (!expired) {
        const mutations = await getPendingMutations(ownerUserId);
        for (const mutation of mutations) {
          try {
            if (mutation.type === "update" && mutation.payload) {
              const result = await updateRegistro(activeToken, mutation.recordId, mutation.payload);
              const updated = "registro" in result ? result.registro : result;
              await cacheRecord(updated, ownerUserId);
            } else if (mutation.type === "delete") {
              await request(activeToken, `/api/registros/${mutation.recordId}`, { method: "DELETE" });
            } else if (mutation.type === "restore") {
              const restored = await request<Registro>(activeToken, `/api/registros/${mutation.recordId}/restore`, { method: "POST" });
              await cacheRecord(restored, ownerUserId);
            }
            await removePendingMutation(mutation.id, ownerUserId);
            changedRecords = true;
          } catch (error) {
            if (isExpiredSession(error)) {
              expired = true;
              break;
            }
            const message = readableSyncError(error);
            setLastSyncError(message);
            await savePendingMutation({ ...mutation, ownerUserId }, message);
          }
        }
      }

      if (!expired) {
        const photos = await getPendingPhotoUploads(ownerUserId, !forcePhotos);
        await mapWithConcurrency(photos, 2, async (upload) => {
          let phase = upload.phase;
          try {
            let photoId = upload.remotePhotoId ?? null;
            if (phase !== "confirming" || !photoId) {
              const reservation = await presignRegistroPhoto(activeToken, upload);
              photoId = reservation.photoId;
              if (reservation.status !== "ready") {
                phase = "uploading";
                await updatePhotoUploadPhase(upload.id, ownerUserId, phase, {
                  remotePhotoId: photoId,
                  progress: 0,
                  clearError: true,
                });
                reflectPhotoState(upload.id, { phase, remotePhotoId: photoId, progress: 0, lastError: null });
                await uploadSignedPhoto(reservation, upload, (progress) => {
                  reflectPhotoState(upload.id, { phase: "uploading", progress });
                });
              }
              phase = "confirming";
              await updatePhotoUploadPhase(upload.id, ownerUserId, phase, {
                remotePhotoId: photoId,
                progress: 1,
                clearError: true,
              });
              reflectPhotoState(upload.id, { phase, remotePhotoId: photoId, progress: 1, lastError: null });
            }

            if (!photoId) throw new ApiError("Identificador da foto ausente.", 500, "MISSING_PHOTO_ID");
            const confirmed = await confirmRegistroPhoto(activeToken, upload.recordId, photoId);
            await cacheRecord(confirmed.registro, ownerUserId);
            await completePhotoUpload(upload);
            setPendingPhotos((current) => current.filter((photo) => photo.id !== upload.id));
            changedRecords = true;
          } catch (error) {
            if (isExpiredSession(error)) expired = true;
            const message = readableSyncError(error);
            const decision = decidePhotoFailure(
              error instanceof ApiError ? error : {},
              phase,
            );
            setLastSyncError(message);
            await failPhotoUpload(upload, message, decision);
            reflectPhotoState(upload.id, {
              phase: decision.phase,
              remotePhotoId: decision.clearRemotePhotoId ? null : upload.remotePhotoId,
              progress: decision.phase === "waiting" ? 0 : upload.progress,
              lastError: message,
            });
          }
        });
      }

      await refreshPendingState(ownerUserId);
      if (changedRecords) {
        setRefreshKey((value) => value + 1);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setSyncing(false);
      syncLock.current = false;
    }

    if (expired) await expireSession();
  }, [expireSession, reflectPhotoState, refreshPendingState]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    void (async () => {
      await initializeOfflineStorage();
      const [storedToken, storedUserRaw] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      const storedUser = parseStoredUser(storedUserRaw);

      if (storedUser) {
        await claimLegacyLocalData(storedUser.id);
        const cachedBase = await getBase(storedUser.id);
        setTurmas(cachedBase.turmas);
        setCriancas(cachedBase.criancas);
        setUser(storedUser);
        userRef.current = storedUser;
        await refreshPendingState(storedUser.id);
      }

      if (storedToken) {
        setToken(storedToken);
        tokenRef.current = storedToken;
        try {
          const me = await request<User>(storedToken, "/api/mobile/auth/me");
          setUser(me);
          userRef.current = me;
          await claimLegacyLocalData(me.id);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(me));
          await refreshBaseWithToken(storedToken, me.id);
          await refreshPendingState(me.id);
        } catch (error) {
          if (isExpiredSession(error)) await expireSession();
        }
      }

      setReady(true);
    })();

    return unsubscribe;
  }, [expireSession, refreshBaseWithToken, refreshPendingState]);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      try {
        const config = await publicRequest<MobileConfig>("/api/mobile/config");
        const currentVersion = Constants.expoConfig?.version || "0.0.0";
        if (compareVersions(currentVersion, config.minimumVersion) < 0 && config.apkUrl) {
          setRequiredUpdate(config);
          return;
        }

        if (Updates.isEnabled) {
          const result = await Updates.checkForUpdateAsync();
          if (result.isAvailable) {
            await Updates.fetchUpdateAsync();
            feedback("Uma melhoria do Pequenos Passos esta pronta.", {
              actionLabel: "Reiniciar",
              duration: 9000,
              onAction: () => Updates.reloadAsync(),
            });
          }
        }
      } catch {
        // A falha da verificacao de versao nao bloqueia o uso offline.
      }
    })();
  }, [feedback, ready]);

  useEffect(() => {
    if (online && token && user) void syncNow();
  }, [online, syncNow, token, user]);

  useEffect(() => {
    if (!online || !token || !user || !pendingCount) return;
    const timer = setInterval(() => { void syncNow(); }, 60_000);
    return () => clearInterval(timer);
  }, [online, pendingCount, syncNow, token, user]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (tokenRef.current && userRef.current && onlineRef.current) {
        void syncNow();
        void refreshBase();
      }
    });
    return () => subscription.remove();
  }, [refreshBase, syncNow]);

  const login = useCallback(async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const redirect = "planejei://auth";
      const authUrl = `${API_URL}/mobile-connect?redirect=${encodeURIComponent(redirect)}&choose=1`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect, { showInRecents: false });
      if (result.type !== "success") return;
      const code = new URL(result.url).searchParams.get("code");
      if (!code) throw new Error("Codigo de acesso ausente.");

      const session = await exchangeCode(code);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, session.token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
        SecureStore.setItemAsync(SESSION_EXPIRY_KEY, session.expiresAt),
      ]);
      tokenRef.current = session.token;
      userRef.current = session.user;
      setToken(session.token);
      setUser(session.user);
      await claimLegacyLocalData(session.user.id);
      const cachedBase = await getBase(session.user.id);
      setTurmas(cachedBase.turmas);
      setCriancas(cachedBase.criancas);
      await refreshBaseWithToken(session.token, session.user.id);
      await refreshPendingState(session.user.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { void syncNow(true); }, 0);
    } catch (error) {
      Alert.alert("Entrar", error instanceof Error ? error.message : "Nao foi possivel entrar.");
    } finally {
      setLoginLoading(false);
    }
  }, [loginLoading, refreshBaseWithToken, refreshPendingState, syncNow]);

  const disconnectAccount = useCallback(async () => {
    if (accountBusy) return;
    setAccountBusy(true);
    const activeToken = tokenRef.current;

    try {
      if (activeToken) {
        try { await request(activeToken, "/api/mobile/auth/logout", { method: "POST" }); }
        catch { /* A sessao local ainda deve ser encerrada. */ }
      }
      await clearSession();
      feedback("Conta desconectada. Seus rascunhos continuam protegidos neste aparelho.", {
        tone: "success",
        duration: 5200,
      });
    } finally {
      setAccountBusy(false);
    }
  }, [accountBusy, clearSession, feedback]);

  const deleteAccount = useCallback(async () => {
    if (accountBusy) return;
    const activeToken = tokenRef.current;
    const activeUser = userRef.current;
    if (!activeToken || !activeUser) return;

    setAccountBusy(true);
    try {
      await request(activeToken, "/api/account", { method: "DELETE" });
      await clearUserData(activeUser.id);
      await clearSession();
      feedback("Sua conta e os dados locais foram excluidos.", { tone: "success", duration: 5200 });
    } catch (error) {
      Alert.alert(
        "Excluir conta",
        error instanceof Error ? error.message : "Nao foi possivel excluir a conta agora.",
      );
    } finally {
      setAccountBusy(false);
    }
  }, [accountBusy, clearSession, feedback]);

  const logout = useCallback(() => {
    Alert.alert(
      "Sua conta",
      `${userRef.current?.name || userRef.current?.email || "Conta conectada"}\n\nSeus rascunhos e fotos pendentes permanecem protegidos e separados por conta neste aparelho.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir conta",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Excluir conta e dados?",
              "Esta acao e permanente e remove registros, fotos, turmas, criancas e rascunhos desta conta.",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir definitivamente", style: "destructive", onPress: () => void deleteAccount() },
              ],
            );
          },
        },
        { text: "Sair e escolher outra conta", onPress: () => void disconnectAccount() },
      ],
    );
  }, [deleteAccount, disconnectAccount]);

  const queueDraft = useCallback(async (draft: OfflineDraft) => {
    const activeUser = userRef.current;
    if (!activeUser) throw new Error("Entre novamente para proteger o registro.");
    await savePendingDraft({ ...draft, ownerUserId: activeUser.id });
    await refreshPendingState(activeUser.id);
    if (onlineRef.current && tokenRef.current) setTimeout(() => { void syncNow(true); }, 0);
  }, [refreshPendingState, syncNow]);

  const queueRecordPhotos = useCallback(async (recordId: string, photos: DraftPhoto[], startOrder = 0) => {
    const activeUser = userRef.current;
    if (!activeUser) throw new Error("Entre novamente para salvar as fotos.");
    await queuePhotosForRecord(activeUser.id, recordId, photos, startOrder);
    await refreshPendingState(activeUser.id);
    if (onlineRef.current && tokenRef.current) setTimeout(() => { void syncNow(true); }, 0);
  }, [refreshPendingState, syncNow]);

  const queueRecordMutation = useCallback(async (mutation: OfflineMutation) => {
    const activeUser = userRef.current;
    if (!activeUser) throw new Error("Entre novamente para salvar esta alteracao.");
    await savePendingMutation({ ...mutation, ownerUserId: activeUser.id });
    await refreshPendingState(activeUser.id);
    if (onlineRef.current && tokenRef.current) setTimeout(() => { void syncNow(true); }, 0);
  }, [refreshPendingState, syncNow]);

  const retryPhoto = useCallback(async (id: string) => {
    const activeUser = userRef.current;
    if (!activeUser) return;
    await retryPhotoUpload(id, activeUser.id);
    await refreshPendingState(activeUser.id);
    if (onlineRef.current) await syncNow(true);
  }, [refreshPendingState, syncNow]);

  const discardPhoto = useCallback(async (id: string) => {
    const activeUser = userRef.current;
    if (!activeUser) return;
    const upload = pendingPhotos.find((item) => item.id === id);
    if (upload && tokenRef.current && onlineRef.current) {
      try {
        const photoId = upload.remotePhotoId
          ?? (await presignRegistroPhoto(tokenRef.current, upload)).photoId;
        await cancelRegistroPhoto(tokenRef.current, upload.recordId, photoId);
      } catch {
        // O backend tambem limpa reservas nao confirmadas depois de 24 horas.
      }
    }
    await discardPhotoUpload(id, activeUser.id);
    await refreshPendingState(activeUser.id);
  }, [pendingPhotos, refreshPendingState]);

  const recordSaved = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    token,
    user,
    ready,
    online,
    loginLoading,
    accountBusy,
    syncing,
    pendingCount,
    pendingPhotos,
    lastSyncError,
    refreshKey,
    turmas,
    criancas,
    login,
    logout,
    refreshBase,
    syncNow,
    retryPhoto,
    discardPhoto,
    queueDraft,
    queueRecordPhotos,
    queueRecordMutation,
    recordSaved,
  }), [
    token,
    user,
    ready,
    online,
    loginLoading,
    accountBusy,
    syncing,
    pendingCount,
    pendingPhotos,
    lastSyncError,
    refreshKey,
    turmas,
    criancas,
    login,
    logout,
    refreshBase,
    syncNow,
    retryPhoto,
    discardPhoto,
    queueDraft,
    queueRecordPhotos,
    queueRecordMutation,
    recordSaved,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(requiredUpdate)} animationType="fade" transparent statusBarTranslucent>
        <View style={providerStyles.updateOverlay}>
          <View style={providerStyles.updateCard}>
            <Text accessibilityRole="header" style={providerStyles.updateTitle}>Atualizacao necessaria</Text>
            <Text style={providerStyles.updateText}>
              Esta versao ficou antiga para sincronizar com seguranca. Seus rascunhos continuam guardados no aparelho.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => { if (requiredUpdate?.apkUrl) void Linking.openURL(requiredUpdate.apkUrl); }}
              style={providerStyles.updateButton}
            >
              <Text style={providerStyles.updateButtonText}>Baixar versao {requiredUpdate?.latestVersion}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

const providerStyles = StyleSheet.create({
  updateOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(49,40,52,.56)" },
  updateCard: { width: "100%", maxWidth: 360, padding: 22, borderRadius: 14, backgroundColor: colors.surface },
  updateTitle: { fontSize: 21, fontWeight: "900", color: colors.text },
  updateText: { marginTop: 9, fontSize: 14, lineHeight: 21, fontWeight: "600", color: colors.muted },
  updateButton: { minHeight: 50, marginTop: 20, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: colors.primary },
  updateButtonText: { color: "white", fontWeight: "900" },
});
