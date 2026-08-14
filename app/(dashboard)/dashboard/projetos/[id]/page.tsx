import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpenText, Download, FileText, Heart, Printer, Target } from "lucide-react";

import { auth } from "@/auth";
import { ProjectSaveButton } from "@/components/project-save-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectCoverPath, resolveProjectCoverKey, type ProjectCoverKey } from "@/lib/project-cover";
import { getShowcaseProjectById } from "@/lib/project-showcase";
import { ProjetoService } from "@/services/projeto.service";

type DetailProject = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  coverKey: ProjectCoverKey;
  bnccObjetivos: string[];
  problema: string;
  justificativa: string;
  objetivoGeral: string;
  objetivosEspecificos: string[];
  camposExperiencia: string[];
  metodologia: string[];
  cronograma: string;
  avaliacao: string[];
  salvo: boolean;
  persisted: boolean;
  atividades: Array<{
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    duracao: number;
    materiais: string[];
    bnccCodigos: string[];
    objetivoTexto?: string | null;
  }>;
};

function normalizeProject(project: Partial<DetailProject> & Pick<DetailProject, "id" | "titulo" | "descricao" | "categoria" | "faixaEtaria" | "duracao" | "bnccObjetivos" | "atividades">): DetailProject {
  const metodologia = project.metodologia?.length
    ? project.metodologia
    : project.atividades.map((atividade) => `${atividade.titulo}: ${atividade.descricao}`);

  return {
    ...project,
    problema: project.problema ?? `Que descobertas as criancas podem construir a partir do tema ${project.titulo}?`,
    justificativa: project.justificativa ?? project.descricao,
    objetivoGeral: project.objetivoGeral ?? `Proporcionar experiencias integradas sobre ${project.titulo}.`,
    objetivosEspecificos: project.objetivosEspecificos?.length ? project.objetivosEspecificos : project.bnccObjetivos,
    camposExperiencia: project.camposExperiencia?.length ? project.camposExperiencia : project.bnccObjetivos,
    metodologia,
    cronograma: project.cronograma ?? project.duracao,
    coverKey: project.coverKey ?? resolveProjectCoverKey(project.titulo, project.categoria),
    avaliacao: project.avaliacao?.length
      ? project.avaliacao
      : [
          "Participa das propostas com interesse e envolvimento progressivo.",
          "Explora materiais, imagens, sons, movimentos e registros relacionados ao tema.",
          "Interage com colegas e adultos, respeitando combinados da rotina.",
          "Comunica descobertas por fala, gesto, desenho, movimento ou brincadeira.",
        ],
    salvo: project.salvo ?? false,
    persisted: project.persisted ?? false,
  };
}

