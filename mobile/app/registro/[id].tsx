import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarDays, Camera, ChevronDown, Download, Edit3, ImageIcon, ImagePlus, Save, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, exportWord, getRegistro, request, updateRegistro } from "../../src/api";
import { AppTextInput } from "../../src/components/AppTextInput";
import { SelectionSheet } from "../../src/components/SelectionSheet";
import { localDate } from "../../src/date";
import { cacheRecord, getCachedRecords, persistPhotos, removePhotoFile } from "../../src/offline";
import { useApp } from "../../src/providers/AppProvider";
import { useFeedback } from "../../src/providers/FeedbackProvider";
import { colors } from "../../src/theme";
import type { DraftPhoto, Registro } from "../../src/types";
import { preparePhoto } from "../../src/utils/photos";

function parseDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const feedback = useFeedback();
  const { token, user, online, criancas, pendingPhotos, discardPhoto, queueRecordPhotos, recordSaved, queueRecordMutation } = useApp();
  const [record, setRecord] = useState<Registro | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [childId, setChildId] = useState("");
  const [showDate, setShowDate] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [newPhotos, setNewPhotos] = useState<DraftPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const textRef = useRef<TextInput>(null);
  const queuedPhotos = useMemo(
    () => pendingPhotos.filter((photo) => photo.recordId === id),
    [id, pendingPhotos],
  );

  const applyRecord = useCallback((value: Registro) => {
    setRecord(value);
    setText(value.texto);
    setDate(value.dataRegistro.slice(0, 10));
    setChildId(value.alunoId);
  }, []);

  const load = useCallback(async () => {
    if (!id || !token || !user) return;
    setLoading(true);
    try {
      if (!online) throw new Error("offline");
      const value = await getRegistro(token, id);
      await cacheRecord(value, user.id);
      applyRecord(value);
    } catch {
      const cached = (await getCachedRecords(user.id)).find((item) => item.id === id);
      if (cached) applyRecord(cached);
      else feedback("Este registro nao esta disponivel no aparelho.", { tone: "warning" });
    } finally {
      setLoading(false);
    }
  }, [applyRecord, feedback, id, online, token, user]);

  useEffect(() => { void load(); }, [load]);

  const visibleExistingPhotos = useMemo(
    () => record?.fotos.filter((photo) => !removedPhotoIds.includes(photo.id)) ?? [],
    [record?.fotos, removedPhotoIds],
  );

  const beginEditing = () => {
    if (!record) return;
    setText(record.texto);
    setDate(record.dataRegistro.slice(0, 10));
    setChildId(record.alunoId);
    setRemovedPhotoIds([]);
    setNewPhotos([]);
    setEditing(true);
  };

  const cancelEditing = () => {
    newPhotos.forEach(removePhotoFile);
    setNewPhotos([]);
    setRemovedPhotoIds([]);
    setEditing(false);
  };

  const pickPhotos = async (camera = false) => {
    if (!record || preparingPhotos) return;
    Keyboard.dismiss();
    const remaining = 6 - visibleExistingPhotos.length - queuedPhotos.length - newPhotos.length;
    if (remaining <= 0) return feedback("O limite e de 6 fotos por registro.", { tone: "warning" });

    setPreparingPhotos(true);
    try {
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.88 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.88,
            allowsMultipleSelection: true,
            selectionLimit: remaining,
          });
      if (result.canceled) return;

      const compressed: Awaited<ReturnType<typeof preparePhoto>>[] = [];
      for (const asset of result.assets.slice(0, remaining)) compressed.push(await preparePhoto(asset));
      const persisted = await persistPhotos(compressed, `edit_${record.id}_${Date.now()}`);
      setNewPhotos((current) => [...current, ...persisted].slice(0, remaining + current.length));
      feedback(`${persisted.length} foto${persisted.length === 1 ? " adicionada" : "s adicionadas"}.`, { tone: "success" });
    } catch (error) {
      feedback(error instanceof Error ? error.message : "Nao foi possivel preparar as fotos.", { tone: "danger" });
    } finally {
      setPreparingPhotos(false);
    }
  };

  const removeNewPhoto = (photo: DraftPhoto) => {
    setNewPhotos((current) => current.filter((item) => item.id !== photo.id));
    removePhotoFile(photo);
  };

  const save = async (force = false) => {
    if (!record || !token || !user) return;
    if (text.trim().length < 3 || !childId) return feedback("Preencha crianca e anotacao.", { tone: "warning" });
    Keyboard.dismiss();
    setSaving(true);
    try {
      if (!online) {
        const child = criancas.find((item) => item.id === childId);
        if (!child) throw new Error("Crianca nao encontrada no aparelho.");
        const payload = {
          texto: text.trim(),
          dataRegistro: date,
          alunoId: childId,
          removeFotoIds: removedPhotoIds,
          expectedUpdatedAt: record.updatedAt,
        };
        const localRecord: Registro = {
          ...record,
          ...payload,
          fotos: record.fotos.filter((photo) => !removedPhotoIds.includes(photo.id)),
          updatedAt: new Date().toISOString(),
          aluno: { id: child.id, nome: child.nome, turmaId: child.turmaId, turma: child.turma },
        };
        await queueRecordMutation({ id: `update-${record.id}`, type: "update", recordId: record.id, payload, createdAt: new Date().toISOString() });
        await queueRecordPhotos(record.id, newPhotos, localRecord.fotos.length + queuedPhotos.length);
        await cacheRecord(localRecord, user.id);
        applyRecord(localRecord);
        setNewPhotos([]);
        setRemovedPhotoIds([]);
        setEditing(false);
        recordSaved();
        feedback("Edicao protegida. Sera sincronizada quando a internet voltar.", { tone: "warning", duration: 5200 });
        return;
      }
      const result = await updateRegistro(token, record.id, {
        texto: text.trim(),
        dataRegistro: date,
        alunoId: childId,
        removeFotoIds: removedPhotoIds,
        ...(force ? {} : { expectedUpdatedAt: record.updatedAt }),
      });
      const updated = "registro" in result ? result.registro : result;
      await queueRecordPhotos(record.id, newPhotos, updated.fotos.length + queuedPhotos.length);
      await cacheRecord(updated, user.id);
      applyRecord(updated);
      setNewPhotos([]);
      setRemovedPhotoIds([]);
      setEditing(false);
      recordSaved();
      feedback("Alteracoes salvas.", { tone: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        Alert.alert(
          "Registro alterado em outro lugar",
          "Recarregue a versao mais recente ou mantenha o texto que esta neste aparelho.",
          [
            { text: "Recarregar", onPress: () => void load() },
            { text: "Manter o meu", onPress: () => void save(true) },
            { text: "Cancelar", style: "cancel" },
          ],
        );
      } else {
        feedback(error instanceof Error ? error.message : "Falha ao salvar.", { tone: "danger" });
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!record || !token || !user) return;
    Alert.alert("Mover para lixeira", "O registro podera ser restaurado por 30 dias.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Mover",
        style: "destructive",
        onPress: async () => {
          try {
            if (online) await request(token, `/api/registros/${record.id}`, { method: "DELETE" });
            else await queueRecordMutation({ id: `delete-${record.id}`, type: "delete", recordId: record.id, createdAt: new Date().toISOString() });
            await cacheRecord({ ...record, deletedAt: new Date().toISOString() }, user.id);
            router.back();
            recordSaved();
            feedback("Registro movido para a lixeira.", {
              actionLabel: "Desfazer",
              onAction: async () => {
                try {
                  const restored = online
                    ? await request<Registro>(token, `/api/registros/${record.id}/restore`, { method: "POST" })
                    : { ...record, deletedAt: null };
                  if (!online) await queueRecordMutation({ id: `restore-${record.id}`, type: "restore", recordId: record.id, createdAt: new Date().toISOString() });
                  await cacheRecord(restored, user.id);
                  recordSaved();
                } catch (error) {
                  feedback(error instanceof Error ? error.message : "Falha ao restaurar o registro.", { tone: "danger" });
                }
              },
            });
          } catch (error) {
            feedback(error instanceof Error ? error.message : "Falha ao mover o registro para a lixeira.", { tone: "danger" });
          }
        },
      },
    ]);
  };

  const selectedChild = useMemo(() => criancas.find((item) => item.id === childId), [childId, criancas]);
  const onDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === "android") setShowDate(false);
    if (value) setDate(localDate(value));
  };

  if (!token) return null;

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Registro</Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>{record?.aluno.nome || "Carregando"}</Text>
        </View>
        {record ? (
          <Pressable accessibilityLabel={editing ? "Cancelar edicao" : "Editar registro"} onPress={editing ? cancelEditing : beginEditing} style={styles.headerButton}>
            {editing ? <X size={21} color={colors.primary} /> : <Edit3 size={20} color={colors.primary} />}
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Abrindo registro</Text></View>
      ) : !record ? (
        <View style={styles.loading}><Text style={styles.loadingText}>Registro nao encontrado.</Text></View>
      ) : editing ? (
        <KeyboardAwareScrollView
          bottomOffset={70}
          extraKeyboardSpace={12}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.label}>Crianca</Text>
          <Pressable onPress={() => setShowChildren(true)} style={styles.selector}>
            <Text numberOfLines={1} style={styles.selectorText}>{selectedChild?.nome || "Selecionar crianca"}</Text>
            <ChevronDown size={19} color={colors.primary} />
          </Pressable>
          <Text style={styles.label}>Data</Text>
          <Pressable onPress={() => setShowDate(true)} style={styles.selector}>
            <Text style={styles.selectorText}>{new Intl.DateTimeFormat("pt-BR").format(parseDate(date))}</Text>
            <CalendarDays size={19} color={colors.primary} />
          </Pressable>
          {showDate ? <DateTimePicker value={parseDate(date)} mode="date" display="default" onChange={onDateChange} /> : null}
          <Text style={styles.label}>Anotacao</Text>
          <AppTextInput ref={textRef} accessibilityLabel="Anotacao pedagogica" multiline textAlignVertical="top" value={text} onChangeText={setText} style={styles.textarea} submitBehavior="newline" />
          <Text style={styles.label}>Fotos</Text>
          <View style={styles.editPhotoActions}>
            <Pressable disabled={preparingPhotos} onPress={() => void pickPhotos(true)} style={styles.photoActionButton}>
              <Camera size={18} color={colors.primary} />
              <Text style={styles.photoActionText}>Camera</Text>
            </Pressable>
            <Pressable disabled={preparingPhotos} onPress={() => void pickPhotos(false)} style={styles.photoActionButton}>
              {preparingPhotos ? <ActivityIndicator size="small" color={colors.primary} /> : <ImagePlus size={18} color={colors.primary} />}
              <Text style={styles.photoActionText}>Galeria</Text>
            </Pressable>
            <Text style={styles.photoCount}>{visibleExistingPhotos.length + queuedPhotos.length + newPhotos.length}/6</Text>
          </View>
          <View style={styles.photoGrid}>
            {visibleExistingPhotos.map((photo) => photo.url ? (
              <View key={photo.id} style={styles.photoWrap}>
                <Image source={photo.url} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" />
                <Pressable accessibilityLabel="Remover foto" onPress={() => setRemovedPhotoIds((current) => [...current, photo.id])} style={styles.removePhotoButton}>
                  <X size={16} color="white" />
                </Pressable>
              </View>
            ) : null)}
            {queuedPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoWrap}>
                <Image source={photo.uri} style={styles.photo} contentFit="cover" />
                <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Pendente</Text></View>
                <Pressable accessibilityLabel="Remover foto pendente" onPress={() => void discardPhoto(photo.id)} style={styles.removePhotoButton}>
                  <X size={16} color="white" />
                </Pressable>
              </View>
            ))}
            {newPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoWrap}>
                <Image source={photo.uri} style={styles.photo} contentFit="cover" />
                <Pressable accessibilityLabel="Remover nova foto" onPress={() => removeNewPhoto(photo)} style={styles.removePhotoButton}>
                  <X size={16} color="white" />
                </Pressable>
              </View>
            ))}
          </View>
          <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Save size={19} color="white" />}
            <Text style={styles.saveText}>{saving ? "Salvando..." : "Salvar alteracoes"}</Text>
          </Pressable>
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.metaBand}>
            <View><Text style={styles.metaLabel}>Crianca</Text><Text style={styles.metaValue}>{record.aluno.nome}</Text></View>
            <View><Text style={styles.metaLabel}>Turma</Text><Text style={styles.metaValue}>{record.aluno.turma.nome}</Text></View>
            <View><Text style={styles.metaLabel}>Data</Text><Text style={styles.metaValue}>{new Intl.DateTimeFormat("pt-BR").format(parseDate(record.dataRegistro))}</Text></View>
          </View>
          <Text style={styles.recordText}>{record.texto}</Text>
          {record.fotos.length || queuedPhotos.length ? (
            <>
              <View style={styles.photoTitle}><ImageIcon size={18} color={colors.primary} /><Text style={styles.photoTitleText}>Fotos do registro</Text></View>
              <View style={styles.photoGrid}>
                {record.fotos.map((photo, index) => photo.url ? (
                  <Pressable key={photo.id} onPress={() => setPhotoIndex(index)} style={styles.photoWrap}>
                    <Image source={photo.url} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                  </Pressable>
                ) : null)}
                {queuedPhotos.map((photo) => (
                  <View key={photo.id} style={styles.photoWrap}>
                    <Image source={photo.uri} style={styles.photo} contentFit="cover" />
                    <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Enviando</Text></View>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              disabled={exporting}
              onPress={() => {
                setExporting(true);
                void exportWord(token, { ids: [record.id] })
                  .catch((error) => feedback(error instanceof Error ? error.message : "Falha ao gerar o Word.", { tone: "danger" }))
                  .finally(() => setExporting(false));
              }}
              style={[styles.outlineButton, exporting && styles.disabled]}
            >
              {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Download size={18} color={colors.primary} />}
              <Text style={styles.outlineText}>{exporting ? "Gerando..." : "Baixar Word"}</Text>
            </Pressable>
            <Pressable onPress={remove} style={styles.dangerButton}>
              <Trash2 size={18} color={colors.danger} /><Text style={styles.dangerText}>Lixeira</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <SelectionSheet
        visible={showChildren}
        title="Escolher crianca"
        items={criancas.map((item) => ({ id: item.id, label: item.nome, supportingText: item.turma.nome }))}
        selectedId={childId}
        searchPlaceholder="Buscar crianca"
        onSelect={(item) => { setChildId(item.id); setShowChildren(false); }}
        onClose={() => setShowChildren(false)}
      />

      <Modal visible={photoIndex !== null} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setPhotoIndex(null)}>
        <View style={styles.viewer}>
          <Pressable accessibilityLabel="Fechar foto" onPress={() => setPhotoIndex(null)} style={styles.viewerClose}><X size={25} color="white" /></Pressable>
          <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={styles.viewerContent} centerContent>
            {photoIndex !== null && record?.fotos[photoIndex]?.url ? <Image source={record.fotos[photoIndex].url} style={styles.viewerImage} contentFit="contain" cachePolicy="memory-disk" /> : null}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 60, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  headerText: { flex: 1, minWidth: 0, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  headerSubtitle: { maxWidth: 210, marginTop: 1, fontSize: 11, fontWeight: "600", color: colors.muted },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: colors.muted, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 38 },
  label: { marginTop: 14, marginBottom: 7, fontSize: 11, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },
  selector: { minHeight: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface },
  selectorText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "800" },
  textarea: { minHeight: 260, lineHeight: 23 },
  editPhotoActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  photoActionButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface },
  photoActionText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  photoCount: { marginLeft: "auto", color: colors.muted, fontSize: 11, fontWeight: "900" },
  saveButton: { minHeight: 50, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 9, backgroundColor: colors.primary },
  saveText: { color: "white", fontWeight: "900" },
  disabled: { opacity: 0.58 },
  metaBand: { flexDirection: "row", flexWrap: "wrap", gap: 18, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.border },
  metaLabel: { fontSize: 10, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },
  metaValue: { marginTop: 3, fontSize: 13, fontWeight: "800", color: colors.text },
  recordText: { marginTop: 18, fontSize: 16, lineHeight: 25, color: colors.text },
  photoTitle: { marginTop: 24, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 7 },
  photoTitleText: { fontSize: 14, fontWeight: "900", color: colors.text },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  photoWrap: { width: "48%", aspectRatio: 1.15, borderRadius: 9, overflow: "hidden", backgroundColor: colors.surfaceSoft },
  photo: { width: "100%", height: "100%" },
  removePhotoButton: { position: "absolute", top: 5, right: 5, width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "rgba(49,40,52,.78)" },
  pendingBadge: { position: "absolute", right: 5, bottom: 5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: "rgba(49,40,52,.78)" },
  pendingBadgeText: { color: "white", fontSize: 9, fontWeight: "900" },
  actions: { marginTop: 26, flexDirection: "row", gap: 9 },
  outlineButton: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 9 },
  outlineText: { color: colors.primary, fontWeight: "900" },
  dangerButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: "#f0c3ca", borderRadius: 9 },
  dangerText: { color: colors.danger, fontWeight: "900" },
  viewer: { flex: 1, backgroundColor: "rgba(20,15,19,.97)" },
  viewerClose: { position: "absolute", top: 42, right: 14, zIndex: 2, width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,.14)" },
  viewerContent: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  viewerImage: { width: "100%", height: "100%" },
});
