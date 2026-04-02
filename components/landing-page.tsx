"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const stepData = [
  {
    icon: "📸",
    num: "1",
    title: "Registre o momento",
    desc: "Abra o app, fotografe na sala de aula e adicione uma observação rápida. Salvo em segundos, sem burocracia.",
    chips: ["📷 Foto vinculada", "✍️ Observação rápida", "☁️ Salvo na nuvem", "📅 Data automática"],
  },
  {
    icon: "🧠",
    num: "2",
    title: "Organize por competência",
    desc: "Classifique os registros por campos de desenvolvimento alinhados à BNCC. Tudo estruturado sem esforço extra.",
    chips: ["🧠 Cognitivo", "🤝 Social", "🗣️ Linguagem", "🎨 Expressão"],
  },
  {
    icon: "📄",
    num: "3",
    title: "Gere o relatório",
    desc: "PDF completo com fotos, observações e evolução do aluno. Pronto para reunião com família ou coordenação.",
    chips: ["📄 PDF com fotos", "📈 Evolução", "👨‍👩‍👧 Para a família", "🗂️ Portfólio"],
  },
];

const features = [
  {
    icon: "📸",
    title: "Registro com fotos",
    text: "Tire fotos na sala e vincule ao aluno em segundos. Cada imagem vira uma observação pedagógica rica.",
    variant: "purple",
  },
  {
    icon: "📋",
    title: "Planos de aula fáceis",
    text: "Monte planos alinhados à BNCC e reaproveite templates sem começar do zero toda semana.",
    variant: "peach",
  },
  {
    icon: "📈",
    title: "Evolução por criança",
    text: "Acompanhe o desenvolvimento por competência e por período com uma linha do tempo visual.",
    variant: "mint",
  },
  {
    icon: "📱",
    title: "App no celular",
    text: "Funciona como app no Android e iPhone, inclusive offline, para registrar direto da sala.",
    variant: "yellow",
  },
  {
    icon: "🔗",
    title: "Complementa o Betha",
    text: "Não substitui o sistema da prefeitura. Complementa com fluxo pedagógico e qualidade de registro.",
    variant: "blue",
  },
  {
    icon: "📄",
    title: "Relatórios em PDF",
    text: "Gere relatórios completos por aluno para reuniões com famílias e coordenação em um toque.",
    variant: "pink",
  },
];

const testimonials = [
  {
    quote:
      "O Planejei transformou meus registros. Antes acumulava fotos no celular sem saber o que fazer.",
    name: "Camila Araújo",
    role: "Professora Infantil 5 - São Paulo",
    avatar: "CA",
    color: "purple",
  },
  {
    quote:
      "Uso o Betha para o que a prefeitura exige e o Planejei para meus registros com qualidade.",
    name: "Renata Pereira",
    role: "Professora 1º ano - Curitiba",
    avatar: "RP",
    color: "peach",
  },
  {
    quote:
      "Os PDFs para reuniões de pais são incríveis. As famílias ficam emocionadas com a evolução bem organizada.",
    name: "Fernanda Silva",
    role: "Coordenadora Pedagogica - Recife",
    avatar: "FS",
    color: "mint",
  },
];

