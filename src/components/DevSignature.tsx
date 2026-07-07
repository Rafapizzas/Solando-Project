"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * DevSignature — assinatura do desenvolvedor.
 *
 * - Na HOME (`/`): barrinha em destaque com o kanji 卍解 (Bankai) como marca-
 *   d'água ATRÁS do lettering "Rafa Pizzas", com textura (halftone), brilho que
 *   varre a barra e uma pulsação sutil.
 * - Nas demais páginas: vira um easter egg discreto no rodapé (só o nome, bem
 *   apagado, que acende ao passar o mouse).
 */
export function DevSignature() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <footer className="mt-12">
        <div className="sig-shine relative mx-auto flex max-w-6xl items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/80 px-4 py-4">
          {/* Textura de meio-tom (mangá) */}
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.06]" />
          {/* Kanji 卍解 (Bankai) como marca-d'água animada atrás do nome */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-ink text-6xl leading-none text-white/[0.07]"
            animate={{ opacity: [0.05, 0.11, 0.05], scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            卍解
          </motion.span>
          <div className="relative flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">
              Solando
            </span>
            <span className="font-ink text-2xl font-semibold tracking-wide text-[#8b5cf6] drop-shadow-[0_0_10px_rgba(124,58,237,0.35)]">
              Rafa Pizzas
            </span>
          </div>
        </div>
      </footer>
    );
  }

  // Easter egg discreto nas demais páginas.
  return (
    <footer className="mt-10 pb-2 text-center">
      <span
        className="group inline-flex select-none items-center gap-1.5 text-[11px] text-white/15 transition hover:text-[#8b5cf6]"
        title="卍解 — feito por Rafa Pizzas"
      >
        <span aria-hidden className="font-ink opacity-0 transition group-hover:opacity-60">
          卍解
        </span>
        <span className="font-ink tracking-wide">Rafa Pizzas</span>
      </span>
    </footer>
  );
}
