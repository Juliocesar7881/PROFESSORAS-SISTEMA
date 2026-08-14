"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardPenLine,
  Download,
  FileDown,
  FolderKanban,
  Images,
  Menu,
  Mic,
  ShieldCheck,
  Smartphone,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { PrefeituraNote } from "@/components/prefeitura-note";

const features: Array<{
  icon: LucideIcon;
  title: string;
  text: string;
  iconClass: string;
}> = [
  {
    icon: FolderKanban,
    title: "Projetos pedagógicos",
    text: "Biblioteca completa, projetos salvos e documentos importados em um único lugar.",
    iconClass: "bg-[#f1edff] text-[#6757c8]",
  },
  {
    icon: CalendarDays,
    title: "Planejamento semanal",
    text: "Objetivos e atividades organizados por dia, com PDF e Word prontos para usar.",
    iconClass: "bg-[#eaf9f6] text-[#278b7f]",
  },
  {
    icon: Images,
    title: "Impressão fácil",
    text: "Fotos e textos editados na própria prévia para montar páginas de caderno com rapidez.",
    iconClass: "bg-[#fff5df] text-[#b46d18]",
  },
  {
    icon: ClipboardPenLine,
    title: "Registros individuais",
    text: "Evidências por criança, data e turma, com fotos, ditado e histórico pesquisável.",
    iconClass: "bg-[#fff0f5] text-[#c64975]",
  },
  {
    icon: FileDown,
    title: "Relatórios editáveis",
    text: "Selecione registros reais, gere uma avaliação assistida e revise tudo antes de exportar.",
    iconClass: "bg-[#eef4ff] text-[#4c78d0]",
  },
  {
    icon: Smartphone,
    title: "Aplicativo Android",
    text: "Capture registros no celular, continue offline e sincronize imagens em segundo plano.",
    iconClass: "bg-[#edf8f0] text-[#3b925b]",
  },
];

