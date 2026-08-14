import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { CalendarDays, Camera, ChevronDown, ImagePlus, Mic, Save, Square, WifiOff, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppTextInput } from "../components/AppTextInput";
import { SelectionSheet } from "../components/SelectionSheet";
import { localDate } from "../date";
import {
  getEditingDraft,
  getPreference,
  persistPhotos,
  removeDraft,
  saveEditingDraft,
  setPreference,
} from "../offline";
import { useFeedback } from "../providers/FeedbackProvider";
import { colors } from "../theme";
import type { Crianca, DraftPhoto, OfflineDraft, Turma } from "../types";
import { preparePhoto } from "../utils/photos";

function newDraftId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function NewRecordScreen({
  ownerUserId,
  online,
  turmas,
  criancas,
  onSaved,
  onQueue,
  onManage,
}: {
  ownerUserId: string;
  online: boolean;
  turmas: Turma[];
  criancas: Crianca[];
  onSaved: () => void;
  onQueue: (draft: OfflineDraft) => Promise<void>;
  onManage: () => void;
}) {
  const feedback = useFeedback();
  const [draftId, setDraftId] = useState(newDraftId);
  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [date, setDate] = useState(localDate());
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">("idle");
  const [showDate, setShowDate] = useState(false);
  const [selection, setSelection] = useState<"turma" | "crianca" | null>(null);
  const speechBaseRef = useRef("");
  const finalSpeechPartsRef = useRef<string[]>([]);
  const interimSpeechRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognizingRef = useRef(false);
  const stoppedAfterSilenceRef = useRef(false);
  const textInputRef = useRef<TextInput>(null);
  const hydrationStartedRef = useRef(false);
  const filteredChildren = useMemo(
    () => criancas.filter((child) => !turmaId || child.turmaId === turmaId),
    [criancas, turmaId],
  );
  const selectedTurma = turmas.find((item) => item.id === turmaId);
  const selectedChild = criancas.find((item) => item.id === alunoId);

  useEffect(() => {
    if (hydrationStartedRef.current) return;
    hydrationStartedRef.current = true;
    let active = true;
    void (async () => {
      const [draft, lastTurma] = await Promise.all([
        getEditingDraft(ownerUserId),
        getPreference("last-turma-id", ownerUserId),
      ]);
      if (!active) return;
      if (draft) {
        setDraftId(draft.id);
        setAlunoId(draft.alunoId);
        setDate(draft.dataRegistro);
        setText(draft.texto);
        setPhotos(draft.fotos);
        const child = criancas.find((item) => item.id === draft.alunoId);
        if (child) setTurmaId(child.turmaId);
        setDraftState("saved");
      } else if (lastTurma && turmas.some((item) => item.id === lastTurma)) {
        setTurmaId(lastTurma);
      }
      setHydrated(true);
    })();
    return () => { active = false; };
  }, [criancas, ownerUserId, turmas]);

  useEffect(() => {
    if (!hydrated || turmaId || !alunoId) return;
    const child = criancas.find((item) => item.id === alunoId);
    if (child) setTurmaId(child.turmaId);
  }, [alunoId, criancas, hydrated, turmaId]);

  useEffect(() => {
    if (!hydrated) return;
    const hasContent = Boolean(alunoId || text.trim() || photos.length);
    const timer = setTimeout(() => {
      if (!hasContent) {
        void removeDraft(draftId);
        setDraftState("idle");
        return;
      }
      setDraftState("saving");
      void saveEditingDraft({
        id: draftId,
        clientMutationId: draftId,
        ownerUserId,
        alunoId,
        texto: text,
        dataRegistro: date,
        fotos: photos,
        createdAt: new Date(Number(draftId.split("-")[0]) || Date.now()).toISOString(),
      }).then(() => setDraftState("saved"));
    }, 500);
    return () => clearTimeout(timer);
  }, [alunoId, date, draftId, hydrated, ownerUserId, photos, text]);

  const mergeSpeech = (interim = "") => {
    const spoken = [...finalSpeechPartsRef.current, interim.trim()].filter(Boolean).join(" ").trim();
    return [speechBaseRef.current, spoken].filter(Boolean).join(speechBaseRef.current && spoken ? "\n\n" : "");
  };

  const clearSilenceTimer = useCallback(() => {
    if (!silenceTimerRef.current) return;
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }, []);

  const scheduleSilenceStop = useCallback(() => {
    clearSilenceTimer();
    if (!recognizingRef.current) return;

    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (!recognizingRef.current) return;
      stoppedAfterSilenceRef.current = true;
      setTranscribing(true);
      ExpoSpeechRecognitionModule.stop();
    }, 3000);
  }, [clearSilenceTimer]);

  useSpeechRecognitionEvent("start", () => {
    recognizingRef.current = true;
    stoppedAfterSilenceRef.current = false;
    setRecognizing(true);
    setTranscribing(false);
    scheduleSilenceStop();
  });

  useSpeechRecognitionEvent("speechstart", scheduleSilenceStop);
  useSpeechRecognitionEvent("speechend", scheduleSilenceStop);
  useSpeechRecognitionEvent("soundstart", scheduleSilenceStop);
  useSpeechRecognitionEvent("soundend", scheduleSilenceStop);
  useSpeechRecognitionEvent("volumechange", (event) => {
    // Android continua emitindo volume 0 durante o silencio. Renovar o timer
    // apenas quando houver voz evita que o ditado fique aberto indefinidamente.
    if (event.value > 0.5) scheduleSilenceStop();
  });

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) return;
    scheduleSilenceStop();
    if (event.isFinal) {
      if (finalSpeechPartsRef.current.at(-1) !== transcript) finalSpeechPartsRef.current.push(transcript);
      interimSpeechRef.current = "";
      setText(mergeSpeech());
      return;
    }
    interimSpeechRef.current = transcript;
    setText(mergeSpeech(transcript));
  });

  useSpeechRecognitionEvent("end", () => {
    const stoppedAfterSilence = stoppedAfterSilenceRef.current;
    clearSilenceTimer();
    recognizingRef.current = false;
    stoppedAfterSilenceRef.current = false;
    const interim = interimSpeechRef.current.trim();
    if (interim && finalSpeechPartsRef.current.at(-1) !== interim) finalSpeechPartsRef.current.push(interim);
    interimSpeechRef.current = "";
    setText(mergeSpeech());
    setRecognizing(false);
    setTranscribing(false);
    setRecordingSeconds(0);
    if (stoppedAfterSilence) {
      feedback("Ditado concluido apos 3 segundos sem fala.", { tone: "success", duration: 2800 });
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    const stoppedAfterSilence = stoppedAfterSilenceRef.current;
    clearSilenceTimer();
    recognizingRef.current = false;
    stoppedAfterSilenceRef.current = false;
    setRecognizing(false);
    setTranscribing(false);
    setRecordingSeconds(0);
    if (event.error === "aborted" || (stoppedAfterSilence && event.error === "no-speech")) return;
    const message = event.error === "not-allowed"
      ? "Permita o uso do microfone nas configuracoes do aparelho."
      : event.error === "network"
        ? "A transcricao precisa de internet neste aparelho. Seu rascunho continua salvo."
        : event.error === "language-not-supported" || event.error === "service-not-allowed"
          ? "A transcricao por voz nao esta disponivel neste aparelho. Voce pode continuar digitando normalmente."
          : event.error === "no-speech"
            ? "Nenhuma fala foi identificada. Tente novamente mais perto do aparelho."
        : "Nao foi possivel reconhecer a fala. Tente novamente mais perto do aparelho.";
    feedback(message, { tone: "warning", duration: 5200 });
  });

  useEffect(() => {
    if (!recognizing) return;
    const interval = setInterval(() => {
      setRecordingSeconds((current) => {
        if (current >= 299) {
          ExpoSpeechRecognitionModule.stop();
          return 300;
        }
        return current + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [recognizing]);

  useEffect(() => () => {
    clearSilenceTimer();
    if (recognizingRef.current) ExpoSpeechRecognitionModule.abort();
  }, [clearSilenceTimer]);

  const chooseTurma = (id: string) => {
    setTurmaId(id);
    if (selectedChild?.turmaId !== id) setAlunoId("");
    void setPreference("last-turma-id", id, ownerUserId);
    setSelection(null);
  };

  const chooseChild = (id: string) => {
    const child = criancas.find((item) => item.id === id);
    if (child) {
      setTurmaId(child.turmaId);
      void setPreference("last-turma-id", child.turmaId, ownerUserId);
    }
    setAlunoId(id);
    setSelection(null);
  };

  const pickPhotos = async (camera = false) => {
    Keyboard.dismiss();
    const remaining = 6 - photos.length;
    if (remaining <= 0) return feedback("O limite e de 6 fotos por registro.", { tone: "warning" });

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
      for (const asset of result.assets.slice(0, remaining)) {
        compressed.push(await preparePhoto(asset));
      }
      const persisted = await persistPhotos(compressed, draftId);
      setPhotos((current) => [...current, ...persisted].slice(0, 6));
      feedback(`${persisted.length} foto${persisted.length === 1 ? " adicionada" : "s adicionadas"}.`, { tone: "success" });
    } catch (error) {
      feedback(error instanceof Error ? error.message : "Nao foi possivel preparar as fotos.", { tone: "danger" });
    }
  };

  const removePhoto = (photo: DraftPhoto) => {
    setPhotos((current) => current.filter((item) => item.uri !== photo.uri));
    feedback("Foto removida do registro.", {
      actionLabel: "Desfazer",
      onAction: () => setPhotos((current) => [...current, photo].slice(0, 6)),
    });
  };

  const startRecording = async () => {
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        return feedback("A transcricao por voz nao esta disponivel neste aparelho.", { tone: "warning" });
      }
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        return Alert.alert("Microfone", "Permita o uso do microfone nas configuracoes do aparelho.");
      }
      speechBaseRef.current = text.trim();
      finalSpeechPartsRef.current = [];
      interimSpeechRef.current = "";
      stoppedAfterSilenceRef.current = false;
      setRecordingSeconds(0);
      setTranscribing(true);
      ExpoSpeechRecognitionModule.start({
        lang: "pt-BR",
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 200,
        },
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
        },
      });
    } catch (error) {
      setTranscribing(false);
      feedback(error instanceof Error ? error.message : "Nao foi possivel iniciar a transcricao.", { tone: "warning" });
    }
  };

  const stopAndTranscribe = () => {
    if (!recognizing) return;
    clearSilenceTimer();
    stoppedAfterSilenceRef.current = false;
    setTranscribing(true);
    ExpoSpeechRecognitionModule.stop();
  };

  const resetForm = () => {
    setDraftId(newDraftId());
    setAlunoId("");
    setText("");
    setPhotos([]);
    setDate(localDate());
    setDraftState("idle");
  };

  const save = async () => {
    if (!alunoId || text.trim().length < 3) {
      return feedback("Selecione a crianca e escreva uma anotacao.", { tone: "warning" });
    }
    Keyboard.dismiss();
    setSaving(true);
    const draft: OfflineDraft = {
      id: draftId,
      clientMutationId: draftId,
      ownerUserId,
      alunoId,
      texto: text.trim(),
      dataRegistro: date,
      fotos: photos,
      createdAt: new Date().toISOString(),
    };

    try {
      await onQueue(draft);
      resetForm();
      feedback(
        online
          ? photos.length
            ? `Registro protegido. Enviando ${photos.length} foto${photos.length === 1 ? "" : "s"} em segundo plano.`
            : "Registro protegido. Sincronizando agora."
          : "Registro guardado. Ele sera enviado quando a internet voltar.",
        { tone: online ? "success" : "warning", duration: 5200 },
      );
      onSaved();
    } catch {
      feedback("Nao foi possivel proteger este registro no aparelho. Tente salvar novamente.", { tone: "danger", duration: 5600 });
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDate(false);
    if (selected) setDate(localDate(selected));
  };

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView
        style={styles.fill}
        bottomOffset={118}
        extraKeyboardSpace={12}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={false}
      >
        {!online ? (
          <View style={styles.offline}>
            <WifiOff size={17} color={colors.warning} />
            <Text style={styles.offlineText}>Sem internet. O registro sera protegido neste aparelho.</Text>
          </View>
        ) : null}

        <Text accessibilityRole="header" style={styles.title}>Novo registro</Text>
        <Text style={styles.subtitle}>Registre uma evidencia em poucos segundos.</Text>

        <Text style={styles.label}>Turma</Text>
        <Pressable accessibilityRole="button" onPress={() => setSelection("turma")} style={styles.selector}>
          <Text numberOfLines={1} style={[styles.selectorText, !selectedTurma && styles.placeholder]}>{selectedTurma?.nome || "Selecionar turma"}</Text>
          <ChevronDown size={19} color={colors.primary} />
        </Pressable>

        <Text style={styles.label}>Crianca</Text>
        <Pressable accessibilityRole="button" onPress={() => setSelection("crianca")} style={styles.selector}>
          <Text numberOfLines={1} style={[styles.selectorText, !selectedChild && styles.placeholder]}>{selectedChild?.nome || "Selecionar crianca"}</Text>
          <ChevronDown size={19} color={colors.primary} />
        </Pressable>

        {!turmas.length || !criancas.length ? (
          <Pressable onPress={onManage} style={styles.manageButton}>
            <Text style={styles.manageButtonText}>Cadastrar turma e crianca</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Data</Text>
        <Pressable accessibilityRole="button" onPress={() => setShowDate(true)} style={styles.selector}>
          <Text style={styles.selectorText}>{new Intl.DateTimeFormat("pt-BR").format(parseDate(date))}</Text>
          <CalendarDays size={19} color={colors.primary} />
        </Pressable>
        {showDate ? <DateTimePicker value={parseDate(date)} mode="date" display="default" onChange={onDateChange} /> : null}

        <Text style={styles.label}>Anotacao pedagogica</Text>
        <AppTextInput
          ref={textInputRef}
          accessibilityLabel="Anotacao pedagogica"
          style={styles.textarea}
          multiline
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
          placeholder="O que aconteceu? Como a crianca participou?"
          submitBehavior="newline"
        />

        <View style={styles.actions}>
          <Pressable
            disabled={transcribing && !recognizing}
            onPress={recognizing ? stopAndTranscribe : startRecording}
            style={({ pressed }) => [styles.secondaryButton, recognizing && styles.recordingButton, pressed && styles.pressed]}
          >
            {recognizing ? <Square size={17} color={colors.danger} fill={colors.danger} /> : <Mic size={19} color={colors.primary} />}
            <Text style={styles.secondaryText}>
              {transcribing && !recognizing
                ? "Preparando"
                : recognizing
                  ? `Parar ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`
                  : "Ditar registro"}
            </Text>
          </Pressable>
          <Pressable accessibilityLabel="Abrir camera" onPress={() => void pickPhotos(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Camera size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => void pickPhotos(false)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <ImagePlus size={19} color={colors.primary} />
            <Text style={styles.secondaryText}>Fotos {photos.length}/6</Text>
          </Pressable>
        </View>
        {recognizing ? (
          <Text accessibilityLiveRegion="polite" style={styles.dictationHint}>
            O ditado para sozinho depois de 3 segundos sem fala.
          </Text>
        ) : null}

        {photos.length ? (
          <View style={styles.previewGrid}>
            {photos.map((photo, index) => (
              <View key={photo.uri} style={styles.previewWrap}>
                <Image source={photo.uri} style={styles.preview} contentFit="cover" transition={120} />
                <Pressable accessibilityLabel={`Remover foto ${index + 1}`} onPress={() => removePhoto(photo)} style={styles.removePhoto}>
                  <X size={16} color="white" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <Text accessibilityLiveRegion="polite" style={styles.draftStatus}>
          {draftState === "saving" ? "Salvando rascunho..." : draftState === "saved" ? "Rascunho salvo" : "Pronto para registrar"}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={saving || transcribing || recognizing}
          onPress={() => void save()}
          style={({ pressed }) => [styles.saveButton, pressed && styles.savePressed, (saving || transcribing || recognizing) && styles.disabled]}
        >
          <Save size={20} color="white" />
          <Text style={styles.saveText}>{saving ? "Protegendo..." : "Salvar registro"}</Text>
        </Pressable>
      </View>

      <SelectionSheet
        visible={selection === "turma"}
        title="Escolher turma"
        items={turmas.map((item) => ({ id: item.id, label: item.nome, supportingText: item.faixaEtaria || item.turno || undefined }))}
        selectedId={turmaId}
        searchPlaceholder="Buscar turma"
        onSelect={(item) => chooseTurma(item.id)}
        onClose={() => setSelection(null)}
      />
      <SelectionSheet
        visible={selection === "crianca"}
        title="Escolher crianca"
        items={filteredChildren.map((item) => ({ id: item.id, label: item.nome, supportingText: item.turma.nome }))}
        selectedId={alunoId}
        searchPlaceholder="Buscar crianca"
        onSelect={(item) => chooseChild(item.id)}
        onClose={() => setSelection(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  title: { fontSize: 25, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 2, fontSize: 13, color: colors.muted, fontWeight: "600" },
  label: { marginTop: 16, marginBottom: 7, fontSize: 11, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },
  selector: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  selectorText: { flex: 1, minWidth: 0, fontSize: 15, color: colors.text, fontWeight: "800" },
  placeholder: { color: colors.muted, fontWeight: "600" },
  textarea: { minHeight: 210, lineHeight: 23 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  secondaryButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 13, backgroundColor: colors.surface },
  secondaryText: { fontSize: 13, fontWeight: "800", color: colors.primary },
  recordingButton: { borderColor: "#F4B3C8", backgroundColor: colors.pinkSoft },
  dictationHint: { marginTop: 8, fontSize: 11, lineHeight: 16, color: colors.muted, fontWeight: "700" },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.blueSoft },
  previewGrid: { marginTop: 13, flexDirection: "row", flexWrap: "wrap", gap: 9 },
  previewWrap: { width: "31%", aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: colors.surfaceSoft },
  preview: { width: "100%", height: "100%" },
  removePhoto: { position: "absolute", top: 5, right: 5, width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "rgba(49,40,52,.78)" },
  footer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  draftStatus: { marginBottom: 6, textAlign: "center", fontSize: 10, color: colors.muted, fontWeight: "800" },
  saveButton: { minHeight: 52, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 10, elevation: 3 },
  savePressed: { opacity: 0.87, transform: [{ scale: 0.995 }] },
  saveText: { color: "white", fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.68 },
  offline: { marginBottom: 13, padding: 12, borderRadius: 14, backgroundColor: colors.amberSoft, flexDirection: "row", alignItems: "center", gap: 8 },
  offlineText: { flex: 1, color: colors.warning, fontSize: 12, fontWeight: "700" },
  manageButton: { marginTop: 12, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.surfaceSoft },
  manageButtonText: { color: colors.primary, fontWeight: "800" },
});
