import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "../providers/AppProvider";
import { colors } from "../theme";

function photoStatus(photo: ReturnType<typeof useApp>["pendingPhotos"][number]) {
  if (photo.lastError) return photo.lastError;
  if (photo.phase === "uploading") return `Enviando ${Math.round(photo.progress * 100)}%`;
  if (photo.phase === "confirming") return "Confirmando imagem";
  if (photo.phase === "failed") return "Envio interrompido";
  return "Aguardando sincronizacao";
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  const [panelVisible, setPanelVisible] = useState(false);
  const {
    user,
    online,
    syncing,
    pendingCount,
    pendingPhotos,
    lastSyncError,
    accountBusy,
    syncNow,
    retryPhoto,
    discardPhoto,
    logout,
  } = useApp();
  const syncLabel = syncing
    ? "Sincronizando"
    : pendingCount
      ? `${pendingCount} pendente${pendingCount === 1 ? "" : "s"}`
      : online
        ? "Sincronizado"
        : "Offline";

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible) return null;

  const confirmDiscard = (id: string) => {
    Alert.alert(
      "Remover foto pendente",
      "O registro de texto sera mantido. Apenas esta foto sera descartada.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover foto", style: "destructive", onPress: () => void discardPhoto(id) },
      ],
    );
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top, minHeight: 64 + insets.top }]}>
        <View style={styles.mark}>
          <Image source={require("../../assets/icon.png")} style={styles.markImage} contentFit="cover" />
        </View>
        <View style={styles.identity}>
          <Text style={styles.brand}>Pequenos Passos</Text>
          <Text numberOfLines={1} style={styles.user}>{user?.name || user?.email || "Professora"}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${syncLabel}. Abrir detalhes da sincronizacao.`}
          onPress={() => setPanelVisible(true)}
          style={({ pressed }) => [styles.sync, pressed && styles.pressed]}
        >
          {syncing
            ? <ActivityIndicator size="small" color={colors.primary} />
            : online
              ? pendingCount
                ? <Cloud size={18} color={colors.warning} />
                : <Cloud size={18} color={colors.success} />
              : <CloudOff size={18} color={colors.warning} />}
          <Text numberOfLines={1} style={styles.syncText}>{syncLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir opcoes da conta"
          disabled={accountBusy}
          hitSlop={4}
          onPress={logout}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed, accountBusy && styles.disabled]}
        >
          {accountBusy
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <UserRound size={19} color={colors.primary} />}
        </Pressable>
      </View>

      <Modal visible={panelVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setPanelVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPanelVisible(false)} />
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleWrap}>
              <Text accessibilityRole="header" style={styles.panelTitle}>Sincronizacao</Text>
              <Text style={styles.panelSubtitle}>
                {online ? "Seus dados sao enviados com seguranca." : "A fila sera retomada quando a internet voltar."}
              </Text>
            </View>
            <Pressable accessibilityLabel="Fechar" onPress={() => setPanelVisible(false)} style={styles.closeButton}>
              <X size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.statusCard}>
            {pendingCount === 0
              ? <CheckCircle2 size={21} color={colors.success} />
              : lastSyncError
                ? <AlertCircle size={21} color={colors.warning} />
                : <Cloud size={21} color={colors.primary} />}
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>{pendingCount ? syncLabel : "Tudo sincronizado"}</Text>
              <Text style={styles.statusText}>{lastSyncError || (pendingCount ? "Os itens permanecem protegidos neste aparelho." : "Nenhum envio aguardando.")}</Text>
            </View>
          </View>

          {pendingPhotos.length ? (
            <>
              <Text style={styles.sectionLabel}>Fotos aguardando envio</Text>
              <ScrollView style={styles.photoList} contentContainerStyle={styles.photoListContent}>
                {pendingPhotos.map((photo) => (
                  <View key={photo.id} style={styles.photoRow}>
                    <View style={styles.photoInfo}>
                      <Text numberOfLines={1} style={styles.photoName}>{photo.name}</Text>
                      <Text numberOfLines={2} style={[styles.photoStatus, photo.lastError && styles.photoError]}>
                        {photoStatus(photo)}
                      </Text>
                      {photo.phase === "uploading" ? (
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${Math.max(3, Math.round(photo.progress * 100))}%` }]} />
                        </View>
                      ) : null}
                    </View>
                    <Pressable accessibilityLabel="Tentar enviar foto novamente" onPress={() => void retryPhoto(photo.id)} style={styles.rowButton}>
                      <RefreshCw size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable accessibilityLabel="Descartar foto pendente" onPress={() => confirmDiscard(photo.id)} style={styles.rowButton}>
                      <Trash2 size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!online || syncing || pendingCount === 0}
            onPress={() => void syncNow(true)}
            style={({ pressed }) => [styles.retryAll, pressed && styles.pressed, (!online || syncing || pendingCount === 0) && styles.disabled]}
          >
            {syncing ? <ActivityIndicator size="small" color="white" /> : <RefreshCw size={18} color="white" />}
            <Text style={styles.retryAllText}>{syncing ? "Sincronizando..." : "Tentar tudo agora"}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mark: { width: 42, height: 42, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 13, backgroundColor: colors.surfaceSoft },
  markImage: { width: "100%", height: "100%" },
  identity: { flex: 1, minWidth: 0, marginLeft: 9 },
  brand: { fontSize: 15, fontWeight: "900", color: colors.text },
  user: { maxWidth: 160, marginTop: 1, fontSize: 11, color: colors.muted, fontWeight: "600" },
  sync: { minWidth: 74, minHeight: 44, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 5 },
  syncText: { maxWidth: 82, marginTop: 2, fontSize: 9, color: colors.muted, fontWeight: "800" },
  logout: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surfaceSoft },
  pressed: { opacity: 0.65 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(23,33,63,.42)" },
  panel: { position: "absolute", right: 0, bottom: 0, left: 0, maxHeight: "82%", paddingHorizontal: 16, paddingTop: 9, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface },
  panelHandle: { alignSelf: "center", width: 42, height: 4, marginBottom: 13, borderRadius: 2, backgroundColor: colors.borderStrong },
  panelHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  panelTitleWrap: { flex: 1 },
  panelTitle: { fontSize: 21, fontWeight: "900", color: colors.text },
  panelSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 18, fontWeight: "600", color: colors.muted },
  closeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  statusCard: { marginTop: 16, flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 13, borderRadius: 10, backgroundColor: colors.surfaceSoft },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: "900", color: colors.text },
  statusText: { marginTop: 3, fontSize: 11, lineHeight: 16, fontWeight: "600", color: colors.muted },
  sectionLabel: { marginTop: 17, marginBottom: 7, fontSize: 11, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },
  photoList: { maxHeight: 260 },
  photoListContent: { gap: 8 },
  photoRow: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  photoInfo: { flex: 1, minWidth: 0 },
  photoName: { fontSize: 13, fontWeight: "800", color: colors.text },
  photoStatus: { marginTop: 3, fontSize: 10, lineHeight: 14, color: colors.muted },
  photoError: { color: colors.warning },
  progressTrack: { height: 4, marginTop: 6, overflow: "hidden", borderRadius: 2, backgroundColor: colors.border },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: colors.primary },
  rowButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: colors.surfaceSoft },
  retryAll: { minHeight: 50, marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 9, backgroundColor: colors.primary },
  retryAllText: { color: "white", fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.46 },
});
