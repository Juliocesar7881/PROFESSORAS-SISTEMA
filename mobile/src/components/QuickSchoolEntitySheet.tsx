import { Baby, Check, LoaderCircle, School, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme";
import type { Turma } from "../types";
import { AppBottomSheet } from "./AppBottomSheet";
import { AppKeyboardToolbar } from "./AppKeyboardToolbar";
import { AppTextInput } from "./AppTextInput";

export type QuickSchoolEntityMode = "turma" | "crianca";

export function QuickSchoolEntitySheet({
  visible,
  mode,
  turmas,
  selectedTurmaId,
  saving,
  onClose,
  onSaveTurma,
  onSaveCrianca,
}: {
  visible: boolean;
  mode: QuickSchoolEntityMode;
  turmas: Turma[];
  selectedTurmaId?: string;
  saving: boolean;
  onClose: () => void;
  onSaveTurma: (nome: string) => Promise<void>;
  onSaveCrianca: (nome: string, turmaId: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [nome, setNome] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const firstTurmaId = turmas[0]?.id;

  useEffect(() => {
    if (!visible) return;
    setNome("");
    setTurmaId(selectedTurmaId || firstTurmaId || "");
    const timer = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(timer);
  }, [firstTurmaId, mode, selectedTurmaId, visible]);

  const submit = async () => {
    const normalizedName = nome.trim();
    if (!normalizedName || saving) return;
    if (mode === "turma") await onSaveTurma(normalizedName);
    else if (turmaId) await onSaveCrianca(normalizedName, turmaId);
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      accessibilityLabel="Fechar cadastro rápido"
      contentStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.titleIcon}>
            {mode === "turma" ? <School size={20} color={colors.primary} /> : <Baby size={20} color={colors.primary} />}
          </View>
          <View style={styles.titleText}>
            <Text accessibilityRole="header" style={styles.title}>
              {mode === "turma" ? "Cadastrar nova turma" : "Cadastrar nova criança"}
            </Text>
            <Text style={styles.description}>
              {mode === "turma"
                ? "Informe só o nome. Depois cadastraremos a primeira criança."
                : "Ela será selecionada automaticamente no registro."}
            </Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" disabled={saving} onPress={onClose} style={styles.close}>
          <X size={21} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={70}
        extraKeyboardSpace={12}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>{mode === "turma" ? "Nome da turma" : "Nome da criança"}</Text>
        <AppTextInput
          ref={inputRef}
          accessibilityLabel={mode === "turma" ? "Nome da turma" : "Nome da criança"}
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
          editable={!saving}
          placeholder={mode === "turma" ? "Ex.: Maternal II" : "Nome completo"}
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        {mode === "crianca" ? (
          <>
            <Text style={styles.label}>Turma</Text>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={styles.classList}
              contentContainerStyle={styles.classListContent}
            >
              {turmas.map((item) => {
                const selected = item.id === turmaId;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    disabled={saving}
                    onPress={() => setTurmaId(item.id)}
                    style={({ pressed }) => [styles.classItem, selected && styles.classItemSelected, pressed && styles.pressed]}
                  >
                    <Text numberOfLines={1} style={[styles.className, selected && styles.classNameSelected]}>{item.nome}</Text>
                    {selected ? <Check size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving || !nome.trim() || (mode === "crianca" && !turmaId) }}
          disabled={saving || !nome.trim() || (mode === "crianca" && !turmaId)}
          onPress={() => {
            Keyboard.dismiss();
            void submit();
          }}
          style={({ pressed }) => [styles.save, pressed && styles.savePressed, (saving || !nome.trim() || (mode === "crianca" && !turmaId)) && styles.disabled]}
        >
          {saving ? <LoaderCircle size={19} color="white" /> : mode === "turma" ? <School size={19} color="white" /> : <Baby size={19} color="white" />}
          <Text style={styles.saveText}>
            {saving ? "Salvando..." : mode === "turma" ? "Salvar e cadastrar criança" : "Salvar criança"}
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
      <AppKeyboardToolbar />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: "88%", backgroundColor: colors.surface },
  handle: { width: 38, height: 4, alignSelf: "center", marginTop: 9, borderRadius: 2, backgroundColor: colors.borderStrong },
  header: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  titleIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.surfaceSoft },
  titleText: { flex: 1, minWidth: 0 },
  title: { fontSize: 19, fontWeight: "900", color: colors.text },
  description: { marginTop: 2, fontSize: 11, lineHeight: 16, fontWeight: "600", color: colors.muted },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 18, paddingBottom: 18 },
  label: { marginTop: 15, marginBottom: 7, fontSize: 11, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },
  classList: { maxHeight: 184, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  classListContent: { padding: 5 },
  classItem: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 11, borderRadius: 11 },
  classItemSelected: { backgroundColor: colors.surfaceSoft },
  className: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: "800", color: colors.text },
  classNameSelected: { color: colors.primary },
  save: { minHeight: 52, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 15, backgroundColor: colors.primary },
  savePressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  saveText: { color: "white", fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.72 },
});
