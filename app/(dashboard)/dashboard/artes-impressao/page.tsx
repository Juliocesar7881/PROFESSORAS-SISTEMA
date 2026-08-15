"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Printer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import { cn } from "@/lib/utils";

type Preset = "one" | "two" | "four" | "grid" | "story-two" | "story-three" | "story-four" | "story-column";

type UploadedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  createdAt: string;
  relato: string;
};

type PresetOption = {
  value: Preset;
  label: string;
  description: string;
  columns: number;
  rows: number;
  narrative?: boolean;
  alternating?: boolean;
};

const MAX_SELECTED_PHOTOS = 40;
const MAX_TEMP_UPLOADS = 40;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const presetOptions: PresetOption[] = [
  { value: "story-three", label: "3 relatos", description: "Alternado", columns: 2, rows: 3, narrative: true, alternating: true },
  { value: "story-two", label: "2 relatos", description: "Amplo", columns: 2, rows: 2, narrative: true, alternating: true },
  { value: "story-four", label: "4 relatos", description: "Compacto", columns: 2, rows: 4, narrative: true, alternating: true },
  { value: "story-column", label: "3 relatos", description: "Fotos à esquerda", columns: 2, rows: 3, narrative: true },
  { value: "one", label: "1 foto", description: "Página inteira", columns: 1, rows: 1 },
  { value: "two", label: "2 fotos", description: "Vertical", columns: 1, rows: 2 },
  { value: "four", label: "4 fotos", description: "Grade 2 x 2", columns: 2, rows: 2 },
  { value: "grid", label: "12 fotos", description: "Grade 3 x 4", columns: 3, rows: 4 },
];

