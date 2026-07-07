/**
 * loading.tsx — Estado de carregamento global (Suspense do App Router).
 * Selo giratório temático do Solando.
 */
export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-mente border-r-alma [animation-duration:1.1s]" />
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-sol [animation-duration:1.6s] [animation-direction:reverse]" />
          <span className="absolute inset-0 grid place-items-center text-xl">✦</span>
        </div>
        <span className="font-ink text-sm tracking-widest text-zinc-500">
          invocando…
        </span>
      </div>
    </div>
  );
}