const quickStats = [
  { icon: FolderKanban, value: "80+", label: "projetos", style: "bg-[#f1edff] text-[#6757c8]" },
  { icon: CalendarDays, value: "5", label: "dias da semana", style: "bg-[#eaf9f6] text-[#278b7f]" },
  { icon: Camera, value: "6", label: "fotos por registro", style: "bg-[#fff5df] text-[#b46d18]" },
  { icon: FileDown, value: "PDF", label: "e Word", style: "bg-[#fff0f5] text-[#c64975]" },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf8] text-[#17213f]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e3f0] bg-white/94 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <BrandMark href="/" />

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-[#e8e3f0] bg-white text-[#17213f] lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Abrir menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <nav className="hidden items-center gap-7 lg:flex">
            <a href="#recursos" className="text-sm font-semibold text-[#6d6c82] transition hover:text-[#4f3ca6]">Recursos</a>
            <a href="#aplicativo" className="text-sm font-semibold text-[#6d6c82] transition hover:text-[#4f3ca6]">Aplicativo</a>
            <a href="#gratuito" className="text-sm font-semibold text-[#6d6c82] transition hover:text-[#4f3ca6]">Gratuito</a>
            <Link href="/login" className="inline-flex h-11 items-center rounded-xl bg-[linear-gradient(135deg,#4f3ca6,#6757c8_55%,#9a86e6)] px-5 text-sm font-bold text-white shadow-[0_18px_36px_-24px_rgba(43,35,91,.48)] transition hover:-translate-y-0.5">
              Entrar
            </Link>
          </nav>
        </div>

        {menuOpen ? (
          <nav className="mx-auto mt-3 grid max-w-7xl gap-1 rounded-2xl border border-[#e8e3f0] bg-white p-3 shadow-[0_20px_48px_-32px_rgba(43,35,91,.32)] lg:hidden">
            {[["Recursos", "#recursos"], ["Aplicativo", "#aplicativo"], ["Gratuito", "#gratuito"]].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6d6c82] hover:bg-[#f7f4ff]">
                {label}
              </a>
            ))}
            <Link href="/login" className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f3ca6,#6757c8_55%,#9a86e6)] px-5 text-sm font-bold text-white">
              Entrar no sistema
            </Link>
          </nav>
        ) : null}
      </header>

      <section className="relative isolate min-h-[82svh] overflow-hidden border-b border-[#eee9f3] bg-[linear-gradient(180deg,#fffdfa_0%,#fbfaf8_62%,#f7f4ff_100%)] px-4 pb-12 pt-28 md:px-8 md:pt-32">
        <Image
          src="/brand/pequenos-passos-icon.png"
          alt="Professora lendo com crianças, símbolo do Pequenos Passos"
          width={1024}
          height={1024}
          priority
          className="pointer-events-none absolute -right-36 bottom-[-9rem] z-0 hidden w-[700px] select-none opacity-95 lg:block xl:right-[-2rem] xl:w-[760px]"
        />
        <div className="relative z-10 mx-auto flex min-h-[calc(82svh-8rem)] w-full max-w-7xl items-center">
          <div className="max-w-[720px] py-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ddd4f7] bg-white/82 px-3 py-1.5 text-xs font-bold text-[#6757c8] shadow-sm">
              <span className="size-2 rounded-full bg-[#4bb7a9]" />
              Feito para professoras da Educação Infantil
            </p>
            <h1 className="mt-6 text-[3.25rem] font-extrabold leading-[0.94] text-[#17213f] sm:text-[4.4rem] lg:text-[5.2rem]">
              Pequenos <span className="bg-[linear-gradient(90deg,#6757c8,#ef6d98,#f2a43a,#4bb7a9)] bg-clip-text text-transparent">Passos</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#5f5e75] md:text-xl">
              Organize, acompanhe e transforme cada pequeno passo em grandes conquistas pedagógicas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#4f3ca6,#6757c8_55%,#9a86e6)] px-6 text-base font-bold text-white shadow-[0_22px_48px_-28px_rgba(43,35,91,.58)] transition hover:-translate-y-0.5">
                Começar agora
                <ArrowRight className="size-4" />
              </Link>
              {apkUrl ? (
                <a href={apkUrl} download className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#ddd4f7] bg-white px-6 text-base font-bold text-[#5a49ba] transition hover:bg-[#f7f4ff]">
                  <Download className="size-4" />
                  Baixar para Android
                </a>
              ) : null}
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#6d6c82]">
              {["Acesso gratuito", "Dados privados", "Funciona offline no app"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#3f9d65]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="px-4 py-16 md:px-8 md:py-22">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6757c8]">Rotina organizada</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#17213f] md:text-5xl">Tudo que importa, sem complicar o trabalho.</h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-[#6d6c82]">O visual ficou mais leve e acolhedor, mas cada tela continua feita para consulta rápida e uso diário.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-[#e8e3f0] bg-white p-5 shadow-[0_16px_38px_-30px_rgba(43,35,91,.24)] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_-32px_rgba(43,35,91,.3)]">
                <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${feature.iconClass}`}>
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#17213f]">{feature.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#6d6c82]">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e3f0] bg-white px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6757c8]">Sistema completo</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#17213f] md:text-4xl">Uma visão clara da rotina pedagógica.</h2>
            </div>
            <p className="max-w-lg text-sm font-medium leading-relaxed text-[#6d6c82]">Projetos, registros e planejamento com a mesma linguagem visual no computador e no celular.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#ded7ec] bg-[#fbfaf8] shadow-[0_34px_84px_-50px_rgba(43,35,91,.42)]">
            <div className="grid min-h-[520px] md:grid-cols-[230px_1fr]">
              <aside className="hidden bg-[linear-gradient(180deg,#493696,#6e59c8)] p-4 text-white md:block">
                <BrandMark textClassName="[&_strong]:text-white [&_span]:text-white/65" markClassName="ring-white/15" />
                <div className="mt-8 space-y-2">
                  {[FolderKanban, Images, CalendarDays, ClipboardPenLine, UsersRound].map((Icon, index) => (
                    <div key={index} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${index === 0 ? "bg-white/20" : "text-white/72"}`}>
                      <Icon className="size-4" />
                      {['Projetos', 'Impressão fácil', 'Planejamento', 'Registros', 'Turmas e crianças'][index]}
                    </div>
                  ))}
                </div>
              </aside>
              <div className="min-w-0 bg-[#fbfaf8]">
                <div className="flex h-16 items-center justify-between border-b border-[#e8e3f0] bg-white px-5">
                  <div>
                    <p className="font-bold text-[#17213f]">Olá, professora!</p>
                    <p className="text-xs font-medium text-[#6d6c82]">Que bom ter você por aqui.</p>
                  </div>
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[#f1edff] text-sm font-bold text-[#6757c8]">PP</span>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {quickStats.map((stat) => (
                      <div key={stat.label} className={`rounded-2xl p-4 ${stat.style}`}>
                        <stat.icon className="size-5" />
                        <p className="mt-4 text-2xl font-extrabold">{stat.value}</p>
                        <p className="mt-1 text-xs font-semibold opacity-80">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
                    <div className="rounded-2xl border border-[#e8e3f0] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#17213f]">Projetos recentes</p>
                        <span className="text-xs font-semibold text-[#6757c8]">Ver biblioteca</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {['Acolhimento e vínculos', 'Cores, formas e descobertas', 'Brincando com a natureza'].map((item, index) => (
                          <div key={item} className="flex items-center gap-3 border-b border-[#f0edf4] pb-3 last:border-0">
                            <span className={`inline-flex size-10 items-center justify-center rounded-xl ${['bg-[#f1edff] text-[#6757c8]', 'bg-[#fff0f5] text-[#c64975]', 'bg-[#eaf9f6] text-[#278b7f]'][index]}`}>
                              <FolderKanban className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#17213f]">{item}</p>
                              <p className="mt-0.5 text-xs font-medium text-[#77758a]">Objetivos e atividades prontos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#e8e3f0] bg-white p-4">
                      <p className="font-bold text-[#17213f]">Próximos passos</p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl bg-[#f7f4ff] p-3 text-sm font-semibold text-[#5a49ba]">Registrar uma nova evidência</div>
                        <div className="rounded-xl bg-[#eaf9f6] p-3 text-sm font-semibold text-[#247f75]">Completar o planejamento</div>
                        <div className="rounded-xl bg-[#fff5df] p-3 text-sm font-semibold text-[#9a6818]">Montar página para impressão</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="aplicativo" className="bg-[linear-gradient(180deg,#f7f4ff_0%,#fffdfa_100%)] px-4 py-16 md:px-8 md:py-22">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div className="mx-auto w-full max-w-[360px] rounded-[2.4rem] border-[7px] border-[#17213f] bg-white p-3 shadow-[0_30px_70px_-38px_rgba(23,33,63,.48)]">
            <div className="flex items-center gap-3 border-b border-[#eeeaf3] px-2 pb-3 pt-1">
              <Image src="/brand/pequenos-passos-icon.png" alt="" width={42} height={42} className="size-11 rounded-xl" />
              <div>
                <p className="text-sm font-extrabold text-[#17213f]">Pequenos Passos</p>
                <p className="text-[11px] font-semibold text-[#77758a]">Novo registro</p>
              </div>
            </div>
            <div className="space-y-3 px-2 py-4">
              <div className="rounded-2xl bg-[#f1edff] p-4">
                <p className="text-xs font-bold text-[#6757c8]">Turma e criança</p>
                <p className="mt-2 text-sm font-semibold text-[#17213f]">Maternal II · Helena</p>
              </div>
              <div className="min-h-28 rounded-2xl border border-[#e8e3f0] bg-white p-4 text-sm font-medium leading-relaxed text-[#6d6c82]">Helena explorou os materiais com curiosidade e compartilhou suas descobertas...</div>
              <div className="grid grid-cols-3 gap-2">
                <span className="inline-flex h-12 items-center justify-center rounded-xl bg-[#fff0f5] text-[#c64975]"><Mic className="size-5" /></span>
                <span className="inline-flex h-12 items-center justify-center rounded-xl bg-[#eef4ff] text-[#4c78d0]"><Camera className="size-5" /></span>
                <span className="inline-flex h-12 items-center justify-center rounded-xl bg-[#fff5df] text-[#b46d18]"><Images className="size-5" /></span>
              </div>
              <div className="flex h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f3ca6,#6757c8_55%,#9a86e6)] text-sm font-bold text-white">Salvar registro</div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6757c8]">Na palma da mão</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight text-[#17213f] md:text-5xl">Registre no momento em que acontece.</h2>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[#6d6c82]">O aplicativo foi pensado para captura rápida: escolha a criança, dite ou escreva, anexe fotos e siga a rotina. O envio continua em segundo plano.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                [Mic, "Ditado com pausa automática", "bg-[#fff0f5] text-[#c64975]"],
                [ShieldCheck, "Rascunhos privados", "bg-[#f1edff] text-[#6757c8]"],
                [Smartphone, "Interface segura", "bg-[#eaf9f6] text-[#278b7f]"],
              ].map(([Icon, label, style]) => {
                const ItemIcon = Icon as LucideIcon;
                return (
                  <div key={String(label)} className="rounded-2xl border border-[#e8e3f0] bg-white p-4">
                    <span className={`inline-flex size-10 items-center justify-center rounded-xl ${style}`}><ItemIcon className="size-4" /></span>
                    <p className="mt-3 text-sm font-bold text-[#17213f]">{String(label)}</p>
                  </div>
                );
              })}
            </div>
            {apkUrl ? (
              <a href={apkUrl} download className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#17213f] px-6 text-sm font-bold text-white transition hover:bg-[#28345a]">
                <Download className="size-4" />
                Baixar aplicativo Android
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section id="gratuito" className="bg-white px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#ddd4f7] bg-[linear-gradient(135deg,#f7f4ff_0%,#fff8ef_50%,#eaf9f6_100%)] p-6 text-center shadow-[0_28px_70px_-48px_rgba(43,35,91,.34)] md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6757c8]">Acesso gratuito</p>
          <h2 className="mt-3 text-4xl font-extrabold text-[#17213f] md:text-5xl">Todos os recursos, sem assinatura.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-[#6d6c82]">Projetos, impressão, planejamento, registros, avaliações assistidas e aplicativo Android disponíveis para todas as contas.</p>
          <Link href="/login" className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#4f3ca6,#6757c8_55%,#9a86e6)] px-7 text-base font-bold text-white">
            Criar conta gratuita
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 pb-12 md:px-8">
        <div className="mx-auto max-w-4xl"><PrefeituraNote /></div>
      </section>

      <footer className="border-t border-white/10 bg-[#17213f] px-4 py-8 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <BrandMark markClassName="ring-white/15" textClassName="[&_strong]:text-white [&_span]:text-white/60" />
          <nav className="flex flex-wrap gap-4 text-sm font-medium text-white/60">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/excluir-conta" className="hover:text-white">Excluir conta</Link>
            <Link href="/login" className="hover:text-white">Entrar</Link>
          </nav>
          <p className="text-sm font-medium text-white/50">© 2026 Pequenos Passos</p>
        </div>
      </footer>
    </main>
  );
}
