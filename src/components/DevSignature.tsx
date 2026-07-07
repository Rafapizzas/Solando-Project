/**
 * DevSignature — assinatura sutil do desenvolvedor no rodapé.
 * Fundo preto discreto, kanji 卍解 (Bankai) pequeno em tinta e o nome
 * "Rafa Pizzas" em roxo escuro. Ocupa pouco espaço (uma linha).
 */
export function DevSignature() {
  return (
    <footer className="mt-10">
      <div className="relative mx-auto flex max-w-6xl items-center justify-center gap-2.5 rounded-xl bg-black/80 px-4 py-2.5">
        <span aria-hidden className="font-ink text-sm text-white/25">
          卍解
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">
          por
        </span>
        <span className="font-ink text-base font-semibold text-[#7c3aed]">
          Rafa Pizzas
        </span>
      </div>
    </footer>
  );
}
