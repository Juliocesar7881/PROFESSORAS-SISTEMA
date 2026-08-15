import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { Check, ChevronDown, Download, FileText, RefreshCw, RotateCcw, Search, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { exportWord, request } from "../api";
import { AppTextInput } from "../components/AppTextInput";
import { SelectionSheet } from "../components/SelectionSheet";
import { localDate } from "../date";
import { cacheRecord, cacheRecords, getCachedRecords } from "../offline";
import { useFeedback } from "../providers/FeedbackProvider";
import { colors } from "../theme";
import type { Crianca, OfflineMutation, PendingPhotoUpload, Registro, Turma } from "../types";
import { filterCachedRecords } from "../utils/records";

type Preset = "todos" | "hoje" | "7" | "30" | "personalizado";
type DateTarget = "start" | "end" | null;

function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function longDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function parseDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function RecordsScreen({
  token,
  ownerUserId,
  online,
  turmas,
  criancas,
  pendingPhotos,
  refreshKey,
  onOpen,
  onQueueMutation,
}: {
  token: string;
  ownerUserId: string;
  online: boolean;
  turmas: Turma[];
  criancas: Crianca[];
  pendingPhotos: PendingPhotoUpload[];
  refreshKey: number;
  onOpen: (id: string) => void;
  onQueueMutation: (mutation: OfflineMutation) => Promise<void>;
}) {
  const feedback = useFeedback();
  const [records, setRecords] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [preset, setPreset] = useState<Preset>("todos");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [trash, setTrash] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectionSheet, setSelectionSheet] = useState<"turma" | "crianca" | null>(null);
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const filteredChildren = useMemo(
    () => criancas.filter((child) => !turmaId || child.turmaId === turmaId),
    [criancas, turmaId],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const dates = useMemo(() => {
    if (preset === "todos") return { start: "", end: "" };
    if (preset === "personalizado") return { start, end };
    const now = new Date();
    const from = new Date(now);
    const count = preset === "hoje" ? 0 : Number(preset) - 1;
    from.setDate(from.getDate() - count);
    return { start: localDate(from), end: localDate(now) };
  }, [end, preset, start]);

  const filterCache = useCallback((items: Registro[]) => {
    return filterCachedRecords(items, {
      turmaId,
      alunoId,
      dataInicio: dates.start,
      dataFim: dates.end,
      query: debouncedQuery,
      lixeira: trash,
    });
  }, [alunoId, dates.end, dates.start, debouncedQuery, trash, turmaId]);

  const buildParams = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams({ limit: "30", lixeira: String(trash) });
    if (turmaId) params.set("turmaId", turmaId);
    if (alunoId) params.set("alunoId", alunoId);
    if (dates.start) params.set("dataInicio", dates.start);
    if (dates.end) params.set("dataFim", dates.end);
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (cursor) {
      params.set("cursor", cursor);
      params.set("includeTotal", "false");
    }
    return params;
  }, [alunoId, dates.end, dates.start, debouncedQuery, trash, turmaId]);

  const load = useCallback(async (mode: "initial" | "refresh" | "more" = "initial") => {
    if (mode === "more") setLoadingMore(true);
    else if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    try {
      if (!online) throw new Error("offline");
      const cursor = mode === "more" ? nextCursor : null;
      const payload = await request<{ items: Registro[]; nextCursor: string | null; total: number | null }>(
        token,
        `/api/registros?${buildParams(cursor)}`,
      );
      await cacheRecords(payload.items, ownerUserId);
      setRecords((current) => mode === "more" ? [...current, ...payload.items] : payload.items);
      setNextCursor(payload.nextCursor);
      if (payload.total !== null) setTotal(payload.total);
      if (mode !== "more") {
        setSelected([]);
        setSelectedChild(null);
      }
    } catch (error) {
      const cached = filterCache(await getCachedRecords(ownerUserId));
      setRecords(cached);
      setNextCursor(null);
      setTotal(cached.length);
      if (online && mode !== "more") feedback("Mostrando registros salvos no aparelho.", { tone: "warning" });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [buildParams, feedback, filterCache, nextCursor, online, ownerUserId, token]);

  useEffect(() => {
    void load("initial");
  }, [alunoId, dates.end, dates.start, debouncedQuery, refreshKey, trash, turmaId]);

  const sections = useMemo(() => {
    const map = new Map<string, Registro[]>();
    records.forEach((record) => {
      const key = record.dataRegistro.slice(0, 10);
      map.set(key, [...(map.get(key) || []), record]);
    });
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [records]);

  const toggle = (record: Registro) => {
    if (selectedChild && selectedChild !== record.alunoId) {
      return feedback("Selecione registros da mesma crianca.", { tone: "warning" });
    }
    setSelected((current) => {
      const next = current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id];
      setSelectedChild(next.length ? record.alunoId : null);
      return next;
    });
  };

  const remove = async (record: Registro) => {
    try {
      const deleted = { ...record, deletedAt: new Date().toISOString() };
      if (online) {
        await request(token, `/api/registros/${record.id}`, { method: "DELETE" });
      } else {
        await onQueueMutation({ id: `delete-${record.id}`, type: "delete", recordId: record.id, createdAt: new Date().toISOString() });
      }
      await cacheRecord(deleted, ownerUserId);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setTotal((current) => Math.max(0, current - 1));
      feedback(online ? "Registro movido para a lixeira." : "Alteracao protegida. Sera sincronizada depois.", {
        actionLabel: "Desfazer",
        onAction: async () => {
          if (online) {
            const restored = await request<Registro>(token, `/api/registros/${record.id}/restore`, { method: "POST" });
            await cacheRecord(restored, ownerUserId);
          } else {
            await onQueueMutation({ id: `restore-${record.id}`, type: "restore", recordId: record.id, createdAt: new Date().toISOString() });
            await cacheRecord({ ...record, deletedAt: null }, ownerUserId);
          }
          await load("refresh");
        },
      });
    } catch (error) {
      feedback(error instanceof Error ? error.message : "Falha ao remover.", { tone: "danger" });
    }
  };

  const confirmRemove = (record: Registro) => {
    Alert.alert(
      "Mover registro para a lixeira?",
      `O registro de ${record.aluno.nome} podera ser restaurado durante 30 dias.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Mover para lixeira", style: "destructive", onPress: () => void remove(record) },
      ],
    );
  };

  const restore = async (record: Registro) => {
    try {
      const restored = online
        ? await request<Registro>(token, `/api/registros/${record.id}/restore`, { method: "POST" })
        : { ...record, deletedAt: null };
      if (!online) await onQueueMutation({ id: `restore-${record.id}`, type: "restore", recordId: record.id, createdAt: new Date().toISOString() });
      await cacheRecord(restored, ownerUserId);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      feedback(online ? "Registro restaurado." : "Restauracao sera sincronizada depois.", { tone: online ? "success" : "warning" });
    } catch (error) {
      feedback(error instanceof Error ? error.message : "Falha ao restaurar.", { tone: "danger" });
    }
  };

  const download = async () => {
    if (!online) return feedback("Conecte-se para gerar o arquivo Word.", { tone: "warning" });
    setBusy(true);
    try {
      await exportWord(token, selected.length ? { ids: selected } : {
        filters: {
          ...(turmaId ? { turmaId } : {}),
          ...(alunoId ? { alunoId } : {}),
          ...(dates.start ? { dataInicio: dates.start } : {}),
          ...(dates.end ? { dataFim: dates.end } : {}),
          ...(debouncedQuery ? { q: debouncedQuery } : {}),
        },
      });
      feedback("Word preparado para compartilhar.", { tone: "success" });
    } catch (error) {
      feedback(error instanceof Error ? error.message : "Falha ao exportar.", { tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const selectedTurmaLabel = turmas.find((item) => item.id === turmaId)?.nome || "Todas as turmas";
  const selectedChildLabel = criancas.find((item) => item.id === alunoId)?.nome || "Todas as criancas";
  const datePickerValue = dateTarget === "start" ? start : end;
  const onDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === "android") setDateTarget(null);
    if (!value) return;
    if (dateTarget === "start") setStart(localDate(value));
    if (dateTarget === "end") setEnd(localDate(value));
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.muted} />
          <AppTextInput
            accessibilityLabel="Buscar registros"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar nos registros..."
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            style={styles.searchInput}
          />
          {query ? <Pressable accessibilityLabel="Limpar busca" onPress={() => setQuery("")} style={styles.clearSearch}><X size={17} color={colors.muted} /></Pressable> : null}
        </View>
        <View style={styles.selectorRow}>
          <Pressable onPress={() => setSelectionSheet("turma")} style={styles.filterSelector}>
            <Text numberOfLines={1} style={styles.filterSelectorText}>{selectedTurmaLabel}</Text>
            <ChevronDown size={16} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => setSelectionSheet("crianca")} style={styles.filterSelector}>
            <Text numberOfLines={1} style={styles.filterSelectorText}>{selectedChildLabel}</Text>
            <ChevronDown size={16} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.presets}>
          {([
            { id: "todos", label: "Todas" },
            { id: "hoje", label: "Hoje" },
            { id: "7", label: "7 dias" },
            { id: "30", label: "30 dias" },
            { id: "personalizado", label: "Periodo" },
          ] as Array<{ id: Preset; label: string }>).map((item) => (
            <Pressable key={item.id} onPress={() => setPreset(item.id)} style={[styles.preset, preset === item.id && styles.presetActive]}>
              <Text style={[styles.presetText, preset === item.id && styles.presetTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {preset === "personalizado" ? (
          <View style={styles.dateRow}>
            <Pressable onPress={() => setDateTarget("start")} style={styles.dateButton}><Text style={styles.dateText}>{start ? shortDate(start) : "Data inicial"}</Text></Pressable>
            <Text style={styles.dateDash}>ate</Text>
            <Pressable onPress={() => setDateTarget("end")} style={styles.dateButton}><Text style={styles.dateText}>{end ? shortDate(end) : "Data final"}</Text></Pressable>
          </View>
        ) : null}
        <View style={styles.toolbar}>
          <Text style={styles.resultCount}>{total} registro{total === 1 ? "" : "s"}</Text>
          <Pressable onPress={() => setTrash((value) => !value)} style={[styles.toolbarButton, trash && styles.trashActive]}>
            <Trash2 size={17} color={trash ? "white" : colors.primary} />
            <Text style={[styles.toolbarText, trash && styles.toolbarTextActive]}>{trash ? "Sair da lixeira" : "Lixeira"}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Atualizar" onPress={() => void load("refresh")} style={styles.squareButton}>
            <RefreshCw size={18} color={colors.primary} />
          </Pressable>
          <Pressable accessibilityLabel="Baixar Word" onPress={() => void download()} disabled={busy} style={styles.squareButton}>
            {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Download size={18} color={colors.primary} />}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          {[0, 1, 2].map((item) => <View key={item} style={styles.skeleton} />)}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load("refresh")} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => { if (nextCursor && !loadingMore) void load("more"); }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.more} color={colors.primary} /> : null}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{longDate(section.title)}</Text>
              <Text style={styles.count}>{section.data.length}</Text>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <FileText size={30} color={colors.primaryLight} />
              <Text style={styles.emptyTitle}>{trash ? "A lixeira esta vazia" : "Nenhum registro encontrado"}</Text>
              <Text style={styles.emptyText}>{online ? "Ajuste os filtros ou crie um novo registro." : "Conecte-se para atualizar os registros deste aparelho."}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const checked = selected.includes(item.id);
            const locked = Boolean(selectedChild && selectedChild !== item.alunoId);
            const pendingPhotoCount = pendingPhotos.filter((photo) => photo.recordId === item.id).length;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpen(item.id)}
                style={({ pressed }) => [styles.card, checked && styles.cardSelected, locked && styles.locked, pressed && styles.cardPressed]}
              >
                <View style={styles.cardTop}>
                  {!trash ? (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked, disabled: locked }}
                      disabled={locked}
                      onPress={() => toggle(item)}
                      style={[styles.checkbox, checked && styles.checkboxActive]}
                    >
                      {checked ? <Check size={15} color="white" /> : null}
                    </Pressable>
                  ) : null}
                  <View style={styles.cardMeta}>
                    <Text style={styles.child}>{item.aluno.nome}</Text>
                    <Text style={styles.meta}>{item.aluno.turma.nome} | {shortDate(item.dataRegistro)}</Text>
                  </View>
                </View>
                <Text numberOfLines={5} style={styles.recordText}>{item.texto}</Text>
                {pendingPhotoCount ? (
                  <View style={styles.pendingPhotos}>
                    <RefreshCw size={15} color={colors.warning} />
                    <Text style={styles.pendingPhotosText}>
                      {pendingPhotoCount} foto{pendingPhotoCount === 1 ? " aguardando envio" : "s aguardando envio"}
                    </Text>
                  </View>
                ) : null}
                {item.fotos.length ? (
                  <View style={styles.images}>
                    {item.fotos.slice(0, 3).map((photo, index) => photo.url ? (
                      <View key={photo.id} style={styles.imageWrap}>
                        <Image source={photo.url} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={120} />
                        {index === 2 && item.fotos.length > 3 ? <View style={styles.imageMore}><Text style={styles.imageMoreText}>+{item.fotos.length - 3}</Text></View> : null}
                      </View>
                    ) : null)}
                  </View>
                ) : null}
                <View style={styles.cardActions}>
                  {trash ? (
                    <Pressable onPress={() => void restore(item)} style={styles.action}>
                      <RotateCcw size={17} color={colors.primary} />
                      <Text style={styles.actionText}>Restaurar</Text>
                    </Pressable>
                  ) : (
                    <Pressable accessibilityLabel="Mover para lixeira" onPress={(event) => { event.stopPropagation(); confirmRemove(item); }} style={styles.dangerAction}>
                      <Trash2 size={17} color={colors.danger} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {selected.length && !trash ? (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>{selected.length} selecionado{selected.length === 1 ? "" : "s"}</Text>
            <Text numberOfLines={1} style={styles.selectionSub}>{criancas.find((item) => item.id === selectedChild)?.nome}</Text>
          </View>
          <Pressable onPress={() => void download()} style={styles.selectionButton}>
            <Download size={18} color="white" />
            <Text style={styles.selectionButtonText}>Word</Text>
          </Pressable>
          <Pressable accessibilityLabel="Limpar selecao" onPress={() => { setSelected([]); setSelectedChild(null); }} style={styles.selectionClose}>
            <X size={19} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}

      {dateTarget ? <DateTimePicker value={parseDate(datePickerValue || localDate())} mode="date" display="default" onChange={onDateChange} /> : null}
      <SelectionSheet
        visible={selectionSheet === "turma"}
        title="Filtrar por turma"
        items={[{ id: "", label: "Todas as turmas" }, ...turmas.map((item) => ({ id: item.id, label: item.nome }))]}
        selectedId={turmaId}
        onSelect={(item) => { setTurmaId(item.id); setAlunoId(""); setSelectionSheet(null); }}
        onClose={() => setSelectionSheet(null)}
      />
      <SelectionSheet
        visible={selectionSheet === "crianca"}
        title="Filtrar por crianca"
        items={[{ id: "", label: "Todas as criancas" }, ...filteredChildren.map((item) => ({ id: item.id, label: item.nome, supportingText: item.turma.nome }))]}
        selectedId={alunoId}
        onSelect={(item) => { setAlunoId(item.id); setSelectionSheet(null); }}
        onClose={() => setSelectionSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { padding: 12, paddingBottom: 9, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 8 },
  searchWrap: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  searchInput: { flex: 1, minHeight: 44, paddingHorizontal: 0, borderWidth: 0, backgroundColor: "transparent" },
  clearSearch: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  selectorRow: { flexDirection: "row", gap: 8 },
  filterSelector: { flex: 1, minWidth: 0, minHeight: 42, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  filterSelectorText: { flex: 1, minWidth: 0, fontSize: 12, fontWeight: "800", color: colors.text },
  presets: { flexDirection: "row", gap: 5 },
  preset: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  presetActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  presetText: { fontSize: 10, fontWeight: "800", color: colors.muted },
  presetTextActive: { color: "white" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  dateButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  dateText: { fontSize: 12, color: colors.text, fontWeight: "800" },
  dateDash: { fontSize: 11, color: colors.muted, fontWeight: "700" },
  toolbar: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7 },
  resultCount: { flex: 1, fontSize: 11, color: colors.muted, fontWeight: "800" },
  toolbarButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  toolbarText: { fontSize: 11, fontWeight: "800", color: colors.primary },
  toolbarTextActive: { color: "white" },
  trashActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  squareButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  list: { padding: 12, paddingBottom: 132 },
  sectionHeader: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, backgroundColor: colors.background },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: colors.text, textTransform: "capitalize" },
  count: { fontSize: 11, color: colors.muted },
  card: { marginBottom: 9, padding: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface },
  cardSelected: { borderColor: colors.primary, borderWidth: 2 },
  cardPressed: { opacity: 0.82 },
  locked: { opacity: 0.5 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  checkbox: { width: 26, height: 26, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  checkboxActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  cardMeta: { flex: 1 },
  child: { fontSize: 15, fontWeight: "900", color: colors.text },
  meta: { marginTop: 2, fontSize: 11, color: colors.muted, fontWeight: "600" },
  recordText: { marginTop: 10, fontSize: 14, lineHeight: 21, color: colors.text },
  pendingPhotos: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.amberSoft },
  pendingPhotosText: { flex: 1, fontSize: 11, fontWeight: "800", color: colors.warning },
  images: { height: 84, flexDirection: "row", gap: 7, marginTop: 11 },
  imageWrap: { flex: 1, borderRadius: 8, overflow: "hidden", backgroundColor: colors.surfaceSoft },
  image: { width: "100%", height: "100%" },
  imageMore: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(49,40,52,.55)" },
  imageMoreText: { color: "white", fontSize: 17, fontWeight: "900" },
  cardActions: { minHeight: 36, marginTop: 8, flexDirection: "row", justifyContent: "flex-end" },
  action: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9 },
  actionText: { fontSize: 12, fontWeight: "800", color: colors.primary },
  dangerAction: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  loading: { padding: 12, gap: 10 },
  skeleton: { height: 142, borderRadius: 14, backgroundColor: colors.surfaceSoft },
  more: { marginVertical: 18 },
  empty: { alignItems: "center", paddingHorizontal: 30, paddingTop: 62 },
  emptyTitle: { marginTop: 12, fontSize: 16, color: colors.text, fontWeight: "900" },
  emptyText: { marginTop: 5, textAlign: "center", fontSize: 12, lineHeight: 18, color: colors.muted, fontWeight: "600" },
  selectionBar: { position: "absolute", left: 10, right: 10, bottom: 10, minHeight: 66, flexDirection: "row", alignItems: "center", gap: 9, padding: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 11, backgroundColor: colors.surface, shadowColor: colors.text, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  selectionInfo: { flex: 1, minWidth: 0 },
  selectionTitle: { fontSize: 13, fontWeight: "900", color: colors.text },
  selectionSub: { marginTop: 2, fontSize: 11, color: colors.muted },
  selectionButton: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, borderRadius: 8, backgroundColor: colors.primary },
  selectionButtonText: { color: "white", fontWeight: "900" },
  selectionClose: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
});
