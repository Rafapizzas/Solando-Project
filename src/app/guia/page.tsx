"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Guia — passo a passo visual e simples de como usar o Solando, pensado para
 * quem tem pouca familiaridade com internet. Cada passo tem um "print" ilustrado
 * (mockup) e instruções curtas.
 */

interface Step {
  n: number;
  title: string;
  desc: string;
  href?: string;
  cta?: string;
  mock: React.ReactNode;
}

function Frame({ children, tint = "#a855f7" }: { children: React.ReactNode; tint?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10 p-4"
      style={{ background: `linear-gradient(145deg, ${tint}18, #0b0a17)` }}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      </div>
      {children}
    </div>
  );
}

const STEPS: Step[] = [
  {
    n: 1,
    title: "Entre na sua conta",
    desc: "Clique em “Entrar” no canto superior direito. Você pode usar sua conta Google com um clique — rápido e seguro.",
    href: "/entrar",
    cta: "Ir para o login",
    mock: (
      <Frame tint="#22d3ee">
        <div className="space-y-2">
          <div className="h-8 rounded-lg bg-white/10" />
          <div className="h-8 rounded-lg bg-white/10" />
          <div className="rounded-lg bg-gradient-to-r from-mente to-mente-soft py-2 text-center text-sm font-semibold text-white">
            Entrar com Google
          </div>
        </div>
      </Frame>
    ),
  },
  {
    n: 2,
    title: "Ajuste sua conta e amigos",
    desc: "Em “Editar conta” você define seu nome, foto e código de amigo. Use o código para adicionar pessoas em “Amigos” e ver quem está online. Você pode ser mestre ou jogador em cada mesa — sem trocar de perfil.",
    href: "/conta",
    cta: "Editar conta",
    mock: (
      <Frame tint="#facc15">
        <div className="flex items-center justify-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-mente/30 text-2xl">
            🧙
          </div>
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-white/15" />
            <div className="rounded bg-sol/20 px-2 py-0.5 text-center font-mono text-xs tracking-widest text-sol-soft">
              A1B2C3D4
            </div>
          </div>
        </div>
      </Frame>
    ),
  },
  {
    n: 3,
    title: "Crie sua ficha",
    desc: "Em “Fichas”, clique em “+ Nova ficha”. Escolha raça e classe, distribua os atributos e veja Vida, Sanidade e Entropia se ajustarem sozinhas.",
    href: "/ficha/nova",
    cta: "Criar ficha",
    mock: (
      <Frame tint="#a855f7">
        <div className="space-y-2">
          <div className="h-6 w-2/3 rounded bg-white/10" />
          <div className="grid grid-cols-4 gap-2">
            {["FOR", "CON", "AGI", "MEN"].map((a) => (
              <div key={a} className="rounded-lg bg-void-900/70 p-2 text-center">
                <div className="text-sm font-bold text-zinc-100">50</div>
                <div className="text-[9px] text-zinc-500">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </Frame>
    ),
  },
  {
    n: 4,
    title: "Peça ajuda ao Arquimago (IA)",
    desc: "Não sabe uma regra? Vá em “Arquimago” e pergunte em português comum. Ele responde baseado no manual oficial, sem inventar.",
    href: "/arquimago",
    cta: "Abrir o Arquimago",
    mock: (
      <Frame tint="#22d3ee">
        <div className="space-y-2 text-xs">
          <div className="ml-auto w-3/4 rounded-lg bg-mente/20 p-2 text-zinc-100">
            Como calculo a Vida?
          </div>
          <div className="w-3/4 rounded-lg bg-alma/10 p-2 text-alma-soft">
            Vida = Constituição × 10. 🧙‍♂️
          </div>
        </div>
      </Frame>
    ),
  },
  {
    n: 5,
    title: "Jogue na mesa com dados ao vivo",
    desc: "Entre em uma “Mesa”, escolha seu personagem e role os dados. Acertos e falhas críticas têm som e animação para todos verem!",
    href: "/mesa",
    cta: "Ir para as mesas",
    mock: (
      <Frame tint="#f43f5e">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">🎲 Rolagem</span>
          <span className="font-ink text-2xl font-black text-sol">CRÍTICO!</span>
        </div>
      </Frame>
    ),
  },
  {
    n: 6,
    title: "Exporte seu card de anime",
    desc: "Na visualização da ficha, toque em “Exportar PNG” e baixe uma carta ilustrada do seu personagem para compartilhar.",
    href: "/ficha",
    cta: "Ver minhas fichas",
    mock: (
      <Frame tint="#34d399">
        <div className="mx-auto w-28 rounded-lg border border-white/10 bg-void-900/70 p-2">
          <div className="h-10 rounded bg-gradient-to-br from-mente to-sol" />
          <div className="mt-1 h-2 w-2/3 rounded bg-white/20" />
          <div className="mt-1 h-2 w-1/2 rounded bg-white/10" />
        </div>
      </Frame>
    ),
  },
];

export default function GuiaPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="manga-title text-3xl font-black title-gradient">
          Guia — Como usar o Solando
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-zinc-400">
          Um passo a passo simples e ilustrado. Feito para todo mundo conseguir usar,
          mesmo sem experiência com sites.
        </p>
      </div>

      <div className="space-y-6">
        {STEPS.map((s) => (
          <motion.section
            key={s.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="card ink-panel grid items-center gap-5 p-6 md:grid-cols-2"
          >
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-mente-deep to-mente font-black text-white">
                  {s.n}
                </span>
                <h2 className="font-display text-xl font-bold text-zinc-100">{s.title}</h2>
              </div>
              <p className="text-zinc-400">{s.desc}</p>
              {s.href && (
                <Link href={s.href} className="btn-primary mt-4 inline-block text-sm">
                  {s.cta}
                </Link>
              )}
            </div>
            <div className={s.n % 2 === 0 ? "md:order-first" : ""}>{s.mock}</div>
          </motion.section>
        ))}
      </div>

      <div className="card grid place-items-center gap-3 py-10 text-center">
        <span className="text-4xl">🎉</span>
        <p className="text-zinc-300">Pronto! Agora é só jogar e se divertir.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/ficha/nova" className="btn-primary text-sm">
            Criar minha ficha
          </Link>
          <Link href="/arquimago" className="btn-ghost text-sm">
            Tirar dúvidas com a IA
          </Link>
        </div>
      </div>
    </div>
  );
}
