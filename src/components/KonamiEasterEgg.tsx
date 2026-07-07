"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * KonamiEasterEgg — ouve o código Konami (↑↑↓↓←→←→ B A) em qualquer página e
 * dispara uma chuva de kanji/estrelas com uma faixa estilo mangá. Puro deleite.
 */

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const GLYPHS = ["✦", "力", "魂", "気", "⚡", "★", "龍", "光", "✧", "剣", "魔", "☄"];

export function KonamiEasterEgg() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let index = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[index]) {
        index += 1;
        if (index === SEQUENCE.length) {
          index = 0;
          setActive(true);
          window.setTimeout(() => setActive(false), 3200);
        }
      } else {
        // Reinicia (permitindo recomeçar se a tecla for o 1º passo)
        index = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const drops = active
    ? Array.from({ length: 28 }, (_, i) => ({
        id: i,
        glyph: GLYPHS[i % GLYPHS.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 1.6 + Math.random() * 1.4,
        size: 22 + Math.random() * 40,
        rot: (Math.random() - 0.5) * 120,
      }))
    : [];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[75] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {drops.map((d) => (
            <motion.span
              key={d.id}
              className="font-ink absolute top-[-10%] select-none text-mente-soft drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]"
              style={{ left: `${d.left}%`, fontSize: d.size }}
              initial={{ y: "-10vh", opacity: 0, rotate: 0 }}
              animate={{ y: "115vh", opacity: [0, 1, 1, 0], rotate: d.rot }}
              transition={{ duration: d.dur, delay: d.delay, ease: "easeIn" }}
            >
              {d.glyph}
            </motion.span>
          ))}

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -3, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <div className="vn-box font-display px-8 py-5 text-center">
              <p className="title-gradient text-3xl font-black tracking-widest">
                MODO SOLADOR ATIVADO
              </p>
              <p className="mt-1 font-ink text-lg text-sol-soft">
                力 O poder ancestral desperta… 魂
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
