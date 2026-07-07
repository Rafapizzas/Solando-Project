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
        <div className="sig-shine relative mx-auto flex max-w-6xl flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-white/10 bg-black/80 px-4 py-9">
          {/* Textura de meio-tom (mangá) */}
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.06]" />
          <span className="relative text-[10px] uppercase tracking-[0.4em] text-zinc-500">
            Desenvolvido por
          </span>
          {/* Assinatura = kanji 卍解 (Bankai) ATRÁS + lettering "Rafa Pizzas" na frente */}
          <div className="relative flex items-center justify-center">
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-ink text-7xl leading-none text-[#7c3aed] drop-shadow-[0_0_28px_rgba(124,58,237,0.55)] sm:text-8xl"
              animate={{ opacity: [0.22, 0.4, 0.22], scale: [1, 1.04, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              卍解
            </motion.span>
            <span className="relative font-ink text-3xl font-semibold tracking-wide text-[#a985ff] drop-shadow-[0_0_14px_rgba(124,58,237,0.6)] sm:text-4xl">
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
