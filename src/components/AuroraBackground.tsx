"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * AuroraBackground — plano de fundo animado do universo Solando: névoas de
 * entropia pulsando, estrelas e runas flutuantes. Puramente decorativo.
 */

const RUNES = ["✦", "✧", "⟡", "◈", "✵", "❖", "⬡", "✶", "☄", "✷", "✸", "⚝"];
// Kanjis temáticos (genéricos, sem marcas registradas): força, alma, ki, ilusão,
// trevas, luz, dragão, estrela, espada, magia, entropia/caos, espírito.
const KANJI = ["力", "魂", "気", "幻", "闇", "光", "龍", "星", "剣", "魔", "混沌", "精"];

export function AuroraBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: 2 + Math.random() * 3,
      })),
    [],
  );

  const runes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        glyph: RUNES[i % RUNES.length],
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 14 + Math.random() * 26,
        delay: Math.random() * 6,
        dur: 8 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 40,
      })),
    [],
  );

  const kanji = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        glyph: KANJI[i % KANJI.length],
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 40 + Math.random() * 70,
        delay: Math.random() * 8,
        dur: 16 + Math.random() * 14,
        drift: (Math.random() - 0.5) * 24,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Névoas de entropia */}
      <motion.div
        className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-mente/20 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 top-1/3 h-[38rem] w-[38rem] rounded-full bg-alma/15 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[34rem] w-[34rem] rounded-full bg-sol/15 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Estrelas cintilantes */}
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Runas flutuantes */}
      {runes.map((r) => (
        <motion.span
          key={r.id}
          className="absolute select-none font-display text-mente-soft/25"
          style={{ top: `${r.top}%`, left: `${r.left}%`, fontSize: r.size }}
          animate={{ y: [0, -24, 0], x: [0, r.drift, 0], opacity: [0.1, 0.35, 0.1], rotate: [0, 15, 0] }}
          transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {r.glyph}
        </motion.span>
      ))}

      {/* Kanjis temáticos (easter egg de ambientação) */}
      {kanji.map((k) => (
        <motion.span
          key={`k-${k.id}`}
          className="font-ink absolute select-none text-white/[0.04]"
          style={{ top: `${k.top}%`, left: `${k.left}%`, fontSize: k.size }}
          animate={{ y: [0, -18, 0], x: [0, k.drift, 0], opacity: [0.02, 0.06, 0.02] }}
          transition={{ duration: k.dur, delay: k.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {k.glyph}
        </motion.span>
      ))}
    </div>
  );
}
