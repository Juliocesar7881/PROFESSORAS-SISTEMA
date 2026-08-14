"use client";
/* eslint-disable react-hooks/refs */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ClipboardList,
  Download,
  FileText,
  GripVertical,
  Loader2,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPayloadItems } from "@/lib/api-payload";
import { SHOWCASE_PROJECTS } from "@/lib/project-showcase";
import { cn } from "@/lib/utils";

type ProjectActivity = {
  id: string;
  titulo: string;
  descricao: string;
  objetivoTexto?: string | null;
  materiais: string[];
  bnccCodigos: string[];
};

type Project = {
  id: string;
  titulo: string;
  descricao: string;
  persisted: boolean;
  origem?: string;
  salvo?: boolean;
  createdAt?: string;
  objetivosEspecificos: string[];
  bnccObjetivos: string[];
  camposExperiencia: string[];
  atividades: ProjectActivity[];
};

type PlanApi = {
  id: string;
  grupoNome?: string | null;
  projetoBaseId?: string | null;
  camposExperiencia: string[];
  direitosAprendizagem: string[];
  nomeInstituicao?: string | null;
  nomeProfessora?: string | null;
  atividades: Array<{
    id: string;
    diaSemana: number;
    ordem: number;
    horario?: string | null;
    objetivosTexto?: string | null;
    atividadeTexto?: string | null;
    atividade?: ProjectActivity | null;
  }>;
};

type WeekRow = {
  diaSemana: number;
  objetivosTexto: string;
  atividadeTexto: string;
};

type SuggestionKind = "objective" | "activity";

const DAYS = [
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terca-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
];

const DEFAULT_DIREITOS = [
  "Conviver",
  "Brincar",
  "Participar",
  "Explorar",
  "Expressar",
  "Conhecer-se",
];

function localDate(value: Date) {
  const copy = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
}

function monday(value = new Date()) {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekEnd(start: string) {
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + 4);
  return localDate(date);
}

