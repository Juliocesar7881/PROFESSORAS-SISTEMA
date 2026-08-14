"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Download,
  FileText,
  Images,
  Loader2,
  Mic,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CopyTextButton } from "@/components/copy-text-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPaginatedPayload, getPayloadItems } from "@/lib/api-payload";
import {
  prepareRecordPhotos,
  type PreparedRecordPhoto,
  uploadRecordPhotos,
} from "@/lib/client/record-photo-upload";
import { cn } from "@/lib/utils";

type Turma = { id: string; nome: string; faixaEtaria?: string | null };
type Crianca = { id: string; nome: string; turmaId: string; contexto?: string | null; turma: { id: string; nome: string } };
type Foto = { id: string; url?: string | null };
type Registro = {
  id: string;
  texto: string;
  alunoId: string;
  dataRegistro: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  aluno: { id: string; nome: string; turmaId: string; turma: { id: string; nome: string } };
  fotos: Foto[];
};
type Relatorio = {
  id: string;
  texto: string;
  periodo: string;
  nomeCrianca?: string | null;
  contexto?: string | null;
  modeloIa?: string | null;
  createdAt: string;
  updatedAt: string;
};
type Tab = "novo" | "visualizar" | "relatorios";
type DatePreset = "todos" | "hoje" | "7" | "30" | "personalizado";
type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; readonly [index: number]: SpeechAlternative };
type SpeechResultList = { length: number; readonly [index: number]: SpeechResult };
type SpeechRecognitionEventLike = Event & { resultIndex: number; results: SpeechResultList };
type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function localDate(value = new Date()) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const today = () => localDate();

