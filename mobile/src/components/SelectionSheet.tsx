import { Check, Plus, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme";
import { AppBottomSheet } from "./AppBottomSheet";
import { AppKeyboardToolbar } from "./AppKeyboardToolbar";
import { AppTextInput } from "./AppTextInput";

type SelectionItem = { id: string; label: string; supportingText?: string };

export function SelectionSheet({
  visible,
  title,
  items,
  selectedId,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  actionLabel,
  actionHint,
  actionDisabled = false,
  onAction,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: SelectionItem[];
  selectedId?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actionLabel?: string;
  actionHint?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onSelect: (item: SelectionItem) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return items;
    return items.filter((item) => `${item.label} ${item.supportingText || ""}`.toLocaleLowerCase("pt-BR").includes(normalized));
  }, [items, query]);

  const close = () => {
    Keyboard.dismiss();
    setQuery("");
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={close}
      accessibilityLabel="Fechar seletor"
      contentStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={5} onPress={close} style={styles.close}>
              <X size={21} color={colors.text} />
            </Pressable>
          </View>
          {items.length > 7 ? (
            <View style={styles.searchWrap}>
              <Search size={18} color={colors.muted} />
              <AppTextInput
                accessibilityLabel={searchPlaceholder}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                style={styles.searchInput}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          ) : null}
          {actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: actionDisabled }}
              disabled={actionDisabled}
              onPress={() => {
                Keyboard.dismiss();
                setQuery("");
                onAction();
              }}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.actionPressed,
                actionDisabled && styles.actionDisabled,
              ]}
            >
              <View style={styles.actionIcon}><Plus size={19} color={colors.primary} /></View>
              <View style={styles.itemText}>
                <Text style={styles.actionLabel}>{actionLabel}</Text>
                {actionHint ? <Text style={styles.actionHint}>{actionHint}</Text> : null}
              </View>
            </Pressable>
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    setQuery("");
                    onSelect(item);
                  }}
                  style={({ pressed }) => [styles.item, selected && styles.itemSelected, pressed && styles.pressed]}
                >
                  <View style={styles.itemText}>
                    <Text style={[styles.itemLabel, selected && styles.itemLabelSelected]}>{item.label}</Text>
                    {item.supportingText ? <Text style={styles.supporting}>{item.supportingText}</Text> : null}
                  </View>
                  {selected ? <Check size={19} color={colors.primary} /> : null}
                </Pressable>
              );
            }}
          />
      <AppKeyboardToolbar />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: "82%", backgroundColor: colors.surface },
  handle: { width: 38, height: 4, alignSelf: "center", marginTop: 9, borderRadius: 2, backgroundColor: colors.borderStrong },
  header: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  title: { fontSize: 20, fontWeight: "900", color: colors.text },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  searchWrap: { minHeight: 50, marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  searchInput: { flex: 1, minHeight: 46, paddingHorizontal: 0, borderWidth: 0, backgroundColor: "transparent" },
  action: { minHeight: 64, marginHorizontal: 12, marginTop: 6, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 15, backgroundColor: colors.surfaceSoft },
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  actionDisabled: { opacity: 0.5 },
  actionIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.surface },
  actionLabel: { fontSize: 14, fontWeight: "900", color: colors.primary },
  actionHint: { marginTop: 2, fontSize: 11, lineHeight: 15, fontWeight: "600", color: colors.muted },
  list: { padding: 12, paddingBottom: 20 },
  item: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  itemSelected: { backgroundColor: colors.surfaceSoft },
  itemText: { flex: 1, minWidth: 0 },
  itemLabel: { fontSize: 14, fontWeight: "800", color: colors.text },
  itemLabelSelected: { color: colors.primary },
  supporting: { marginTop: 2, fontSize: 11, color: colors.muted, fontWeight: "600" },
  empty: { padding: 30, textAlign: "center", color: colors.muted, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