function makeUploadId() {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseFileName(disposition: string | null) {
  const fallback = `impressao-facil-${new Date().toISOString().slice(0, 10)}.pdf`;
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

function PresetMiniature({ option }: { option: PresetOption }) {
  if (option.narrative) {
    return (
      <span
        className="grid h-11 w-9 shrink-0 gap-0.5 rounded border border-[#dcd3f7] bg-white p-1"
        style={{ gridTemplateRows: `repeat(${option.rows}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {Array.from({ length: option.rows }, (_, index) => {
          const imageFirst = !option.alternating || index % 2 === 0;
          return (
            <span key={index} className="grid min-h-0 grid-cols-2 gap-0.5">
              <span className={cn("rounded-[1px] bg-[#d9a9bd]", !imageFirst && "order-2")} />
              <span className={cn("space-y-0.5 py-0.5", !imageFirst && "order-1")}>
                <span className="block h-px bg-[#8b7883]" />
                <span className="block h-px bg-[#c8b8c1]" />
              </span>
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span
      className="grid h-11 w-9 shrink-0 gap-0.5 rounded border border-[#dcd3f7] bg-white p-1"
      style={{
        gridTemplateColumns: `repeat(${option.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${option.rows}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: option.columns * option.rows }, (_, index) => (
        <span key={index} className="rounded-[1px] bg-[#d9a9bd]" />
      ))}
    </span>
  );
}

function PreviewImageSlot({
  photo,
  slotNumber,
  onFile,
  controls,
  fit = "cover",
  className,
}: {
  photo?: UploadedPhoto;
  slotNumber: number;
  onFile: (file: File | undefined) => void;
  controls?: ReactNode;
  fit?: "cover" | "contain";
  className?: string;
}) {
  if (!photo) {
    return (
      <label
        data-preview-image-slot="empty"
        className={cn(
          "group flex h-full min-h-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#b9a9f2] bg-[linear-gradient(145deg,#fcfbff_0%,#f3efff_100%)] p-2 text-center transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#7f6bd4] hover:bg-[#eee9ff] hover:shadow-[0_16px_30px_-24px_rgba(67,49,140,0.5)] focus-within:border-[#6757c8] focus-within:ring-4 focus-within:ring-[#6757c8]/15",
          className,
        )}
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#ddd4f7] bg-white text-[#6757c8] shadow-sm transition-transform duration-200 group-hover:scale-105">
          <ImagePlus className="size-4" />
        </span>
        <span className="mt-2 text-[9px] font-black text-[#4f3ca6] sm:text-xs">Adicionar imagem</span>
        <span className="mt-0.5 hidden text-[8px] font-semibold text-[#8c899b] sm:block sm:text-[10px]">Espaco {slotNumber}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={`Adicionar imagem no espaco ${slotNumber}`}
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
    );
  }

  return (
    <div
      data-preview-image-slot="filled"
      className={cn(
        "group relative min-h-0 overflow-hidden rounded-xl border border-[#e8e3f0] bg-[#f6f3fb] shadow-[0_12px_26px_-24px_rgba(43,35,91,0.35)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#b9a9f2] hover:shadow-[0_20px_34px_-24px_rgba(43,35,91,0.42)]",
        className,
      )}
    >
      <label className="absolute inset-0 z-0 cursor-pointer" aria-label={`Trocar imagem do espaco ${slotNumber}`}>
        <Image
          src={photo.previewUrl}
          alt={photo.file.name}
          fill
          unoptimized
          sizes="420px"
          className={cn("transition-transform duration-300 group-hover:scale-[1.015]", fit === "cover" ? "object-cover" : "object-contain")}
        />
        <span className="absolute inset-x-2 bottom-2 inline-flex min-h-7 items-center justify-center gap-1.5 rounded-lg border border-white/80 bg-white/94 px-2 text-[8px] font-black text-[#6757c8] opacity-100 shadow-sm backdrop-blur-sm transition-[transform,background-color] duration-200 group-hover:-translate-y-0.5 group-hover:bg-white sm:text-[10px]">
          <ImagePlus className="size-3" /> Trocar imagem
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {controls ? <div className="absolute right-1.5 top-1.5 z-10 flex max-w-[calc(100%_-_12px)] flex-wrap justify-end gap-1">{controls}</div> : null}
    </div>
  );
}

export default function ArtesImpressaoPage() {
  const objectUrlsRef = useRef<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset>("story-three");
  const [titulo, setTitulo] = useState("Registro pedagógico");
  const [legenda, setLegenda] = useState("");
  const [nomeEscola, setNomeEscola] = useState("");
  const [nomeProfessora, setNomeProfessora] = useState("");
  const [previewPage, setPreviewPage] = useState(0);
  const [exportMode, setExportMode] = useState<"download" | "print" | null>(null);

  const activePreset = useMemo(
    () => presetOptions.find((item) => item.value === preset) ?? presetOptions[0],
    [preset],
  );
  const narrativePreset = Boolean(activePreset.narrative);
  const uploadedById = useMemo(() => new Map(uploadedPhotos.map((photo) => [photo.id, photo])), [uploadedPhotos]);
  const selectedPhotos = useMemo(
    () => selectedIds.map((id) => uploadedById.get(id)).filter((item): item is UploadedPhoto => Boolean(item)),
    [selectedIds, uploadedById],
  );
  const pageSize = narrativePreset ? activePreset.rows : activePreset.columns * activePreset.rows;
  const pageCount = Math.max(1, Math.ceil(selectedPhotos.length / pageSize));
  const safePreviewPage = Math.min(previewPage, pageCount - 1);
  const pagePhotos = selectedPhotos.slice(safePreviewPage * pageSize, (safePreviewPage + 1) * pageSize);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleUploadChange = (files: FileList | null) => {
    if (!files?.length) return;

    const availableSlots = Math.min(MAX_TEMP_UPLOADS - uploadedPhotos.length, MAX_SELECTED_PHOTOS - selectedIds.length);
    if (availableSlots <= 0) return toast.error("Limite de fotos atingido para este PDF");

    const selectedFiles = Array.from(files)
      .filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase()))
      .slice(0, availableSlots);
    if (!selectedFiles.length) return toast.error("Escolha imagens em JPG, PNG ou WEBP");
    if (selectedFiles.length < files.length) toast.warning(`Foram adicionadas ${selectedFiles.length} foto(s).`);

    const newUploads = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);
      return { id: makeUploadId(), file, previewUrl, createdAt: new Date().toISOString(), relato: "" };
    });

    setUploadedPhotos((current) => [...current, ...newUploads]);
    setSelectedIds((current) => [...current, ...newUploads.map((upload) => upload.id)]);
  };

  const addPhotoFromPreview = (file: File | undefined) => {
    if (!file) return;
    if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      toast.error("Use uma imagem JPG, PNG ou WEBP");
      return;
    }
    if (uploadedPhotos.length >= MAX_TEMP_UPLOADS || selectedIds.length >= MAX_SELECTED_PHOTOS) {
      toast.error("Limite de fotos atingido para este PDF");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(previewUrl);
    const upload = {
      id: makeUploadId(),
      file,
      previewUrl,
      createdAt: new Date().toISOString(),
      relato: "",
    };
    setUploadedPhotos((current) => [...current, upload]);
    setSelectedIds((current) => [...current, upload.id]);
  };

  const togglePhoto = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const removePhoto = (id: string) => {
    const photo = uploadedById.get(id);
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
      objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== photo.previewUrl);
    }
    setUploadedPhotos((current) => current.filter((item) => item.id !== id));
    setSelectedIds((current) => current.filter((item) => item !== id));
  };

  const moveSelectedItem = (index: number, direction: -1 | 1) => {
    setSelectedIds((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const replacePhotoFile = (id: string, file: File | null | undefined) => {
    if (!file) return;
    if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      toast.error("Use uma imagem JPG, PNG ou WEBP");
      return;
    }

    const previous = uploadedById.get(id);
    if (!previous) return;

    const previewUrl = URL.createObjectURL(file);
    URL.revokeObjectURL(previous.previewUrl);
    objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== previous.previewUrl);
    objectUrlsRef.current.push(previewUrl);
    setUploadedPhotos((current) => current.map((photo) => (
      photo.id === id ? { ...photo, file, previewUrl } : photo
    )));
  };

  const updatePhoto = (id: string, patch: Pick<UploadedPhoto, "relato">) => {
    setUploadedPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)));
  };

  const clearSelection = () => {
    uploadedPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    objectUrlsRef.current = [];
    setUploadedPhotos([]);
    setSelectedIds([]);
    setPreviewPage(0);
  };

  const selectPreset = (value: Preset) => {
    setPreset(value);
    setPreviewPage(0);
  };

  const exportPdf = async (mode: "download" | "print") => {
    if (!selectedPhotos.length) return toast.error("Envie pelo menos uma foto");
    setExportMode(mode);

    try {
      const formData = new FormData();
      formData.append("preset", preset);
      formData.append("items", JSON.stringify(selectedPhotos.map((photo) => ({ type: "upload", id: photo.id }))));
      formData.append("uploadMeta", JSON.stringify(selectedPhotos.map((photo) => ({ id: photo.id, createdAt: photo.createdAt, relato: photo.relato }))));
      formData.append("titulo", titulo.trim());
      formData.append("legenda", legenda.trim());
      formData.append("nomeEscola", nomeEscola.trim());
      formData.append("nomeProfessora", nomeProfessora.trim());
      formData.append("includeAlunoName", "false");
      formData.append("includeTurmaName", "false");
      formData.append("includeDate", "false");

      for (const photo of selectedPhotos) {
        formData.append("uploadIds", photo.id);
        formData.append("uploads", photo.file);
      }

      const response = await fetch("/api/artes-impressao/export", { method: "POST", body: formData });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Falha ao gerar PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const fileName = parseFileName(response.headers.get("content-disposition"));

      if (mode === "download") {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        toast.success("PDF baixado");
      } else {
        const opened = window.open(url, "_blank");
        if (!opened) {
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = fileName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
          toast.warning("A nova aba foi bloqueada. O PDF foi baixado.");
        } else {
          opened.opener = null;
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          toast.success("PDF aberto para impressão");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar PDF");
    } finally {
      setExportMode(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-4">
      <DashboardFilterBar
        title="Impressão fácil"
        summary={`${selectedPhotos.length} foto${selectedPhotos.length !== 1 ? "s" : ""} no material`}
        controlsClassName="lg:flex-wrap"
      >
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#a995ec] bg-white px-4 text-sm font-black text-[#6757c8] transition hover:bg-[#f3f0ff]">
          <ImagePlus className="size-4" />
          Enviar imagens
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(event) => {
              handleUploadChange(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button type="button" onClick={() => void exportPdf("download")} disabled={!selectedPhotos.length || exportMode !== null} className="pf-btn-primary h-11 px-4">
          {exportMode === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Baixar PDF
        </button>
        <button type="button" onClick={() => void exportPdf("print")} disabled={!selectedPhotos.length || exportMode !== null} className="pf-btn-success h-11 px-4">
          {exportMode === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
          Imprimir
        </button>
      </DashboardFilterBar>

      <div className="grid gap-4 xl:grid-cols-[310px_minmax(0,1fr)] xl:items-start">
        <aside className="order-2 space-y-3 xl:order-1 xl:sticky xl:top-24">
          <section className="overflow-hidden rounded-lg border border-[#e8e3f0] bg-white">
            <header className="border-b border-[#e8e3f0] px-4 py-3">
              <h2 className="font-heading text-lg text-[#17213f]">Fotos</h2>
              <p className="mt-0.5 text-xs font-bold text-[#6d6c82]">{selectedPhotos.length} de {uploadedPhotos.length} selecionadas</p>
            </header>
            <div className="p-3">
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#a995ec] bg-[#fbfaf8] p-4 text-center transition hover:bg-[#f3f0ff]">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[#ebe6fb] text-[#6757c8]"><ImagePlus className="size-5" /></span>
                <span className="text-sm font-black text-[#493b44]">Adicionar imagens</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    handleUploadChange(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              {uploadedPhotos.length ? (
                <div className="mt-3 grid max-h-[560px] grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-hide">
                  {uploadedPhotos.map((photo) => {
                    const selected = selectedIds.includes(photo.id);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => togglePhoto(photo.id)}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border-2 bg-[#fbfaf8] text-left transition",
                          selected ? "border-[#6757c8] ring-2 ring-[#ebe6fb]" : "border-[#e8e3f0] hover:border-[#a995ec]",
                        )}
                      >
                        <span className="relative block aspect-square overflow-hidden bg-[#f4f1fb]">
                          <Image src={photo.previewUrl} alt={photo.file.name} fill unoptimized sizes="140px" className="object-cover" />
                          {selected ? <span className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-[#6757c8] text-white"><Check className="size-3.5" /></span> : null}
                        </span>
                        <span className="block truncate px-2 py-1.5 text-[11px] font-bold text-[#6d6c82]">{photo.file.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-[#dcd3f7] px-3 py-8 text-center text-xs font-bold text-[#8c899b]">Nenhuma foto</div>
              )}

              {uploadedPhotos.length ? (
                <button type="button" onClick={clearSelection} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 text-sm font-black text-rose-600 transition hover:bg-rose-100">
                  <Trash2 className="size-4" /> Limpar material
                </button>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="order-1 min-w-0 overflow-hidden rounded-lg border border-[#e8e3f0] bg-[#faf7f9] xl:order-2">
          <header className="border-b border-[#e8e3f0] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-heading text-xl text-[#17213f]"><LayoutTemplate className="size-5 text-[#6757c8]" /> Pré-visualização</h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#6d6c82]">
                  Página {safePreviewPage + 1} de {pageCount}. Clique nos espaços da folha para adicionar ou trocar imagens.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-8">
              {presetOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectPreset(option.value)}
                  className={cn(
                    "flex min-h-16 items-center gap-2 rounded-lg border-2 bg-white p-2 text-left transition hover:border-[#a995ec]",
                    preset === option.value ? "border-[#6757c8] bg-[#f8f6ff] shadow-sm" : "border-[#e8e3f0]",
                  )}
                >
                  <PresetMiniature option={option} />
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-[#493b44]">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-[#8c899b]">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </header>

          <div className="p-3 sm:p-5 lg:p-8">
            <div className="mx-auto flex max-w-[820px] items-center justify-between gap-3 pb-3">
              <button type="button" onClick={() => setPreviewPage(Math.max(0, safePreviewPage - 1))} disabled={safePreviewPage === 0} className="inline-flex size-10 items-center justify-center rounded-lg border border-[#dcd3f7] bg-white text-[#6757c8] disabled:opacity-30" title="Página anterior" aria-label="Página anterior"><ChevronLeft className="size-5" /></button>
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#6d6c82]">Folha A4</span>
              <button type="button" onClick={() => setPreviewPage(Math.min(pageCount - 1, safePreviewPage + 1))} disabled={safePreviewPage >= pageCount - 1} className="inline-flex size-10 items-center justify-center rounded-lg border border-[#dcd3f7] bg-white text-[#6757c8] disabled:opacity-30" title="Próxima página" aria-label="Próxima página"><ChevronRight className="size-5" /></button>
            </div>

            <div className="mx-auto aspect-[210/297] w-full max-w-[820px] overflow-hidden bg-white p-[4.5%] shadow-[0_24px_70px_-32px_rgba(68,43,58,0.38)] ring-1 ring-[#e8e3f0] transition-[box-shadow,ring-color] duration-300 hover:shadow-[0_30px_82px_-34px_rgba(68,43,58,0.46)]">
              <div className="flex h-full min-h-0 flex-col">
                <header className="shrink-0 border-b border-[#dcd3f7] pb-3 text-center">
                  <input
                    value={titulo}
                    onChange={(event) => setTitulo(event.target.value)}
                    maxLength={90}
                    aria-label="Título do material"
                    placeholder="Título do material"
                    className="w-full border-0 bg-transparent text-center font-heading text-lg text-[#17213f] outline-none placeholder:text-[#b9abb4] focus:bg-[#f8f6ff] sm:text-2xl"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={nomeEscola} onChange={(event) => setNomeEscola(event.target.value)} maxLength={120} aria-label="Instituição" placeholder="Instituição" className="min-w-0 border-0 border-b border-dashed border-[#dcd3f7] bg-transparent px-1 py-1 text-center text-[8px] font-bold text-[#6d6c82] outline-none placeholder:text-[#8c899b] focus:border-[#6757c8] sm:text-xs" />
                    <input value={nomeProfessora} onChange={(event) => setNomeProfessora(event.target.value)} maxLength={120} aria-label="Professora" placeholder="Professora" className="min-w-0 border-0 border-b border-dashed border-[#dcd3f7] bg-transparent px-1 py-1 text-center text-[8px] font-bold text-[#6d6c82] outline-none placeholder:text-[#8c899b] focus:border-[#6757c8] sm:text-xs" />
                  </div>
                  <textarea value={legenda} onChange={(event) => setLegenda(event.target.value)} maxLength={280} aria-label="Legenda geral" placeholder="Legenda geral opcional" rows={1} className="mt-2 w-full resize-none border-0 bg-transparent text-center text-[8px] font-semibold leading-4 text-[#796a73] outline-none placeholder:text-[#b9abb4] focus:bg-[#f8f6ff] sm:text-xs" />
                </header>

                <div className="mt-[3%] min-h-0 flex-1">
                  {narrativePreset ? (
                    <div className="grid h-full gap-[2.5%]" style={{ gridTemplateRows: `repeat(${activePreset.rows}, minmax(0, 1fr))` }}>
                      {Array.from({ length: activePreset.rows }, (_, index) => {
                        const photo = pagePhotos[index];
                        const photoFirst = !activePreset.alternating || index % 2 === 0;
                        const globalIndex = safePreviewPage * pageSize + index;
                        const textSize = activePreset.rows === 2 ? "text-[10px] sm:text-sm" : activePreset.rows === 3 ? "text-[8px] sm:text-xs" : "text-[7px] sm:text-[10px]";
                        return (
                          <div key={photo?.id ?? `empty-${safePreviewPage}-${index}`} className="grid min-h-0 grid-cols-[42%_1fr] gap-[3%]">
                            <PreviewImageSlot
                              photo={photo}
                              slotNumber={globalIndex + 1}
                              className={cn(!photoFirst && "order-2")}
                              onFile={(file) => photo ? replacePhotoFile(photo.id, file) : addPhotoFromPreview(file)}
                              controls={photo ? (
                                <>
                                  <button type="button" onClick={() => moveSelectedItem(globalIndex, -1)} disabled={globalIndex === 0} className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-[#6757c8] shadow disabled:opacity-35" title="Mover para cima" aria-label="Mover foto para cima"><ArrowUp className="size-3.5" /></button>
                                  <button type="button" onClick={() => moveSelectedItem(globalIndex, 1)} disabled={globalIndex === selectedPhotos.length - 1} className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-[#6757c8] shadow disabled:opacity-35" title="Mover para baixo" aria-label="Mover foto para baixo"><ArrowDown className="size-3.5" /></button>
                                  <button type="button" onClick={() => removePhoto(photo.id)} className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-rose-600 shadow" title="Remover" aria-label="Remover foto"><Trash2 className="size-3.5" /></button>
                                </>
                              ) : undefined}
                            />
                            {photo ? (
                              <textarea
                                value={photo.relato}
                                onChange={(event) => updatePhoto(photo.id, { relato: event.target.value })}
                                maxLength={1800}
                                aria-label={`Relato da foto ${index + 1}`}
                                placeholder="Escreva o relato desta vivência..."
                                className={cn(
                                  "h-full min-h-0 w-full resize-none rounded-xl border border-dashed border-transparent bg-transparent p-2 font-semibold leading-[1.5] text-[#17213f] outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#dcd3f7] focus:border-[#8b78dc] focus:bg-[#fbfaf8] focus:shadow-[0_0_0_3px_rgba(103,87,200,0.1)]",
                                  textSize,
                                  !photoFirst && "order-1 text-right",
                                )}
                              />
                            ) : (
                              <div className={cn(
                                "flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed border-[#e2dced] bg-[#fcfbff] p-2 text-center font-semibold leading-relaxed text-[#9b97aa]",
                                textSize,
                                !photoFirst && "order-1",
                              )}>
                                O relato será escrito aqui depois que você adicionar a imagem.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid h-full gap-[2%]" style={{ gridTemplateColumns: `repeat(${activePreset.columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${activePreset.rows}, minmax(0, 1fr))` }}>
                      {Array.from({ length: pageSize }, (_, index) => {
                        const photo = pagePhotos[index];
                        const globalIndex = safePreviewPage * pageSize + index;
                        return (
                          <PreviewImageSlot
                            key={photo?.id ?? `empty-${safePreviewPage}-${index}`}
                            photo={photo}
                            slotNumber={globalIndex + 1}
                            fit="contain"
                            onFile={(file) => photo ? replacePhotoFile(photo.id, file) : addPhotoFromPreview(file)}
                            controls={photo ? (
                              <>
                                <button type="button" onClick={() => moveSelectedItem(globalIndex, -1)} disabled={globalIndex === 0} className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-[#6757c8] shadow disabled:opacity-35" title="Mover para cima" aria-label="Mover foto para cima"><ArrowUp className="size-3.5" /></button>
                                <button type="button" onClick={() => moveSelectedItem(globalIndex, 1)} disabled={globalIndex === selectedPhotos.length - 1} className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-[#6757c8] shadow disabled:opacity-35" title="Mover para baixo" aria-label="Mover foto para baixo"><ArrowDown className="size-3.5" /></button>
                                <button type="button" onClick={() => removePhoto(photo.id)} className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-rose-600 shadow" title="Remover" aria-label="Remover foto"><Trash2 className="size-3.5" /></button>
                              </>
                            ) : undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-[#e8e3f0] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(43,35,91,0.22)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#17213f]">Material pronto para finalizar</p>
          <p className="mt-1 text-xs font-semibold text-[#6d6c82]">Baixe o PDF ou abra a versão de impressão diretamente daqui.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => void exportPdf("download")} disabled={!selectedPhotos.length || exportMode !== null} className="pf-btn-primary h-11 px-4">
            {exportMode === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Baixar PDF
          </button>
          <button type="button" onClick={() => void exportPdf("print")} disabled={!selectedPhotos.length || exportMode !== null} className="pf-btn-success h-11 px-4">
            {exportMode === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            Imprimir
          </button>
        </div>
      </section>
    </div>
  );
}