function formatDate(value: string) {
  const date = value.slice(0, 10);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    .format(new Date(`${date}T12:00:00Z`));
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function apiError(json: unknown, fallback: string) {
  if (json && typeof json === "object" && "error" in json) {
    const error = (json as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

function modelLabel(model?: string | null) {
  if (!model) return "IA";
  if (model.includes("3.5")) return "Gemini 3.5 Flash";
  if (model.includes("3.1")) return "Gemini 3.1 Flash Lite";
  return "Gemini";
}

function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select {...props} className={cn("pf-select h-11 appearance-none pr-9", props.className)} />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d7484]" />
    </div>
  );
}

export function RegistrosClient() {
  const [tab, setTab] = useState<Tab>("novo");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [novoTurmaId, setNovoTurmaId] = useState("");
  const [novoAlunoId, setNovoAlunoId] = useState("");
  const [texto, setTexto] = useState("");
  const [dataRegistro, setDataRegistro] = useState(today());
  const [fotos, setFotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number; failed: number } | null>(null);
  const [pendingPhotoRetry, setPendingPhotoRetry] = useState<{ recordId: string; photos: PreparedRecordPhoto[] } | null>(null);

  const [filterTurmaId, setFilterTurmaId] = useState("");
  const [filterAlunoId, setFilterAlunoId] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [lixeira, setLixeira] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<Registro | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingChild, setEditingChild] = useState("");
  const [editingFiles, setEditingFiles] = useState<File[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);

  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const browserTranscriptRef = useRef("");
  const recognitionDoneRef = useRef<Promise<void> | null>(null);

  const [periodo, setPeriodo] = useState("Bimestre atual");
  const [generating, setGenerating] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportDraft, setReportDraft] = useState<Relatorio | null>(null);

  const newChildren = useMemo(
    () => criancas.filter((item) => !novoTurmaId || item.turmaId === novoTurmaId),
    [criancas, novoTurmaId],
  );
  const filterChildren = useMemo(
    () => criancas.filter((item) => !filterTurmaId || item.turmaId === filterTurmaId),
    [criancas, filterTurmaId],
  );
  const selectedChild = useMemo(() => criancas.find((item) => item.id === selectedChildId) ?? null, [criancas, selectedChildId]);

  const dateFilters = useMemo(() => {
    if (datePreset === "todos") return { start: "", end: "" };
    if (datePreset === "personalizado") return { start: dataInicio, end: dataFim };
    const now = new Date();
    const start = new Date(now);
    const days = datePreset === "hoje" ? 0 : Number(datePreset) - 1;
    start.setDate(start.getDate() - days);
    return { start: localDate(start), end: localDate(now) };
  }, [dataFim, dataInicio, datePreset]);

  const recordQuery = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams({ limit: "100", lixeira: String(lixeira) });
    if (filterTurmaId) params.set("turmaId", filterTurmaId);
    if (filterAlunoId) params.set("alunoId", filterAlunoId);
    if (dateFilters.start) params.set("dataInicio", dateFilters.start);
    if (dateFilters.end) params.set("dataFim", dateFilters.end);
    if (cursor) params.set("cursor", cursor);
    return params;
  }, [dateFilters.end, dateFilters.start, filterAlunoId, filterTurmaId, lixeira]);

  const loadBase = useCallback(async () => {
    setLoadingBase(true);
    try {
      const [turmaResponse, criancaResponse, reportResponse] = await Promise.all([
        fetch("/api/turmas", { cache: "no-store" }),
        fetch("/api/criancas?limit=100", { cache: "no-store" }),
        fetch("/api/relatorios", { cache: "no-store" }),
      ]);
      const [turmaJson, criancaJson, reportJson] = await Promise.all([
        turmaResponse.json(), criancaResponse.json(), reportResponse.json(),
      ]);
      if (!turmaResponse.ok) throw new Error(apiError(turmaJson, "Falha ao carregar turmas"));
      if (!criancaResponse.ok) throw new Error(apiError(criancaJson, "Falha ao carregar criancas"));
      setTurmas((turmaJson.data ?? []) as Turma[]);
      setCriancas(getPayloadItems<Crianca>(criancaJson.data));
      if (reportResponse.ok) setRelatorios((reportJson.data ?? []) as Relatorio[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar dados");
    } finally {
      setLoadingBase(false);
    }
  }, []);

  const loadRecords = useCallback(async (append = false) => {
    setLoadingRecords(true);
    try {
      const response = await fetch(`/api/registros?${recordQuery(append ? nextCursor : null)}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json, "Falha ao carregar registros"));
      const payload = getPaginatedPayload<Registro>(json.data);
      setRegistros((current) => append ? [...current, ...payload.items] : payload.items);
      setNextCursor(payload.nextCursor);
      setTotal(payload.total ?? payload.items.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar registros");
    } finally {
      setLoadingRecords(false);
    }
  }, [nextCursor, recordQuery]);

  useEffect(() => { void loadBase(); }, [loadBase]);
  useEffect(() => {
    setSelectedIds([]);
    setSelectedChildId(null);
    void loadRecords(false);
  }, [filterTurmaId, filterAlunoId, datePreset, dataInicio, dataFim, lixeira]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setRecordingSeconds((current) => {
        if (current >= 299) {
          recorderRef.current?.stop();
          return 300;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const transcribeBlob = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const mimeType = (blob.type || "audio/webm").split(";", 1)[0].toLowerCase();
      const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
      const body = new FormData();
      body.append("audio", new File([blob], `registro.${extension}`, { type: mimeType }));
      body.append("language", "pt");
      const response = await fetch("/api/registros/transcrever", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json, "Falha ao transcrever audio"));
      const transcription = String(json.data?.text ?? "").trim();
      setTexto((current) => [current.trim(), transcription].filter(Boolean).join(current.trim() ? "\n\n" : ""));
      toast.success("Audio transcrito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao transcrever audio");
    } finally {
      setTranscribing(false);
    }
  };

  const startBrowserTranscription = () => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    browserTranscriptRef.current = "";
    recognitionDoneRef.current = null;
    recognitionRef.current = null;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal && result[0]?.transcript) finalParts.push(result[0].transcript.trim());
      }
      if (finalParts.length) {
        browserTranscriptRef.current = [browserTranscriptRef.current, ...finalParts].filter(Boolean).join(" ");
      }
    };
    recognition.onerror = () => undefined;
    recognitionDoneRef.current = new Promise((resolve) => {
      recognition.onend = resolve;
    });

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      recognition.abort();
      recognitionRef.current = null;
      recognitionDoneRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const preferredMimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      startBrowserTranscription();
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        setTranscribing(true);
        try { recognition?.stop(); } catch { recognition?.abort(); }
        if (recognitionDoneRef.current) {
          await Promise.race([
            recognitionDoneRef.current,
            new Promise<void>((resolve) => window.setTimeout(resolve, 1400)),
          ]);
        }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        const browserText = browserTranscriptRef.current.trim();
        browserTranscriptRef.current = "";
        recognitionDoneRef.current = null;
        if (browserText) {
          setTexto((current) => [current.trim(), browserText].filter(Boolean).join(current.trim() ? "\n\n" : ""));
          setTranscribing(false);
          toast.success("Audio transcrito");
        } else if (blob.size) {
          void transcribeBlob(blob);
        } else {
          setTranscribing(false);
        }
      };
      setRecordingSeconds(0);
      setRecording(true);
      recorder.start(1000);
    } catch {
      toast.error("Permita o uso do microfone para gravar.");
    }
  };

  const stopRecording = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();

  const saveRecord = async () => {
    if (!novoAlunoId || texto.trim().length < 3) {
      toast.error("Selecione a crianca e escreva o registro.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/registros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: novoAlunoId,
          texto: texto.trim(),
          dataRegistro,
          clientMutationId: crypto.randomUUID(),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json, "Falha ao salvar registro"));
      const recordId = String(json.data?.registro?.id ?? "");
      let failedPhotos: PreparedRecordPhoto[] = [];
      if (fotos.length && recordId) {
        try {
          const prepared = await prepareRecordPhotos(fotos);
          setUploadProgress({ completed: 0, total: prepared.length, failed: 0 });
          const upload = await uploadRecordPhotos(recordId, prepared, (completed, totalPhotos, failed) => {
            setUploadProgress({ completed, total: totalPhotos, failed });
          });
          failedPhotos = upload.failed.map(({ clientUploadId, file, order }) => ({ clientUploadId, file, order }));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "As fotos nao puderam ser preparadas.");
        } finally {
          setUploadProgress(null);
        }
      }
      setPendingPhotoRetry(failedPhotos.length ? { recordId, photos: failedPhotos } : null);
      setTexto("");
      setFotos([]);
      setDataRegistro(today());
      if (failedPhotos.length) {
        toast.warning(`Registro salvo. ${failedPhotos.length} foto${failedPhotos.length === 1 ? " aguarda" : "s aguardam"} novo envio.`);
      } else {
        toast.success("Registro e fotos salvos");
      }
      await loadRecords(false);
      setTab("visualizar");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar registro");
    } finally {
      setSaving(false);
    }
  };

  const retryPendingPhotos = async () => {
    if (!pendingPhotoRetry) return;
    setUploadProgress({ completed: 0, total: pendingPhotoRetry.photos.length, failed: 0 });
    try {
      const result = await uploadRecordPhotos(
        pendingPhotoRetry.recordId,
        pendingPhotoRetry.photos,
        (completed, totalPhotos, failed) => setUploadProgress({ completed, total: totalPhotos, failed }),
      );
      const failedPhotos = result.failed.map(({ clientUploadId, file, order }) => ({ clientUploadId, file, order }));
      setPendingPhotoRetry(failedPhotos.length ? { recordId: pendingPhotoRetry.recordId, photos: failedPhotos } : null);
      if (failedPhotos.length) toast.warning(`${failedPhotos.length} foto${failedPhotos.length === 1 ? " ainda aguarda" : "s ainda aguardam"} envio.`);
      else toast.success("Todas as fotos foram enviadas");
      await loadRecords(false);
    } finally {
      setUploadProgress(null);
    }
  };

  const toggleRecord = (registro: Registro) => {
    if (selectedChildId && selectedChildId !== registro.alunoId) return;
    setSelectedIds((current) => {
      const removing = current.includes(registro.id);
      const next = removing ? current.filter((id) => id !== registro.id) : [...current, registro.id];
      setSelectedChildId(next.length ? registro.alunoId : null);
      return next;
    });
  };

  const clearSelection = () => { setSelectedIds([]); setSelectedChildId(null); };

  const exportRecords = async () => {
    try {
      const filters = {
        ...(filterTurmaId ? { turmaId: filterTurmaId } : {}),
        ...(filterAlunoId ? { alunoId: filterAlunoId } : {}),
        ...(dateFilters.start ? { dataInicio: dateFilters.start } : {}),
        ...(dateFilters.end ? { dataFim: dateFilters.end } : {}),
      };
      const response = await fetch("/api/registros/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedIds.length ? { ids: selectedIds, delivery: "url" } : { filters, delivery: "url" }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json, "Falha ao gerar Word"));
      const link = document.createElement("a");
      link.href = String(json.data?.downloadUrl ?? "");
      link.download = String(json.data?.fileName ?? "registros-pedagogicos.docx");
      link.rel = "noreferrer";
      link.click();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar Word");
    }
  };

  const generateReport = async () => {
    if (!selectedIds.length) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/relatorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo: "registros", periodo, registroIds: selectedIds }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json, "Falha ao gerar avaliacao"));
      const created = json.data as Relatorio;
      setRelatorios((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setReportDraft(created);
      setEditingReportId(created.id);
      clearSelection();
      setTab("relatorios");
      toast.success("Avaliacao criada. Revise o texto antes de usar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar avaliacao");
    } finally {
      setGenerating(false);
    }
  };

  const removeRecord = async (id: string) => {
    if (!window.confirm("Mover este registro para a lixeira por 30 dias?")) return;
    const response = await fetch(`/api/registros/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) return toast.error(apiError(json, "Falha ao remover registro"));
    setRegistros((current) => current.filter((item) => item.id !== id));
    toast.success("Registro movido para a lixeira");
  };

  const restoreRecord = async (id: string) => {
    const response = await fetch(`/api/registros/${id}/restore`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) return toast.error(apiError(json, "Falha ao restaurar registro"));
    setRegistros((current) => current.filter((item) => item.id !== id));
    toast.success("Registro restaurado");
  };

  const startRecordEdit = (record: Registro) => {
    setEditingRecord(record);
    setEditingText(record.texto);
    setEditingDate(record.dataRegistro.slice(0, 10));
    setEditingChild(record.alunoId);
    setEditingFiles([]);
    setRemovedPhotoIds([]);
  };

  const saveRecordEdit = async () => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/registros/${editingRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: editingText.trim(),
          dataRegistro: editingDate,
          alunoId: editingChild,
          removeFotoIds: removedPhotoIds,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(apiError(json, "Falha ao atualizar registro"));

      let failedPhotos: PreparedRecordPhoto[] = [];
      if (editingFiles.length) {
        const remainingPhotos = Math.max(0, editingRecord.fotos.length - removedPhotoIds.length);
        const prepared = await prepareRecordPhotos(editingFiles.slice(0, 6 - remainingPhotos), remainingPhotos);
        setUploadProgress({ completed: 0, total: prepared.length, failed: 0 });
        const upload = await uploadRecordPhotos(editingRecord.id, prepared, (completed, totalPhotos, failed) => {
          setUploadProgress({ completed, total: totalPhotos, failed });
        });
        failedPhotos = upload.failed.map(({ clientUploadId, file, order }) => ({ clientUploadId, file, order }));
      }
      setPendingPhotoRetry(failedPhotos.length ? { recordId: editingRecord.id, photos: failedPhotos } : null);
      setEditingRecord(null);
      await loadRecords(false);
      if (failedPhotos.length) toast.warning("Alteracoes salvas; algumas fotos aguardam novo envio.");
      else toast.success("Registro atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar registro");
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  };

  const saveReport = async () => {
    if (!reportDraft || !editingReportId) return;
    const response = await fetch(`/api/relatorios/${editingReportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto: reportDraft.texto,
        nomeCrianca: reportDraft.nomeCrianca || undefined,
        contexto: reportDraft.contexto || undefined,
        periodo: reportDraft.periodo,
      }),
    });
    const json = await response.json();
    if (!response.ok) return toast.error(apiError(json, "Falha ao salvar avaliacao"));
    const updated = json.data as Relatorio;
    setRelatorios((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    setEditingReportId(null);
    setReportDraft(null);
    toast.success("Avaliacao revisada e salva");
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Registro[]>();
    registros.forEach((registro) => {
      const key = registro.dataRegistro.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), registro]);
    });
    return Array.from(map.entries());
  }, [registros]);

  const tabs: Array<{ id: Tab; label: string; shortLabel: string; icon: typeof Plus }> = [
    { id: "novo", label: "Novo registro", shortLabel: "Novo", icon: Plus },
    { id: "visualizar", label: "Visualizar registros", shortLabel: "Registros", icon: FileText },
    { id: "relatorios", label: "Relatorios", shortLabel: "Relatorios", icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-4">
      <div className="grid grid-cols-3 rounded-lg border border-[#e8e3f0] bg-white p-1">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn(
            "flex h-10 min-w-0 items-center justify-center gap-1 rounded-md px-1 text-xs font-bold transition sm:gap-2 sm:px-4 sm:text-sm",
            tab === item.id ? "bg-[#6757c8] text-white shadow-sm" : "text-[#6d6c82] hover:bg-[#f3f0ff]",
          )}>
            <item.icon className="size-4 shrink-0" /><span className="sm:hidden">{item.shortLabel}</span><span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {uploadProgress ? (
        <div className="rounded-lg border border-[#d8c6d1] bg-white p-4" aria-live="polite">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-[#6757c8]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[#17213f]">Enviando fotos</p>
              <p className="mt-1 text-xs font-semibold text-[#6d6c82]">
                {uploadProgress.completed} de {uploadProgress.total} concluidas{uploadProgress.failed ? `, ${uploadProgress.failed} com falha` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8e3f0]">
            <div className="h-full bg-[#6757c8] transition-[width]" style={{ width: `${uploadProgress.total ? (uploadProgress.completed / uploadProgress.total) * 100 : 0}%` }} />
          </div>
        </div>
      ) : pendingPhotoRetry ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <AlertTriangle className="size-5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#4b3920]">O registro foi salvo</p>
            <p className="mt-1 text-xs font-semibold text-[#765d2e]">
              {pendingPhotoRetry.photos.length} foto{pendingPhotoRetry.photos.length === 1 ? " ainda precisa" : "s ainda precisam"} ser enviada. O texto nao foi perdido.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={retryPendingPhotos} className="h-10 border-amber-400 bg-white text-amber-800 hover:bg-amber-100">
            <RotateCcw className="size-4" /> Tentar novamente
          </Button>
        </div>
      ) : null}

      {tab === "novo" && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-[#e8e3f0] bg-white p-4 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><h2 className="font-heading text-xl text-[#17213f]">Registro individual</h2><p className="mt-1 text-sm text-[#6d6c82]">{shortDate(dataRegistro)}</p></div>
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-[#f3f0ff] text-[#6757c8]"><Pencil className="size-5" /></span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="pf-label">Turma</span><FilterSelect value={novoTurmaId} onChange={(event) => { setNovoTurmaId(event.target.value); setNovoAlunoId(""); }}><option value="">Todas as turmas</option>{turmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</FilterSelect></label>
              <label><span className="pf-label">Crianca</span><FilterSelect value={novoAlunoId} onChange={(event) => setNovoAlunoId(event.target.value)} disabled={!criancas.length}><option value="">Selecione a crianca</option>{newChildren.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</FilterSelect></label>
            </div>
            {!loadingBase && (!turmas.length || !criancas.length) ? (
              <a href="/dashboard/turmas" className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-[#dcd3f7] bg-[#f8f6ff] px-3 text-sm font-bold text-[#6757c8]"><Plus className="size-4" /> Cadastrar turma e crianca</a>
            ) : null}
            <label className="mt-4 block"><span className="pf-label">Data do registro</span><input type="date" className="pf-input h-11 max-w-[220px]" value={dataRegistro} onChange={(event) => setDataRegistro(event.target.value)} /></label>
            <label className="mt-4 block"><span className="pf-label">Anotacao pedagogica</span><Textarea value={texto} onChange={(event) => setTexto(event.target.value)} rows={10} className="min-h-[240px] text-[15px] leading-7" placeholder="Escreva o que aconteceu, como a crianca participou e quais estrategias utilizou..." /></label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={recording ? stopRecording : startRecording} disabled={transcribing} className={cn("h-11", recording && "border-red-300 bg-red-50 text-red-700")}>
                {transcribing ? <Loader2 className="size-4 animate-spin" /> : recording ? <Square className="size-4 fill-current" /> : <Mic className="size-4" />}
                {transcribing ? "Transcrevendo" : recording ? `Parar ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}` : "Gravar audio"}
              </Button>
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-[#dcd3f7] bg-white px-4 text-sm font-bold text-[#4f3ca6] hover:bg-[#f8f6ff]">
                <Camera className="size-4" /> Adicionar fotos
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => setFotos(Array.from(event.target.files ?? []).slice(0, 6))} />
              </label>
              {fotos.length ? <span className="inline-flex h-11 items-center gap-2 rounded-md bg-[#f3f0ff] px-3 text-sm font-bold text-[#6757c8]"><Images className="size-4" /> {fotos.length}/6</span> : null}
            </div>
            <div className="mt-5 flex justify-end border-t border-[#e8e3f0] pt-4"><Button type="button" onClick={saveRecord} disabled={saving || transcribing || recording} className="pf-btn-success h-11 px-6">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar registro</Button></div>
          </div>
          <aside className="rounded-lg border border-[#e8e3f0] bg-[#faf9ff] p-5 lg:self-start">
            <h3 className="font-heading text-lg text-[#17213f]">Resumo</h3>
            <div className="mt-4 space-y-2 text-sm font-semibold text-[#6d6c82]">
              <p className="flex items-center justify-between rounded-md bg-white px-3 py-3"><span>Data</span><strong className="text-[#17213f]">{shortDate(dataRegistro)}</strong></p>
              <p className="flex items-center justify-between rounded-md bg-white px-3 py-3"><span>Crianca</span><strong className="max-w-[150px] truncate text-[#17213f]">{criancas.find((item) => item.id === novoAlunoId)?.nome || "-"}</strong></p>
              <p className="flex items-center justify-between rounded-md bg-white px-3 py-3"><span>Fotos</span><strong className="text-[#17213f]">{fotos.length}</strong></p>
            </div>
          </aside>
        </section>
      )}

      {tab === "visualizar" && (
        <section className="space-y-4">
          <div className="rounded-lg border border-[#e8e3f0] bg-white p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr_auto]">
              <FilterSelect aria-label="Filtrar turma" value={filterTurmaId} onChange={(event) => { setFilterTurmaId(event.target.value); setFilterAlunoId(""); }}><option value="">Todas as turmas</option>{turmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</FilterSelect>
              <FilterSelect aria-label="Filtrar crianca" value={filterAlunoId} onChange={(event) => setFilterAlunoId(event.target.value)}><option value="">Todas as criancas</option>{filterChildren.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</FilterSelect>
              <FilterSelect aria-label="Filtrar data" value={datePreset} onChange={(event) => setDatePreset(event.target.value as DatePreset)}><option value="todos">Todas as datas</option><option value="hoje">Hoje</option><option value="7">Ultimos 7 dias</option><option value="30">Ultimos 30 dias</option><option value="personalizado">Intervalo personalizado</option></FilterSelect>
              <Button type="button" variant={lixeira ? "default" : "outline"} onClick={() => setLixeira((value) => !value)} className="h-11"><Trash2 className="size-4" /> {lixeira ? "Sair da lixeira" : "Lixeira"}</Button>
            </div>
            {datePreset === "personalizado" ? <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2"><label><span className="pf-label">De</span><input type="date" className="pf-input h-11" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} /></label><label><span className="pf-label">Ate</span><input type="date" className="pf-input h-11" value={dataFim} onChange={(event) => setDataFim(event.target.value)} /></label></div> : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f1e7ec] pt-3 text-sm text-[#6d6c82]"><span><strong className="text-[#17213f]">{total}</strong> registros</span><Button type="button" variant="outline" onClick={exportRecords} className="h-9"><FileText className="size-4" /> Baixar Word</Button></div>
          </div>

          {loadingRecords && !registros.length ? <div className="flex min-h-48 items-center justify-center rounded-lg border border-[#e8e3f0] bg-white"><Loader2 className="size-6 animate-spin text-[#6757c8]" /></div> : null}
          {!loadingRecords && !registros.length ? <div className="rounded-lg border border-dashed border-[#dfccd7] bg-white py-16 text-center text-sm font-semibold text-[#6d6c82]">Nenhum registro encontrado.</div> : null}
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-2">
              <div className="sticky top-[72px] z-10 flex items-center gap-2 bg-[#fbfaf8]/95 py-2 backdrop-blur"><CalendarDays className="size-4 text-[#6757c8]" /><h3 className="text-sm font-black capitalize text-[#17213f]">{formatDate(date)}</h3><span className="text-xs text-[#8c899b]">{items.length}</span></div>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((record) => {
                  const selected = selectedIds.includes(record.id);
                  const locked = Boolean(selectedChildId && selectedChildId !== record.alunoId);
                  return <article key={record.id} className={cn("rounded-lg border bg-white p-4 transition", selected ? "border-[#6757c8] ring-2 ring-[#f3dce6]" : "border-[#e8e3f0]", locked && "opacity-55")}>
                    <div className="flex items-start gap-3">
                      {!lixeira ? <button type="button" disabled={locked} onClick={() => toggleRecord(record)} className={cn("mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded border", selected ? "border-[#6757c8] bg-[#6757c8] text-white" : "border-[#d8c6d1] bg-white text-transparent", locked && "cursor-not-allowed")} aria-label={selected ? "Desmarcar registro" : "Selecionar registro"}><Check className="size-4" /></button> : null}
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#17213f]">{record.aluno.nome}</strong><span className="rounded-full bg-[#f3f0ff] px-2 py-0.5 text-[10px] font-bold text-[#6757c8]">{record.aluno.turma.nome}</span><span className="text-xs text-[#8c899b]">{shortDate(record.dataRegistro)}</span></div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6d6c82]">{record.texto}</p></div>
                    </div>
                    {record.fotos.length ? <div className="mt-3 grid grid-cols-3 gap-2">{record.fotos.map((foto) => foto.url ? <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer" className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#f5edf1]"><Image src={foto.url} alt="Foto do registro" fill unoptimized sizes="(max-width: 1024px) 33vw, 180px" className="object-cover" /></a> : null)}</div> : null}
                    <div className="mt-3 flex justify-end gap-2 border-t border-[#f4eaef] pt-3">{lixeira ? <Button type="button" variant="outline" className="h-9" onClick={() => restoreRecord(record.id)}><RotateCcw className="size-4" /> Restaurar</Button> : <><Button type="button" variant="ghost" className="h-9" onClick={() => startRecordEdit(record)}><Pencil className="size-4" /> Editar</Button><Button type="button" variant="ghost" className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => removeRecord(record.id)}><Trash2 className="size-4" /></Button></>}</div>
                  </article>;
                })}
              </div>
            </div>
          ))}
          {nextCursor ? <div className="flex justify-center"><Button type="button" variant="outline" disabled={loadingRecords} onClick={() => loadRecords(true)}>{loadingRecords ? <Loader2 className="size-4 animate-spin" /> : null} Carregar mais</Button></div> : null}
        </section>
      )}

      {tab === "relatorios" && (
        <section className="space-y-3">
          {!relatorios.length ? <div className="rounded-lg border border-dashed border-[#dfccd7] bg-white py-16 text-center text-sm font-semibold text-[#6d6c82]">Nenhuma avaliacao gerada.</div> : null}
          {relatorios.map((report) => {
            const editing = editingReportId === report.id && reportDraft;
            return <article key={report.id} className="rounded-lg border border-[#e8e3f0] bg-white p-4 md:p-5">
              {editing ? <div className="space-y-3"><div className="grid gap-3 md:grid-cols-3"><label><span className="pf-label">Crianca</span><input className="pf-input h-10" value={reportDraft.nomeCrianca ?? ""} onChange={(event) => setReportDraft({ ...reportDraft, nomeCrianca: event.target.value })} /></label><label><span className="pf-label">Periodo</span><input className="pf-input h-10" value={reportDraft.periodo} onChange={(event) => setReportDraft({ ...reportDraft, periodo: event.target.value })} /></label><label><span className="pf-label">Contexto</span><input className="pf-input h-10" value={reportDraft.contexto ?? ""} onChange={(event) => setReportDraft({ ...reportDraft, contexto: event.target.value })} /></label></div><label><span className="pf-label">Avaliacao</span><Textarea className="min-h-[340px] text-[15px] leading-7" value={reportDraft.texto} onChange={(event) => setReportDraft({ ...reportDraft, texto: event.target.value })} /></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setEditingReportId(null); setReportDraft(null); }}><X className="size-4" /> Cancelar</Button><Button onClick={saveReport}><Save className="size-4" /> Salvar revisao</Button></div></div> : <><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-lg text-[#17213f]">{report.nomeCrianca || "Crianca"}</h3><span className="rounded-full bg-[#f3f0ff] px-2 py-0.5 text-[10px] font-bold text-[#6757c8]">{modelLabel(report.modeloIa)}</span></div><p className="mt-1 text-xs text-[#6d6c82]">{[report.contexto, report.periodo, shortDate(report.createdAt)].filter(Boolean).join(" | ")}</p></div><Button type="button" variant="outline" className="h-9" onClick={() => { setEditingReportId(report.id); setReportDraft({ ...report }); }}><Pencil className="size-4" /> Editar</Button></div><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#6d6c82]">{report.texto}</p><div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e3f0] pt-3"><CopyTextButton text={report.texto} label="Copiar" /><a className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dcd3f7] px-3 text-xs font-bold text-[#6757c8]" href={`/api/relatorios/${report.id}/export?format=docx`}><FileText className="size-4" /> Word</a><a className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dcd3f7] px-3 text-xs font-bold text-[#6757c8]" href={`/api/relatorios/${report.id}/export?format=pdf`}><Download className="size-4" /> PDF</a></div></>}
            </article>;
          })}
        </section>
      )}

      {selectedIds.length > 0 && tab === "visualizar" ? <div className="fixed bottom-[76px] left-3 right-3 z-30 mx-auto max-w-3xl rounded-lg border border-[#cfa9bb] bg-white p-3 shadow-[0_20px_60px_-20px_rgba(70,38,58,.45)] md:bottom-5 md:left-[316px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-black text-[#17213f]">{selectedIds.length} registro(s) de {selectedChild?.nome}</p><input value={periodo} onChange={(event) => setPeriodo(event.target.value)} className="mt-1 h-8 w-full max-w-[260px] rounded-md border border-[#dcd3f7] px-2 text-xs" aria-label="Periodo da avaliacao" /></div><div className="flex flex-wrap gap-2"><Button type="button" onClick={generateReport} disabled={generating}>{generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Gerar avaliacao com IA</Button><Button type="button" variant="outline" onClick={exportRecords}><FileText className="size-4" /> Word</Button><Button type="button" variant="ghost" onClick={clearSelection}><X className="size-4" /> Limpar</Button></div></div>
      </div> : null}

      {editingRecord ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17213f]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between"><h2 className="font-heading text-xl text-[#17213f]">Editar registro</h2><button type="button" onClick={() => setEditingRecord(null)} className="inline-flex size-9 items-center justify-center rounded-md border border-[#e8e3f0]"><X className="size-4" /></button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="pf-label">Crianca</span><FilterSelect value={editingChild} onChange={(event) => setEditingChild(event.target.value)}>{criancas.map((item) => <option key={item.id} value={item.id}>{item.nome} - {item.turma.nome}</option>)}</FilterSelect></label><label><span className="pf-label">Data</span><input type="date" className="pf-input h-11" value={editingDate} onChange={(event) => setEditingDate(event.target.value)} /></label></div>
        <label className="mt-3 block"><span className="pf-label">Anotacao</span><Textarea className="min-h-[220px]" value={editingText} onChange={(event) => setEditingText(event.target.value)} /></label>
        {editingRecord.fotos.length ? <div className="mt-3 grid grid-cols-3 gap-2">{editingRecord.fotos.map((foto) => foto.url ? <button type="button" key={foto.id} onClick={() => setRemovedPhotoIds((current) => current.includes(foto.id) ? current.filter((id) => id !== foto.id) : [...current, foto.id])} className={cn("relative aspect-[4/3] overflow-hidden rounded-md", removedPhotoIds.includes(foto.id) && "opacity-35 ring-2 ring-red-500")}><Image src={foto.url} alt="Foto anexada" fill unoptimized sizes="(max-width: 640px) 33vw, 200px" className="object-cover" />{removedPhotoIds.includes(foto.id) ? <span className="absolute inset-0 z-10 grid place-items-center text-xs font-black text-red-700">Remover</span> : null}</button> : null)}</div> : null}
        <label className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#dcd3f7] px-3 text-sm font-bold text-[#6757c8]"><Camera className="size-4" /> Novas fotos<input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setEditingFiles(Array.from(event.target.files ?? []))} /></label>
        <div className="mt-5 flex justify-end gap-2 border-t border-[#e8e3f0] pt-4"><Button variant="outline" onClick={() => setEditingRecord(null)}>Cancelar</Button><Button onClick={saveRecordEdit}><Save className="size-4" /> Salvar</Button></div>
      </div></div> : null}
    </div>
  );
}
