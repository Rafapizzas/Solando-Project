/**
 * DevSignature — assinatura sutil do desenvolvedor, fixa no rodapé.
 * O kanji 匠 (takumi, "artesão/mestre") aparece como marca-d'água ATRÁS do
 * lettering "Rafa Pizzas", criando identidade sem virar uma frase legível.
 * A barra escura permanece sempre no fim da página.
 */
export function DevSignature() {
  return (
    <footer className="mt-10">
      <div className="relative mx-auto flex max-w-6xl items-center justify-center overflow-hidden rounded-xl bg-black/80 px-4 py-3">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-ink text-5xl leading-none text-white/[0.06]"
        >
          匠
        </span>
        <span className="relative font-ink text-lg font-semibold tracking-wide text-[#7c3aed]">
          Rafa Pizzas
        </span>
      </div>
    </footer>
  );
}