export function LandingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % stepData.length);
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".pj-reveal"));

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("pj-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  const activeStep = stepData[stepIndex];

  return (
    <>
      <main className="pj-root">
        <header className="pj-nav">
          <a href="#top" className="pj-logo">
            <span className="pj-logo-icon">✏️</span>
            Planejei
            <span className="pj-logo-dot">.</span>
          </a>

          <button type="button" className="pj-menu-btn" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Abrir menu">
            {menuOpen ? "✕" : "☰"}
          </button>

          <nav className={`pj-nav-links ${menuOpen ? "is-open" : ""}`}>
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a>
            <a href="#precos" onClick={() => setMenuOpen(false)}>Preços</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)}>Depoimentos</a>
            <Link href="/login" className="pj-btn pj-btn-purple" onClick={() => setMenuOpen(false)}>Começar grátis 🎉</Link>
          </nav>
        </header>

        <section className="pj-hero" id="top">
          <div className="pj-blob pj-blob-1" />
          <div className="pj-blob pj-blob-2" />
          <div className="pj-blob pj-blob-3" />

          <div>
            <div className="pj-hero-tag pj-reveal">🍎 Para professoras da educação básica</div>
            <h1 className="pj-reveal">
              Planeje <span className="pj-hi">melhor</span>,
              <br />
              registre com
              <br />
              <span className="pj-hi2">carinho</span>.
            </h1>
            <p className="pj-hero-sub pj-reveal">
              O Planejei é o assistente pedagógico que reduz horas de planejamento e transforma observações soltas em relatórios claros. Ele faz o que o sistema da prefeitura nunca fez.
            </p>
            <div className="pj-hero-actions pj-reveal">
              <Link href="/login" className="pj-btn pj-btn-purple">Testar 14 dias grátis ✨</Link>
              <a href="#como-funciona" className="pj-btn pj-btn-ghost">Ver como funciona →</a>
            </div>
            <div className="pj-hero-proof pj-reveal">
              <div className="pj-avatars">
                <span className="pj-av pj-a1">MA</span>
                <span className="pj-av pj-a2">CL</span>
                <span className="pj-av pj-a3">RO</span>
                <span className="pj-av pj-a4">FE</span>
                <span className="pj-av pj-a5">+</span>
              </div>
              <p className="pj-proof-text"><strong>+200 professoras</strong> já usam o Planejei ⭐</p>
            </div>
          </div>

          <div className="pj-hero-right">
            <div className="pj-pill pj-pill-1">📸 Foto registrada!</div>
            <div className="pj-pill pj-pill-2">🌟 7 dias seguidos</div>
            <div className="pj-pill pj-pill-3">📄 PDF gerado!</div>

            <div className="pj-app-frame pj-reveal">
              <div className="pj-app-top">
                <div>
                  <p className="pj-app-greeting">Olá, professora 👋</p>
                  <p className="pj-app-name">Ana Carolina</p>
                </div>
                <span className="pj-app-avatar">🍀</span>
              </div>

              <div className="pj-streak">
                <div className="pj-streak-left">
                  <span>🔥</span>
                  <div>
                    <p className="pj-streak-label">Sequencia ativa!</p>
                    <p className="pj-streak-sub">Continue registrando</p>
                  </div>
                </div>
                <strong>7 dias</strong>
              </div>

              <p className="pj-aluno-label">Aluno em destaque</p>
              <div className="pj-aluno-card">
                <div className="pj-aluno-top">
                  <span className="pj-aluno-avatar">🧒</span>
                  <div>
                    <p className="pj-aluno-name">Luiz Miguel</p>
                    <p className="pj-aluno-role">Infantil 4 - 3 registros hoje</p>
                  </div>
                </div>

                <div className="pj-progress-wrap">
                  <div className="pj-progress-item">
                    <span>Social</span>
                    <div className="pj-progress-track"><div className="pj-fill pj-fill-purple" style={{ width: "82%" }} /></div>
                    <strong>82%</strong>
                  </div>
                  <div className="pj-progress-item">
                    <span>Linguagem</span>
                    <div className="pj-progress-track"><div className="pj-fill pj-fill-peach" style={{ width: "68%" }} /></div>
                    <strong>68%</strong>
                  </div>
                  <div className="pj-progress-item">
                    <span>Motor</span>
                    <div className="pj-progress-track"><div className="pj-fill pj-fill-mint" style={{ width: "74%" }} /></div>
                    <strong>74%</strong>
                  </div>
                </div>
              </div>

              <p className="pj-aluno-label">Últimos registros</p>
              <div className="pj-photo-grid">
                <div className="pj-photo-box pj-photo-a"><span>Atividade em grupo</span></div>
                <div className="pj-photo-box pj-photo-b"><span>Arte livre</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="pj-section pj-features" id="funcionalidades">
          <span className="pj-label pj-reveal">✨ Funcionalidades</span>
          <h2 className="pj-title pj-reveal">Feito para o seu <span>dia a dia</span> real</h2>
          <p className="pj-sub pj-reveal">Simples de usar, bonito de ver, criado pensando em quem abre o app toda manhã.</p>

          <div className="pj-feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className={`pj-feature-card pj-${feature.variant} pj-reveal`}>
                <div className={`pj-feature-icon pj-icon-${feature.variant}`}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pj-section" id="como-funciona">
          <div className="pj-steps-inner">
            <div>
              <span className="pj-label pj-reveal">🗺️ Como funciona</span>
              <h2 className="pj-title pj-reveal">Do registro ao <span>relatório</span> em minutos</h2>
              <p className="pj-sub pj-reveal">Tres passos que cabem na rotina mais corrida do dia.</p>

              <div className="pj-step-list">
                {stepData.map((step, index) => {
                  const isActive = stepIndex === index;

                  return (
                    <button
                      key={step.title}
                      type="button"
                      className={`pj-step-item ${isActive ? "is-on" : ""}`}
                      onClick={() => setStepIndex(index)}
                    >
                      <span className="pj-step-num">{index + 1}</span>
                      <span>
                        <strong>{step.icon} {step.title}</strong>
                        <small>{step.desc}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pj-step-visual pj-reveal">
              <span className="pj-big-num">{activeStep.num}</span>
              <p className="pj-step-icon">{activeStep.icon}</p>
              <h3>{activeStep.title}</h3>
              <p>{activeStep.desc}</p>
              <div className="pj-step-chips">
                {activeStep.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pj-section pj-pricing" id="precos">
          <span className="pj-label pj-reveal">🩵 Preços</span>
          <h2 className="pj-title pj-reveal">Simples como deveria <span>ser</span></h2>
          <p className="pj-sub pj-reveal">Sem contrato longo. Cancele quando quiser. 14 dias grátis para começar.</p>

          <div className="pj-pricing-wrap">
            <article className="pj-price-card pj-reveal">
              <p className="pj-price-plan">Gratuito</p>
              <p className="pj-price-value">R$0</p>
              <p className="pj-price-meta">Para sempre</p>
              <ul>
                <li>Até 4 semanas salvas</li>
                <li>20% do catálogo de projetos</li>
                <li>3 avaliações com IA por mês</li>
                <li>Registro mobile com fotos</li>
              </ul>
              <Link className="pj-btn pj-btn-ghost" href="/login">Criar conta grátis</Link>
            </article>

            <article className="pj-price-card pj-popular pj-reveal">
              <span className="pj-pop-badge">⭐ Mais popular</span>
              <p className="pj-price-plan">Pro</p>
              <p className="pj-price-value">R$9,90</p>
              <p className="pj-price-meta">por mês · menos que um café</p>
              <ul>
                <li>Sem limite de semanas</li>
                <li>100% do catálogo de projetos</li>
                <li>Fotos ilimitadas</li>
                <li>Relatórios com IA + PDF</li>
                <li>Campos BNCC completos</li>
                <li>Templates de plano de aula</li>
                <li>Uso offline completo</li>
                <li>Suporte por WhatsApp</li>
              </ul>
              <Link className="pj-btn pj-btn-purple" href="/login">Começar 14 dias grátis 🎉</Link>
            </article>
          </div>
        </section>

        <section className="pj-section" id="depoimentos">
          <span className="pj-label pj-reveal">💬 Depoimentos</span>
          <h2 className="pj-title pj-reveal">O que dizem as <span>professoras</span></h2>

          <div className="pj-testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className={`pj-testimonial-card pj-t-${testimonial.color} pj-reveal`}>
                <p className="pj-stars">⭐⭐⭐⭐⭐</p>
                <p className="pj-quote">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="pj-author-row">
                  <span className={`pj-author-avatar pj-bg-${testimonial.color}`}>{testimonial.avatar}</span>
                  <span>
                    <strong>{testimonial.name}</strong>
                    <small>{testimonial.role}</small>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pj-cta-wrap pj-reveal">
          <p className="pj-cta-label">✨ Comece hoje</p>
          <h2>Sua prática merece uma ferramenta à sua altura 🩵</h2>
          <p>14 dias grátis. Sem cartão. Cancele quando quiser.</p>
          <div className="pj-cta-actions">
            <Link href="/login" className="pj-btn pj-btn-white">Criar conta gratuita 🎉</Link>
            <a href="#como-funciona" className="pj-btn pj-btn-outline-white">Ver demonstração →</a>
          </div>
        </section>

        <footer className="pj-footer">
          <a href="#top" className="pj-logo">
            <span className="pj-logo-icon">✏️</span>
            Planejei
            <span className="pj-logo-dot">.</span>
          </a>
          <nav>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/login">Entrar</Link>
          </nav>
          <p>© 2026 Planejei · Feito com carinho para educadoras brasileiras</p>
        </footer>
      </main>

      <style jsx global>{`
        .pj-root,
        .pj-root *,
        .pj-root *::before,
        .pj-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .pj-root {
          --purple: #0bb8a8;
          --purple-mid: #4dd4c8;
          --purple-soft: #e0faf8;
          --purple-pale: #f0fdfb;
          --peach: #ff7b5e;
          --peach-soft: #ffede9;
          --yellow: #ffca28;
          --yellow-soft: #fff7dc;
          --mint: #3cc8a0;
          --mint-soft: #e0f9f2;
          --blue: #4cb8f5;
          --blue-soft: #e3f4fd;
          --text: #1e1740;
          --text-mid: #6b6490;
          --text-soft: #a09bc4;
          --white: #ffffff;
          --bg: #fafbff;

          background: var(--bg);
          color: var(--text);
          font-family: var(--font-nunito), "Nunito", sans-serif;
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        .pj-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 3.5rem;
          background: rgba(250, 251, 255, 0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1.5px solid rgba(11, 184, 168, 0.08);
        }

        .pj-logo {
          font-size: 1.55rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: var(--purple);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .pj-logo-dot {
          color: var(--peach);
        }

        .pj-logo-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0bb8a8 0%, #4dd4c8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .pj-nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .pj-menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(11, 184, 168, 0.2);
          background: white;
          color: var(--purple);
          font-size: 1.2rem;
          font-weight: 900;
          cursor: pointer;
        }

        .pj-nav-links a {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-mid);
          text-decoration: none;
          transition: color 0.2s;
        }

        .pj-nav-links a:hover {
          color: var(--purple);
        }

        .pj-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.6rem 1.4rem;
          border-radius: 100px;
          font-size: 0.9rem;
          font-weight: 800;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, background-color 0.2s;
        }

        .pj-btn:hover {
          transform: translateY(-2px);
        }

        .pj-btn-purple {
          background: var(--purple);
          color: white;
          box-shadow: 0 4px 16px rgba(11, 184, 168, 0.35);
        }

        .pj-btn-purple:hover {
          box-shadow: 0 8px 24px rgba(11, 184, 168, 0.45);
        }

        .pj-btn-ghost {
          background: var(--purple-soft);
          color: var(--purple);
          box-shadow: none;
        }

        .pj-btn-white {
          background: white;
          color: var(--purple);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .pj-btn-outline-white {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.6);
        }

        .pj-btn-outline-white:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .pj-hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 7.5rem 3.5rem 4rem;
          gap: 3rem;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .pj-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
          opacity: 0.35;
        }

        .pj-blob-1 {
          width: 500px;
          height: 500px;
          background: var(--purple);
          top: -100px;
          right: -150px;
        }

        .pj-blob-2 {
          width: 350px;
          height: 350px;
          background: var(--peach);
          bottom: 0;
          left: -100px;
          opacity: 0.2;
          filter: blur(80px);
        }

        .pj-blob-3 {
          width: 250px;
          height: 250px;
          background: var(--yellow);
          top: 40%;
          right: 40%;
          opacity: 0.15;
          filter: blur(60px);
        }

        .pj-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--purple-soft);
          color: var(--purple);
          border-radius: 100px;
          padding: 0.4rem 1rem;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          margin-bottom: 1.4rem;
        }

        .pj-hero h1 {
          font-size: clamp(2.6rem, 5vw, 4.8rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--text);
          margin-bottom: 1.4rem;
        }

        .pj-hi {
          color: var(--purple);
        }

        .pj-hi2 {
          color: var(--peach);
        }

        .pj-hero-sub {
          font-size: 1.05rem;
          color: var(--text-mid);
          line-height: 1.75;
          max-width: 460px;
          margin-bottom: 2.2rem;
          font-weight: 600;
        }

        .pj-hero-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .pj-hero-proof {
          margin-top: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pj-avatars {
          display: flex;
        }

        .pj-av {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2.5px solid var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 900;
          color: white;
          margin-left: -8px;
        }

        .pj-av:first-child {
          margin-left: 0;
        }

        .pj-a1 {
          background: var(--purple);
        }

        .pj-a2 {
          background: var(--peach);
        }

        .pj-a3 {
          background: var(--mint);
        }

        .pj-a4 {
          background: var(--blue);
        }

        .pj-a5 {
          background: var(--yellow);
          color: var(--text);
        }

        .pj-proof-text {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-mid);
        }

        .pj-proof-text strong {
          color: var(--purple);
        }

        .pj-hero-right {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .pj-app-frame {
          width: 320px;
          background: var(--white);
          border-radius: 32px;
          padding: 1.5rem;
          box-shadow: 0 24px 72px rgba(11, 184, 168, 0.18), 0 4px 16px rgba(0, 0, 0, 0.06);
          animation: pj-float 5s ease-in-out infinite;
          position: relative;
          z-index: 2;
        }

        @keyframes pj-float {
          0%,
          100% {
            transform: translateY(0) rotate(-1deg);
          }
          50% {
            transform: translateY(-10px) rotate(-1deg);
          }
        }

        .pj-app-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }

        .pj-app-greeting {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-soft);
        }

        .pj-app-name {
          font-size: 1rem;
          font-weight: 900;
          color: var(--text);
        }

        .pj-app-avatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--purple) 0%, var(--blue) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .pj-streak {
          background: var(--purple-pale);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 1.2rem;
        }

        .pj-streak strong {
          color: var(--purple);
          font-size: 1.3rem;
          font-weight: 900;
        }

        .pj-streak-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pj-streak-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--purple);
        }

        .pj-streak-sub {
          font-size: 0.67rem;
          color: var(--text-soft);
          font-weight: 700;
        }

        .pj-aluno-label {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-soft);
          margin-bottom: 0.5rem;
        }

        .pj-aluno-card {
          background: var(--purple-pale);
          border-radius: 18px;
          padding: 1rem;
          margin-bottom: 0.9rem;
        }

        .pj-aluno-top {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.75rem;
        }

        .pj-aluno-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--peach) 0%, var(--yellow) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .pj-aluno-name {
          font-size: 0.9rem;
          font-weight: 900;
          color: var(--text);
        }

        .pj-aluno-role {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-soft);
        }

        .pj-progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .pj-progress-item {
          display: grid;
          grid-template-columns: 72px 1fr 32px;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-mid);
        }

        .pj-progress-item strong {
          text-align: right;
          color: var(--text-soft);
        }

        .pj-progress-track {
          height: 7px;
          background: rgba(11, 184, 168, 0.12);
          border-radius: 100px;
          overflow: hidden;
        }

        .pj-fill {
          height: 100%;
          border-radius: 100px;
        }

        .pj-fill-purple {
          background: linear-gradient(90deg, var(--purple) 0%, var(--purple-mid) 100%);
        }

        .pj-fill-peach {
          background: linear-gradient(90deg, var(--peach) 0%, #ffb09a 100%);
        }

        .pj-fill-mint {
          background: linear-gradient(90deg, var(--mint) 0%, #7ce8cc 100%);
        }

        .pj-photo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .pj-photo-box {
          border-radius: 12px;
          aspect-ratio: 4 / 3;
          position: relative;
        }

        .pj-photo-box span {
          position: absolute;
          bottom: 5px;
          left: 5px;
          background: rgba(30, 23, 64, 0.65);
          color: white;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 100px;
        }

        .pj-photo-a {
          background: radial-gradient(circle at 55% 35%, #4dd4c888 0 26%, transparent 30%),
            linear-gradient(#e0faf8, #d5f7f3);
        }

        .pj-photo-b {
          background: radial-gradient(circle at 40% 40%, #ff7b5e66 0 20%, transparent 24%),
            linear-gradient(#fff0ec, #ffe7de);
        }

        .pj-pill {
          position: absolute;
          background: white;
          border-radius: 18px;
          padding: 0.65rem 1rem;
          box-shadow: 0 8px 28px rgba(11, 184, 168, 0.16);
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text);
          z-index: 3;
          animation: pj-float-pill 4s ease-in-out infinite;
        }

        @keyframes pj-float-pill {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        .pj-pill-1 {
          top: 20px;
          left: -60px;
          animation-delay: -1.5s;
        }

        .pj-pill-2 {
          bottom: 80px;
          right: -55px;
          animation-delay: -0.5s;
        }

        .pj-pill-3 {
          top: 180px;
          right: -65px;
          animation-delay: -2.5s;
        }

        .pj-section {
          padding: 5.5rem 3.5rem;
        }

        .pj-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--purple);
          background: var(--purple-soft);
          padding: 0.3rem 0.9rem;
          border-radius: 100px;
          margin-bottom: 0.9rem;
        }

        .pj-title {
          font-size: clamp(1.9rem, 3.5vw, 3rem);
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -0.025em;
          color: var(--text);
          max-width: 560px;
          margin-bottom: 1rem;
        }

        .pj-title span {
          color: var(--purple);
        }

        .pj-sub {
          font-size: 1rem;
          color: var(--text-mid);
          line-height: 1.75;
          max-width: 520px;
          font-weight: 600;
        }

        .pj-features {
          background: linear-gradient(160deg, #e0faf8 0%, #fff5f2 50%, #edfff8 100%);
        }

        .pj-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 3rem;
        }

        .pj-feature-card {
          background: white;
          border-radius: 24px;
          padding: 1.75rem;
          border: 1.5px solid rgba(11, 184, 168, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }

        .pj-feature-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 24px 24px 0 0;
        }

        .pj-feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 48px rgba(11, 184, 168, 0.12);
        }

        .pj-purple::before {
          background: var(--purple);
        }

        .pj-peach::before {
          background: var(--peach);
        }

        .pj-mint::before {
          background: var(--mint);
        }

        .pj-yellow::before {
          background: var(--yellow);
        }

        .pj-blue::before {
          background: var(--blue);
        }

        .pj-pink::before {
          background: #f472b6;
        }

        .pj-feature-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1.1rem;
        }

        .pj-icon-purple {
          background: var(--purple-soft);
        }

        .pj-icon-peach {
          background: var(--peach-soft);
        }

        .pj-icon-mint {
          background: var(--mint-soft);
        }

        .pj-icon-yellow {
          background: var(--yellow-soft);
        }

        .pj-icon-blue {
          background: var(--blue-soft);
        }

        .pj-icon-pink {
          background: #fdf2f8;
        }

        .pj-feature-card h3 {
          font-size: 1rem;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 0.5rem;
        }

        .pj-feature-card p {
          font-size: 0.88rem;
          color: var(--text-mid);
          line-height: 1.65;
          font-weight: 600;
        }

        .pj-steps-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: start;
        }

        .pj-step-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .pj-step-item {
          width: 100%;
          display: flex;
          gap: 1.2rem;
          align-items: flex-start;
          padding: 1.1rem 1.2rem;
          border-radius: 18px;
          cursor: pointer;
          transition: background 0.2s;
          border: 0;
          background: transparent;
          text-align: left;
        }

        .pj-step-item:hover {
          background: var(--purple-pale);
        }

        .pj-step-item.is-on {
          background: var(--purple-pale);
        }

        .pj-step-num {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 900;
          background: var(--purple-soft);
          color: var(--purple);
        }

        .pj-step-item.is-on .pj-step-num {
          background: var(--purple);
          color: white;
        }

        .pj-step-item strong {
          display: block;
          font-size: 0.95rem;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 0.2rem;
        }

        .pj-step-item small {
          display: block;
          font-size: 0.82rem;
          color: var(--text-soft);
          font-weight: 600;
          line-height: 1.55;
        }

        .pj-step-item.is-on strong {
          color: var(--purple);
        }

        .pj-step-item.is-on small {
          color: var(--text-mid);
        }

        .pj-step-visual {
          background: linear-gradient(145deg, var(--purple-soft) 0%, var(--peach-soft) 100%);
          border-radius: 28px;
          padding: 2.5rem 2rem;
          min-height: 360px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
          margin-top: 2rem;
        }

        .pj-big-num {
          position: absolute;
          bottom: -20px;
          right: 10px;
          font-size: 11rem;
          font-weight: 900;
          color: rgba(11, 184, 168, 0.07);
          line-height: 1;
          pointer-events: none;
        }

        .pj-step-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .pj-step-visual h3 {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 0.6rem;
          letter-spacing: -0.02em;
        }

        .pj-step-visual p {
          font-size: 0.9rem;
          color: var(--text-mid);
          line-height: 1.65;
          font-weight: 600;
          max-width: 280px;
          margin-bottom: 1.3rem;
        }

        .pj-step-chips {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .pj-step-chips span {
          background: white;
          border-radius: 100px;
          padding: 0.35rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-mid);
          border: 1.5px solid rgba(11, 184, 168, 0.12);
        }

        .pj-pricing {
          background: linear-gradient(170deg, #f0fdfb 0%, #fff5f2 100%);
          text-align: center;
        }

        .pj-pricing .pj-title,
        .pj-pricing .pj-sub {
          margin-left: auto;
          margin-right: auto;
        }

        .pj-pricing-wrap {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          max-width: 800px;
          margin: 3rem auto 0;
        }

        .pj-price-card {
          background: white;
          border-radius: 28px;
          padding: 2.25rem;
          flex: 1;
          min-width: 240px;
          max-width: 320px;
          border: 2px solid transparent;
          text-align: left;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .pj-price-card:hover {
          transform: translateY(-6px);
        }

        .pj-popular {
          border-color: var(--purple);
          box-shadow: 0 16px 60px rgba(11, 184, 168, 0.2);
        }

        .pj-pop-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--purple);
          color: white;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 0.3rem 1rem;
          border-radius: 100px;
          white-space: nowrap;
        }

        .pj-price-plan {
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-soft);
          margin-bottom: 0.5rem;
        }

        .pj-price-value {
          font-size: 3rem;
          font-weight: 900;
          color: var(--text);
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.3rem;
        }

        .pj-popular .pj-price-value {
          color: var(--purple);
        }

        .pj-price-meta {
          font-size: 0.82rem;
          color: var(--text-soft);
          font-weight: 700;
          margin-bottom: 1.4rem;
        }

        .pj-price-card ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1.75rem;
        }

        .pj-price-card li {
          font-size: 0.88rem;
          color: var(--text-mid);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .pj-price-card li::before {
          content: "";
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--purple-soft);
          flex-shrink: 0;
        }

        .pj-testimonial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .pj-testimonial-card {
          border-radius: 24px;
          padding: 1.5rem;
          border: 1.5px solid rgba(11, 184, 168, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .pj-testimonial-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(11, 184, 168, 0.09);
        }

        .pj-t-purple {
          background: var(--purple-pale);
        }

        .pj-t-peach {
          background: var(--peach-soft);
        }

        .pj-t-mint {
          background: var(--mint-soft);
        }

        .pj-stars {
          margin-bottom: 0.75rem;
        }

        .pj-quote {
          font-size: 0.9rem;
          color: var(--text-mid);
          line-height: 1.7;
          font-style: italic;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }

        .pj-author-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .pj-author-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 900;
          color: white;
          flex-shrink: 0;
        }

        .pj-bg-purple {
          background: var(--purple);
        }

        .pj-bg-peach {
          background: var(--peach);
        }

        .pj-bg-mint {
          background: var(--mint);
        }

        .pj-author-row strong {
          display: block;
          font-size: 0.85rem;
          font-weight: 900;
          color: var(--text);
        }

        .pj-author-row small {
          display: block;
          font-size: 0.73rem;
          color: var(--text-soft);
          font-weight: 700;
        }

        .pj-cta-wrap {
          background: var(--purple);
          border-radius: 32px;
          padding: 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin: 0 3.5rem 5.5rem;
        }

        .pj-cta-wrap::before {
          content: "";
          position: absolute;
          top: -100px;
          right: -100px;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.07);
        }

        .pj-cta-wrap::after {
          content: "";
          position: absolute;
          bottom: -120px;
          left: -50px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.06);
        }

        .pj-cta-label {
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 0.75rem;
        }

        .pj-cta-wrap h2 {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 900;
          color: white;
          letter-spacing: -0.025em;
          line-height: 1.15;
          max-width: 540px;
          margin: 0 auto 0.75rem;
          position: relative;
          z-index: 1;
        }

        .pj-cta-wrap p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }

        .pj-cta-actions {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .pj-footer {
          background: var(--text);
          color: rgba(255, 255, 255, 0.55);
          padding: 2.75rem 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .pj-footer .pj-logo {
          color: white;
        }

        .pj-footer nav {
          display: flex;
          gap: 2rem;
        }

        .pj-footer nav a {
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;
          transition: color 0.2s;
        }

        .pj-footer nav a:hover {
          color: white;
        }

        .pj-footer p {
          font-size: 0.8rem;
          font-weight: 700;
        }

        .pj-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }

        .pj-reveal.pj-in {
          opacity: 1;
          transform: none;
        }

        @media (max-width: 980px) {
          .pj-feature-grid,
          .pj-testimonial-grid,
          .pj-steps-inner {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .pj-step-visual {
            margin-top: 0;
          }
        }

        @media (max-width: 860px) {
          .pj-nav {
            padding: 1rem 1.25rem;
          }

          .pj-menu-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .pj-nav-links {
            display: none;
            position: absolute;
            top: 64px;
            right: 1.25rem;
            left: 1.25rem;
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            border-radius: 16px;
            border: 1px solid rgba(11, 184, 168, 0.16);
            background: rgba(255, 255, 255, 0.98);
            padding: 1rem;
            box-shadow: 0 18px 44px -30px rgba(16, 37, 59, 0.42);
          }

          .pj-nav-links.is-open {
            display: flex;
          }

          .pj-nav-links a {
            font-size: 0.9rem;
          }

          .pj-hero {
            grid-template-columns: 1fr;
            padding: 7rem 1.25rem 3rem;
          }

          .pj-hero-right {
            display: none;
          }

          .pj-section {
            padding: 4rem 1.25rem;
          }

          .pj-cta-wrap {
            margin: 0 1.25rem 4rem;
            padding: 2.5rem 1.5rem;
          }

          .pj-footer {
            flex-direction: column;
            text-align: center;
            padding: 2rem 1.25rem;
          }

          .pj-footer nav {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