function dayDate(start: string, day: number) {
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + day - 1);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function list(value: string) {
  return value
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function emptyRows(): WeekRow[] {
  return DAYS.map((day) => ({
    diaSemana: day.value,
    objetivosTexto: "",
    atividadeTexto: "",
  }));
}

function appendText(current: string, next: string) {
  const clean = next.trim();
  if (!clean) return current;
  if (!current.trim()) return clean;
  if (current.includes(clean)) return current;
  return `${current.trim()}\n- ${clean.replace(/^[-*]\s*/, "")}`;
}

function mapLocalProjects(): Project[] {
  return SHOWCASE_PROJECTS.map((project) => ({
    id: project.id,
    titulo: project.titulo,
    descricao: project.descricao,
    persisted: false,
    salvo: false,
    objetivosEspecificos: project.objetivosEspecificos,
    bnccObjetivos: project.bnccObjetivos,
    camposExperiencia: project.camposExperiencia,
    atividades: project.atividades.map((item) => ({
      ...item,
      objetivoTexto: project.objetivosEspecificos.slice(0, 2).join("; "),
    })),
  }));
}

function mapApiProjects(value: unknown): Project[] {
  return getPayloadItems<Record<string, unknown>>(value).map((raw) => {
    const project = raw as unknown as Omit<Project, "persisted">;
    return {
      ...project,
      persisted: true,
      salvo: Boolean(project.salvo),
      atividades: project.atividades ?? [],
      objetivosEspecificos: project.objetivosEspecificos ?? [],
      bnccObjetivos: project.bnccObjetivos ?? [],
      camposExperiencia: project.camposExperiencia ?? [],
    };
  });
}

function SuggestionPanel({
  kind,
  items,
  selectedDay,
  onInsert,
}: {
  kind: SuggestionKind;
  items: string[];
  selectedDay: number;
  onInsert: (kind: SuggestionKind, text: string, day: number) => void;
}) {
  const objective = kind === "objective";
  const Icon = objective ? Target : ClipboardList;

  return (
    <section className="overflow-hidden rounded-lg border border-[#eadde5] bg-white shadow-[0_14px_36px_-32px_rgba(73,43,62,0.55)]">
      <header className="flex items-center gap-2 border-b border-[#eee3e9] bg-[#fff8fb] px-3 py-3">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#f8e8f0] text-[#95546f]">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-[#312834]">
            {objective ? "Objetivos do projeto" : "Atividades do projeto"}
          </h3>
          <p className="text-[11px] font-bold text-[#978791]">{items.length} sugestao(oes)</p>
        </div>
      </header>

      <div className="max-h-[330px] space-y-2 overflow-y-auto p-2 scrollbar-hide">
        {items.map((item, index) => (
          <SuggestionItem
            key={`${kind}-${index}-${item.slice(0, 24)}`}
            id={`suggestion-${kind}-${index}`}
            kind={kind}
            text={item}
            selectedDay={selectedDay}
            onInsert={onInsert}
          />
        ))}

        {!items.length ? (
          <div className="rounded-md border border-dashed border-[#e2d2db] px-3 py-8 text-center text-xs font-bold text-[#9b8d96]">
            Selecione um projeto base.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SuggestionItem({
  id,
  kind,
  text,
  selectedDay,
  onInsert,
}: {
  id: string;
  kind: SuggestionKind;
  text: string;
  selectedDay: number;
  onInsert: (kind: SuggestionKind, text: string, day: number) => void;
}) {
  const draggable = useDraggable({ id, data: { kind, text } });
  const style = {
    transform: CSS.Translate.toString(draggable.transform),
    touchAction: "none" as const,
  };

  return (
    <div
      ref={draggable.setNodeRef}
      style={style}
      title={`Arrastar ou adicionar em ${DAYS[selectedDay - 1]?.label}`}
      onClick={() => onInsert(kind, text, selectedDay)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onInsert(kind, text, selectedDay);
        }
      }}
      className={cn(
        "group flex cursor-grab items-start gap-2 rounded-md border border-[#eee3e9] bg-white p-2.5 text-left transition hover:border-[#d9b7c7] hover:bg-[#fff9fc] active:cursor-grabbing",
        draggable.isDragging && "z-50 opacity-70 shadow-xl",
      )}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-[#b69ca9] group-hover:text-[#95546f]" />
      <span className="line-clamp-4 text-xs font-semibold leading-5 text-[#655761]">{text}</span>
    </div>
  );
}

function PlanningCell({
  row,
  kind,
  compact = false,
  onUpdate,
  onFocus,
}: {
  row: WeekRow;
  kind: SuggestionKind;
  compact?: boolean;
  onUpdate: (day: number, field: "objetivosTexto" | "atividadeTexto", value: string) => void;
  onFocus: (day: number) => void;
}) {
  const field = kind === "objective" ? "objetivosTexto" : "atividadeTexto";
  const droppable = useDroppable({
    id: `drop-${kind}-${row.diaSemana}-${compact ? "mobile" : "desktop"}`,
    data: { kind, day: row.diaSemana },
  });

  return (
    <div
      ref={droppable.setNodeRef}
      className={cn(
        "relative h-full transition",
        droppable.isOver && "bg-[#fff0f6] ring-2 ring-inset ring-[#c97f9f]",
      )}
    >
      <Textarea
        value={row[field]}
        onFocus={() => onFocus(row.diaSemana)}
        onChange={(event) => onUpdate(row.diaSemana, field, event.target.value)}
        placeholder={kind === "objective" ? "Escreva os objetivos do dia" : "Escreva as atividades do dia"}
        className={cn(
          "h-full min-h-36 resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm font-semibold leading-6 text-[#4f424b] shadow-none focus-visible:ring-0",
          !compact && "lg:min-h-[168px]",
        )}
      />
    </div>
  );
}

export default function PlanejamentoPage() {
  const params = useSearchParams();
  const requestedProjectId = params.get("projetoId") ?? "";
  const initialWeek = useMemo(() => localDate(monday()), []);
  const [week, setWeek] = useState(initialWeek);
  const [rows, setRows] = useState<WeekRow[]>(emptyRows);
  const [projects, setProjects] = useState<Project[]>(mapLocalProjects);
  const [projectId, setProjectId] = useState(requestedProjectId);
  const [planId, setPlanId] = useState<string | null>(null);
  const [grupo, setGrupo] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [professora, setProfessora] = useState("");
  const [campos, setCampos] = useState("");
  const [direitos, setDireitos] = useState(DEFAULT_DIREITOS.join("; "));
  const [insertDay, setInsertDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const selectedProject = projects.find((item) => item.id === projectId) ?? null;
  const objectiveSuggestions = useMemo(() => {
    if (!selectedProject) return [];
    return unique([
      ...selectedProject.objetivosEspecificos,
      ...selectedProject.atividades.map((item) => item.objetivoTexto),
      ...selectedProject.bnccObjetivos,
    ]).slice(0, 30);
  }, [selectedProject]);
  const activitySuggestions = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.atividades.map((item) => {
      const materials = item.materiais?.length ? `\nMateriais: ${item.materiais.join(", ")}` : "";
      return `${item.titulo}: ${item.descricao}${materials}`;
    });
  }, [selectedProject]);

  const importedProjects = useMemo(
    () => projects.filter((project) => project.origem === "IMPORTADO"),
    [projects],
  );
  const savedProjects = useMemo(
    () => projects.filter((project) => project.origem !== "IMPORTADO" && project.salvo),
    [projects],
  );
  const libraryProjects = useMemo(
    () => projects.filter((project) => project.origem !== "IMPORTADO" && !project.salvo),
    [projects],
  );

  const loadProjects = useCallback(async (selectProjectId?: string) => {
    try {
      const urls = [
        "/api/projetos?includeAtividades=true&origem=IMPORTADO&limit=80",
        "/api/projetos?includeAtividades=true&salvos=true&limit=80",
        "/api/projetos?includeAtividades=true&limit=80",
      ];
      const responses = await Promise.all(urls.map((url) => fetch(url, { cache: "no-store" })));
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const apiById = new Map<string, Project>();

      responses.forEach((response, index) => {
        if (!response.ok) return;
        mapApiProjects(payloads[index].data).forEach((project) => {
          if (!apiById.has(project.id)) apiById.set(project.id, project);
        });
      });

      const api = [...apiById.values()];
      const titles = new Set(api.map((item) => item.titulo.toLowerCase()));
      const merged = [...api, ...mapLocalProjects().filter((item) => !titles.has(item.titulo.toLowerCase()))];
      setProjects(merged);
      const desiredProjectId = selectProjectId || requestedProjectId;
      if (desiredProjectId && merged.some((item) => item.id === desiredProjectId)) {
        setProjectId(desiredProjectId);
      }
    } catch {
      // O catalogo local continua disponivel quando a API estiver temporariamente indisponivel.
    }
  }, [requestedProjectId]);

  const loadPlan = useCallback(async (weekValue: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/planejamento?semanaInicio=${weekValue}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao carregar planejamento");
      const plan = (json.data?.planejamentos?.[0] ?? null) as PlanApi | null;
      setStreak(json.data?.streak ?? 0);

      if (!plan) {
        setPlanId(null);
        setRows(emptyRows());
        setGrupo("");
        setInstituicao("");
        setProfessora("");
        setCampos("");
        setDireitos(DEFAULT_DIREITOS.join("; "));
        return;
      }

      setPlanId(plan.id);
      setGrupo(plan.grupoNome ?? "");
      setInstituicao(plan.nomeInstituicao ?? "");
      setProfessora(plan.nomeProfessora ?? "");
      setCampos(plan.camposExperiencia.join("; "));
      setDireitos((plan.direitosAprendizagem.length ? plan.direitosAprendizagem : DEFAULT_DIREITOS).join("; "));
      setProjectId(plan.projetoBaseId ?? "");
      setRows(DAYS.map((day) => {
        const dayItems = plan.atividades
          .filter((item) => item.diaSemana === day.value)
          .sort((a, b) => a.ordem - b.ordem);
        return {
          diaSemana: day.value,
          objetivosTexto: unique(dayItems.map((item) => (
            item.objetivosTexto
            || item.atividade?.objetivoTexto
            || item.atividade?.bnccCodigos?.join(", ")
          ))).join("\n"),
          atividadeTexto: dayItems.map((item) => {
            const text = item.atividadeTexto
              || [item.atividade?.titulo, item.atividade?.descricao].filter(Boolean).join(": ");
            return [item.horario, text].filter(Boolean).join(" - ");
          }).filter(Boolean).join("\n\n"),
        };
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar planejamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);
  useEffect(() => { void loadPlan(week); }, [loadPlan, week]);

  const updateRow = (day: number, field: "objetivosTexto" | "atividadeTexto", value: string) => {
    setRows((current) => current.map((row) => (
      row.diaSemana === day ? { ...row, [field]: value } : row
    )));
  };

  const insertSuggestion = (kind: SuggestionKind, text: string, day: number) => {
    const field = kind === "objective" ? "objetivosTexto" : "atividadeTexto";
    setInsertDay(day);
    setRows((current) => current.map((row) => (
      row.diaSemana === day ? { ...row, [field]: appendText(row[field], text) } : row
    )));
  };

  const finishSuggestionDrag = ({ active, over }: DragEndEvent) => {
    const source = active.data.current as { kind?: SuggestionKind; text?: string } | undefined;
    const target = over?.data.current as { kind?: SuggestionKind; day?: number } | undefined;
    if (!source?.kind || !source.text || source.kind !== target?.kind || !target.day) return;
    insertSuggestion(source.kind, source.text, target.day);
  };

  const applyProject = () => {
    if (!selectedProject) return toast.error("Selecione um projeto.");
    const next = emptyRows();
    selectedProject.atividades.forEach((activity, index) => {
      const day = (index % 5) + 1;
      const row = next[day - 1];
      const objective = activity.objetivoTexto
        || selectedProject.objetivosEspecificos[index % Math.max(selectedProject.objetivosEspecificos.length, 1)]
        || activity.bnccCodigos?.join(", ")
        || "";
      const materials = activity.materiais?.length ? `\nMateriais: ${activity.materiais.join(", ")}` : "";
      row.objetivosTexto = appendText(row.objetivosTexto, objective);
      row.atividadeTexto = appendText(row.atividadeTexto, `${activity.titulo}: ${activity.descricao}${materials}`);
    });
    setRows(next);
    setCampos(selectedProject.camposExperiencia.join("; "));
    toast.success("Projeto distribuido na semana.");
  };

  const save = async () => {
    const activities = rows
      .filter((row) => row.objetivosTexto.trim() || row.atividadeTexto.trim())
      .map((row) => ({
        diaSemana: row.diaSemana,
        ordem: 0,
        horario: "",
        objetivosTexto: row.objetivosTexto,
        atividadeTexto: row.atividadeTexto,
      }));
    if (!activities.length) return toast.error("Preencha ao menos um dia da semana.");

    setSaving(true);
    try {
      const response = await fetch("/api/planejamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupoNome: grupo,
          semanaInicio: week,
          semanaFim: weekEnd(week),
          projetoBaseId: selectedProject?.persisted ? selectedProject.id : undefined,
          camposExperiencia: list(campos),
          direitosAprendizagem: list(direitos),
          nomeInstituicao: instituicao,
          nomeProfessora: professora,
          atividades: activities,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao salvar");
      toast.success(planId ? "Planejamento atualizado" : "Planejamento salvo");
      await loadPlan(week);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const download = (format: "pdf" | "docx") => {
    if (!planId) return toast.info("Salve o planejamento antes de baixar.");
    window.location.assign(`/api/planejamento/export?planejamentoId=${planId}&format=${format}`);
  };

  return (
    <div className="mx-auto max-w-[1580px] space-y-4">
      <DashboardFilterBar
        title="Planejamento semanal"
        summary={<span>{streak ? `${streak} semana(s) em sequencia` : "Documento semanal editavel"}</span>}
      >
        <input
          type="date"
          className="pf-input h-11 lg:w-[155px]"
          value={week}
          onChange={(event) => setWeek(event.target.value)}
        />
        <Button onClick={save} disabled={saving} className="pf-btn-success h-11">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar
        </Button>
        <Button variant="outline" onClick={() => download("pdf")} className="h-11">
          <Download className="size-4" /> PDF
        </Button>
        <Button variant="outline" onClick={() => download("docx")} className="h-11">
          <FileText className="size-4" /> Word
        </Button>
      </DashboardFilterBar>

      <section className="rounded-lg border border-[#eadde5] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_auto_auto]">
          <select
            className="pf-select h-11"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Sem projeto base</option>
            {savedProjects.length ? (
              <optgroup label={`Projetos salvos (${savedProjects.length})`}>
                {savedProjects.map((project) => <option key={project.id} value={project.id}>{project.titulo}</option>)}
              </optgroup>
            ) : null}
            {importedProjects.length ? (
              <optgroup label={`Projetos importados (${importedProjects.length})`}>
                {importedProjects.map((project) => <option key={project.id} value={project.id}>{project.titulo}</option>)}
              </optgroup>
            ) : null}
            {libraryProjects.length ? (
              <optgroup label="Biblioteca de projetos">
                {libraryProjects.map((project) => <option key={project.id} value={project.id}>{project.titulo}</option>)}
              </optgroup>
            ) : null}
          </select>
          <Button type="button" onClick={applyProject} disabled={!selectedProject} className="h-11">
            <Sparkles className="size-4" /> Aplicar projeto
          </Button>
          <ProjectImportDialog
            compact
            onCreated={(id) => { void loadProjects(id); }}
          />
        </div>

        <details className="mt-3 rounded-md border border-[#eee3e9]">
          <summary className="cursor-pointer px-3 py-3 text-sm font-bold text-[#6b5864]">
            Cabecalho e campos pedagogicos
          </summary>
          <div className="grid gap-3 border-t border-[#eee3e9] p-3 md:grid-cols-3">
            <label>
              <span className="pf-label">Grupo / turma</span>
              <input className="pf-input h-10" value={grupo} onChange={(event) => setGrupo(event.target.value)} />
            </label>
            <label>
              <span className="pf-label">Instituicao</span>
              <input className="pf-input h-10" value={instituicao} onChange={(event) => setInstituicao(event.target.value)} />
            </label>
            <label>
              <span className="pf-label">Professora</span>
              <input className="pf-input h-10" value={professora} onChange={(event) => setProfessora(event.target.value)} />
            </label>
            <label className="md:col-span-2">
              <span className="pf-label">Campos de experiencia</span>
              <Textarea rows={3} value={campos} onChange={(event) => setCampos(event.target.value)} />
            </label>
            <label>
              <span className="pf-label">Direitos de aprendizagem</span>
              <Textarea rows={3} value={direitos} onChange={(event) => setDireitos(event.target.value)} />
            </label>
          </div>
        </details>
      </section>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={finishSuggestionDrag}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="min-w-0 overflow-hidden rounded-lg border border-[#dfd2da] bg-white shadow-[0_18px_48px_-42px_rgba(62,39,53,0.6)]">
          <header className="border-b border-[#dfd2da] bg-[#fffafd] px-4 py-5 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6757c8]">Pequenos Passos</p>
            <h2 className="mt-1 font-heading text-xl text-[#302733]">Planejamento semanal</h2>
            <p className="mt-1 text-xs font-bold text-[#857582]">
              Semana de {dayDate(week, 1)} a {dayDate(week, 5)}{grupo ? ` | ${grupo}` : ""}
            </p>
          </header>

          {loading ? (
            <div className="grid min-h-[460px] place-items-center">
              <Loader2 className="size-6 animate-spin text-[#a65f7f]" />
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <div className="grid grid-cols-[150px_minmax(0,0.9fr)_minmax(0,1.15fr)] border-b border-[#dfd2da] bg-[#f8eef3] text-center text-xs font-black uppercase text-[#5c4b56]">
                  <div className="border-r border-[#dfd2da] px-3 py-3">Semana</div>
                  <div className="border-r border-[#dfd2da] px-3 py-3">Objetivos</div>
                  <div className="px-3 py-3">Atividades</div>
                </div>
                {rows.map((row) => {
                  const day = DAYS[row.diaSemana - 1];
                  return (
                    <div key={row.diaSemana} className="grid grid-cols-[150px_minmax(0,0.9fr)_minmax(0,1.15fr)] border-b border-[#e8dde3] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setInsertDay(row.diaSemana)}
                        className={cn(
                          "flex min-h-[168px] flex-col items-center justify-center border-r border-[#dfd2da] px-3 text-center transition",
                          insertDay === row.diaSemana ? "bg-[#f8e8f0]" : "bg-[#fffafd] hover:bg-[#fcf4f8]",
                        )}
                      >
                        <span className="text-base font-black text-[#423640]">{dayDate(week, row.diaSemana)}</span>
                        <span className="mt-1 text-xs font-black uppercase text-[#a65f7f]">{day.label}</span>
                      </button>
                      <div className="border-r border-[#dfd2da]"><PlanningCell row={row} kind="objective" onUpdate={updateRow} onFocus={setInsertDay} /></div>
                      <div><PlanningCell row={row} kind="activity" onUpdate={updateRow} onFocus={setInsertDay} /></div>
                    </div>
                  );
                })}
              </div>

              <div className="divide-y divide-[#e8dde3] lg:hidden">
                {rows.map((row) => {
                  const day = DAYS[row.diaSemana - 1];
                  return (
                    <section key={row.diaSemana}>
                      <button
                        type="button"
                        onClick={() => setInsertDay(row.diaSemana)}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-3 text-left",
                          insertDay === row.diaSemana ? "bg-[#f8e8f0]" : "bg-[#fffafd]",
                        )}
                      >
                        <span className="font-black text-[#423640]">{day.label}</span>
                        <span className="text-xs font-black text-[#a65f7f]">{dayDate(week, row.diaSemana)}</span>
                      </button>
                      <div className="grid gap-px bg-[#e8dde3] sm:grid-cols-2">
                        <div className="bg-white">
                          <p className="border-b border-[#eee3e9] px-4 py-2 text-[10px] font-black uppercase text-[#8d7784]">Objetivos</p>
                          <PlanningCell row={row} kind="objective" compact onUpdate={updateRow} onFocus={setInsertDay} />
                        </div>
                        <div className="bg-white">
                          <p className="border-b border-[#eee3e9] px-4 py-2 text-[10px] font-black uppercase text-[#8d7784]">Atividades</p>
                          <PlanningCell row={row} kind="activity" compact onUpdate={updateRow} onFocus={setInsertDay} />
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <aside className="order-first space-y-3 xl:order-none xl:sticky xl:top-24">
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-[#eadde5] bg-white p-1">
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setInsertDay(day.value)}
                className={cn(
                  "h-9 rounded-md text-xs font-black transition",
                  insertDay === day.value ? "bg-[#7d405d] text-white" : "text-[#74616d] hover:bg-[#f8eef3]",
                )}
                title={`Inserir em ${day.label}`}
              >
                {day.short}
              </button>
            ))}
          </div>
          <SuggestionPanel kind="objective" items={objectiveSuggestions} selectedDay={insertDay} onInsert={insertSuggestion} />
          <SuggestionPanel kind="activity" items={activitySuggestions} selectedDay={insertDay} onInsert={insertSuggestion} />
        </aside>
      </div>
      </DndContext>
    </div>
  );
}
