import Link from "next/link";

const features = [
  {
    icon: "📜",
    title: "Criador de Ficha",
    desc: "Distribua atributos, escolha raça e classe, e veja Vida, Sanidade e Entropia se ajustarem a cada decisão.",
    href: "/ficha/nova",
    accent: "from-mente-deep to-mente",
  },
  {
    icon: "🎲",
    title: "Mesa com Dados ao Vivo",
    desc: "Role d100 já com a vantagem ou desvantagem do rank aplicada. Sem conta na mão, sem discussão.",
    href: "/mesa",
    accent: "from-alma-deep to-alma",
  },
  {
    icon: "👁️",
    title: "Painel do Mestre",
    desc: "As fichas de toda a campanha em uma tela só — status, ranks e pendências à vista.",
    href: "/mestre",
    accent: "from-sol-deep to-sol",
  },
  {
    icon: "🔮",
    title: "Oráculo da Entropia",
    desc: "Um assistente que aponta o que está fora das regras e sugere como equilibrar a ficha. De graça.",
    href: "/ficha/nova",
    accent: "from-corpo-deep to-corpo",
  },
];

const spectra = [
  { label: "Mente", sub: "Magia · Antimagia · Thaumofagia", color: "text-mente-soft", ring: "ring-mente" },
  { label: "Corpo", sub: "Sóma · Eusōmía · Andróphia", color: "text-corpo-soft", ring: "ring-corpo" },
  { label: "Alma", sub: "Epithymía · Kanone · Anaki", color: "text-alma-soft", ring: "ring-alma" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 glass-panel px-6 py-16 text-center sm:px-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-mente/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 text-[10rem] opacity-10 animate-floaty select-none">
          🎲
        </div>
        <div className="pointer-events-none absolute -left-6 top-10 text-7xl opacity-10 animate-floaty select-none">
          ✦
        </div>
        <div className="relative">
          <span className="chip mx-auto mb-6 border-sol/30 text-sol-soft animate-pulseGlow">
            ✦ Sistema Solando 4.0 · vivo e caótico
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            <span className="title-gradient">A Entropia responde</span>
            <br />
            a quem ousa controlá-la.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Fichas que se equilibram sozinhas, dados que rolam na frente da mesa e um
            manual sempre à mão. Crie um personagem em minutos — mesmo sem nunca ter
            lido as regras — e deixe o Oráculo cuidar do balanceamento.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/ficha/nova" className="btn-primary text-base">
              Começar minha ficha ✦
            </Link>
            <Link href="/manual" className="btn-ghost text-base">
              Folhear o manual 📖
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="chip">🎲 d100 com vantagem por rank</span>
            <span className="chip">🔮 balanceamento automático</span>
            <span className="chip">👑 modo mestre</span>
            <span className="chip">🧬 crie raças e classes</span>
          </div>
        </div>
      </section>

      {/* Espectros de Entropia */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-zinc-200">
          Os Três Espectros da Entropia
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {spectra.map((s) => (
            <div
              key={s.label}
              className={`card-glow flex flex-col items-center p-6 text-center ring-1 ${s.ring}/30`}
            >
              <span className={`text-3xl font-black ${s.color} animate-floaty`}>
                {s.label}
              </span>
              <p className="mt-2 text-sm text-zinc-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-zinc-200">
          Tudo que sua mesa precisa
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="card-glow group flex items-start gap-4 p-6"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${f.accent} text-2xl shadow-lg transition group-hover:scale-110`}
              >
                {f.icon}
              </span>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{f.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
        Projeto Solando · Um sistema vivo, que muda com a mesa · Feito para jogar.
      </footer>
    </div>
  );
}
