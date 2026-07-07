"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * OpeningSplash — abertura estilo "cold open" de anime: aparece uma vez por
 * sessão (sessionStorage) com o logo, depois some. Respeita reduced-motion.
 */
export function OpeningSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("solando:opened") === "1") return;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        sessionStorage.setItem("solando:opened", "1");
        return;
      }
      setShow(true);
      sessionStorage.setItem("solando:opened", "1");
      const t = window.setTimeout(() => setShow(false), 1900);
      return () => window.clearTimeout(t);
    } catch {
      /* ignora */
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-void-950"
          onClick={() => setShow(false)}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "repeating-conic-gradient(from 0deg at 50% 50%, rgba(168,85,247,0.25) 0deg 1.4deg, transparent 1.4deg 7deg)",
              maskImage: "radial-gradient(circle, transparent 20%, black 70%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 20%, black 70%)",
            }}
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative flex flex-col items-center gap-3"
          >
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-mente-deep via-mente to-sol text-4xl font-black text-white shadow-glow">
              ✦
            </span>
            <span className="font-display text-4xl font-black tracking-[0.3em] title-gradient">
              SOLANDO
            </span>
            <span className="font-ink text-lg text-white/50">連結の書</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
