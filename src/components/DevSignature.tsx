/**
 * DevSignature — assinatura do desenvolvedor no rodapé.
 * Fundo preto com o kanji 卍解 (Bankai) como marca-d'água em tinta, e o nome
 * "Rafa Pizzas" em roxo destacado, com fonte estilo pincel japonês (Zen Kurenaido).
 */
export function DevSignature() {
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="relative mx-auto flex max-w-6xl items-center justify-center overflow-hidden rounded-2xl bg-black px-6 py-10">
        {/* Kanji BANKAI como marca-d'água em tinta */}
        <span
          aria-hidden
          className="font-ink pointer-events-none absolute inset-0 grid select-none place-items-center text-[7rem] leading-none text-white/[0.06] sm:text-[10rem]"
        >
          卍解
        </span>
        {/* Traços de tinta (halftone/ink) sutis */}
        <span aria-hidden className="halftone pointer-events-none absolute inset-0 opacity-[0.04]" />

        <div className="relative flex flex-col items-center gap-1 text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
            Desenvolvido por
          </span>
          <span className="font-ink text-4xl font-bold text-mente-soft drop-shadow-[0_0_18px_rgba(168,85,247,0.55)] sm:text-5xl">
            Rafa Pizzas
          </span>
          <span className="font-ink text-lg text-white/70">卍解</span>
        </div>
      </div>
    </footer>
  );
}
