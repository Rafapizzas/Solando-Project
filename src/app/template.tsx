"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * template.tsx — Transição de página (App Router remonta o template a cada
 * navegação). Combina a entrada suave do conteúdo com um "wipe" estilo painel
 * de mangá (com speed lines e uma borda de luz) que varre a tela a cada troca
 * de menu. Respeita `prefers-reduced-motion`.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      >
        {children}
      </motion.div>

      {/* Wipe de "virada de página" de mangá */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
        initial={{ clipPath: "inset(0 0 0 0)" }}
        animate={{ clipPath: "inset(0 0 0 100%)" }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-void-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "repeating-linear-gradient(115deg, transparent 0 10px, rgba(168,85,247,0.16) 10px 11px)",
          }}
        />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-mente/50 via-sol/20 to-transparent" />
      </motion.div>
    </>
  );
}