async function getProjectForPage(id: string): Promise<DetailProject | null> {
  const localProject = getShowcaseProjectById(id);

  if (localProject) {
    return normalizeProject({
      ...localProject,
      salvo: false,
      persisted: false,
    });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const apiProject = await new ProjetoService().detail(session.user.id, id);

    return normalizeProject({
      id: apiProject.id,
      titulo: apiProject.titulo,
      descricao: apiProject.descricao,
      categoria: apiProject.categoria,
      faixaEtaria: apiProject.faixaEtaria,
      duracao: apiProject.duracao,
      coverKey: resolveProjectCoverKey(
        apiProject.titulo,
        apiProject.categoria,
        apiProject.thumbnailKey,
        apiProject.origem === "IMPORTADO",
      ),
      bnccObjetivos: apiProject.bnccObjetivos,
      problema: apiProject.problema ?? undefined,
      justificativa: apiProject.justificativa ?? undefined,
      objetivoGeral: apiProject.objetivoGeral ?? undefined,
      objetivosEspecificos: apiProject.objetivosEspecificos,
      camposExperiencia: apiProject.camposExperiencia,
      metodologia: apiProject.metodologia,
      cronograma: apiProject.cronograma ?? undefined,
      avaliacao: apiProject.avaliacao,
      salvo: Boolean(apiProject.salvo),
      persisted: true,
      atividades: apiProject.atividades.map((atividade) => ({
        id: atividade.id,
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        categoria: atividade.categoria,
        duracao: atividade.duracao,
        materiais: atividade.materiais,
        bnccCodigos: atividade.bnccCodigos,
        objetivoTexto: atividade.objetivoTexto,
      })),
    });
  } catch {
    return null;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t border-[#e8e3f0] pt-4">
      <h2 className="font-heading text-xl font-black text-[#17213f]">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="rounded-xl border border-dashed border-[#dcd3f7] bg-[#f3f0ff]/50 p-3 text-sm font-semibold text-[#6d6c82]">Sem informacoes cadastradas.</p>;
  }

  return (
    <ul className="space-y-2 text-sm font-semibold leading-relaxed text-[#6d6c82]">
      {items.map((item) => (
        <li key={item} className="rounded-lg border border-[#e8e3f0] bg-white px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ProjetoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projeto = await getProjectForPage(id);

  if (!projeto) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
        <p>Projeto nao encontrado neste catalogo.</p>
        <Link
          href="/dashboard/projetos"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100"
        >
          Voltar para projetos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/projetos" className="inline-flex items-center gap-2 text-sm font-black text-[#6757c8] underline underline-offset-4">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/projetos/${projeto.id}/export?format=pdf`} className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-[#dcd3f7] bg-white px-4 text-sm font-black text-[#6757c8] transition hover:bg-[#f3f0ff]">
            <Download className="mr-2 size-4" /> PDF
          </a>
          <a href={`/api/projetos/${projeto.id}/export?format=docx`} className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-[#dcd3f7] bg-white px-4 text-sm font-black text-[#6757c8] transition hover:bg-[#f3f0ff]">
            <FileText className="mr-2 size-4" /> Word
          </a>
          <Link href={`/dashboard/planejamento?projetoId=${projeto.id}`} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6757c8] px-4 text-sm font-black text-white transition hover:bg-[#5443ad]">
            <BookOpenText className="mr-2 size-4" /> Usar no planejamento
          </Link>
        </div>
      </div>

      <Card className="border-[#e8e3f0] bg-white">
        <div className="relative aspect-[16/7] min-h-[220px] overflow-hidden rounded-t-[inherit] bg-[#f4f1fb] sm:min-h-0">
          <Image
            src={getProjectCoverPath(projeto.coverKey)}
            alt={`Imagem do projeto ${projeto.titulo}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2f2330]/30 via-transparent to-transparent" />
        </div>
        <CardHeader className="space-y-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="pf-chip border-[#dcd3f7] bg-[#f3f0ff] text-[#6757c8]">{projeto.categoria}</span>
            <span className="pf-chip border-[#dcd3f7] bg-[#f3f0ff] text-[#6757c8]">{projeto.faixaEtaria}</span>
            <span className="pf-chip border-[#dcd3f7] bg-[#f3f0ff] text-[#6757c8]">{projeto.duracao}</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6757c8]">Pequenos Passos</p>
            <CardTitle className="mt-2 font-heading text-3xl font-black text-[#17213f] md:text-4xl">
              Projeto: {projeto.titulo}
            </CardTitle>
          </div>
          <ProjectSaveButton projectId={projeto.id} initialSaved={projeto.salvo} disabled={!projeto.persisted} />
        </CardHeader>
        <CardContent className="space-y-5 text-sm font-semibold leading-relaxed text-[#6d6c82]">
          <p className="rounded-xl border border-[#e8e3f0] bg-[#f3f0ff]/60 p-4 text-base">{projeto.descricao}</p>

          <Section title="Problema">
            <p>
              <strong>Problema:</strong> {projeto.problema}
            </p>
          </Section>

          <Section title="Justificativa">
            <p>{projeto.justificativa}</p>
          </Section>

          <Section title="Objetivo geral">
            <p>{projeto.objetivoGeral}</p>
          </Section>

          <Section title="Objetivos especificos">
            <BulletList items={projeto.objetivosEspecificos} />
          </Section>

          <Section title="Campos de experiencia">
            <BulletList items={projeto.camposExperiencia} />
          </Section>

          <Section title="Metodologia">
            <BulletList items={projeto.metodologia} />
          </Section>

          <Section title="Atividades do projeto">
            <div className="space-y-3">
              {projeto.atividades.map((atividade, index) => (
                <article key={atividade.id} className="rounded-xl border border-[#e8e3f0] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-heading text-xl font-black text-[#17213f]">
                      {index + 1}. {atividade.titulo}
                    </h3>
                    <span className="pf-chip border-[#dcd3f7] bg-[#f3f0ff] text-[#6757c8]">{atividade.duracao} min</span>
                  </div>
                  <p className="mt-2">{atividade.descricao}</p>
                  {atividade.objetivoTexto ? <p className="mt-2 rounded-lg bg-[#f3f0ff] p-3 text-sm"><strong>Objetivo:</strong> {atividade.objetivoTexto}</p> : null}
                  {atividade.materiais.length ? (
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#6d6c82]">
                      Materiais: {atividade.materiais.join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </Section>

          <Section title="Cronograma">
            <p>{projeto.cronograma}</p>
          </Section>

          <Section title="Avaliacao">
            <BulletList items={projeto.avaliacao} />
          </Section>

          <div className="grid gap-3 border-t border-[#e8e3f0] pt-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e8e3f0] bg-[#f3f0ff]/50 p-3">
              <Target className="size-5 text-[#6757c8]" />
              <p className="mt-2 font-heading text-2xl text-[#17213f]">{projeto.objetivosEspecificos.length}</p>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6d6c82]">objetivos</p>
            </div>
            <div className="rounded-xl border border-[#e8e3f0] bg-[#f3f0ff]/50 p-3">
              <Heart className="size-5 text-[#6757c8]" />
              <p className="mt-2 font-heading text-2xl text-[#17213f]">{projeto.camposExperiencia.length}</p>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6d6c82]">campos</p>
            </div>
            <div className="rounded-xl border border-[#e8e3f0] bg-[#f3f0ff]/50 p-3">
              <Printer className="size-5 text-[#6757c8]" />
              <p className="mt-2 font-heading text-2xl text-[#17213f]">{projeto.atividades.length}</p>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6d6c82]">atividades</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
