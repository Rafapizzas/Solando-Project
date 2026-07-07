"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export interface AnimeCardData {
  name: string;
  race: string;
  charClass: string;
  level: number;
  rank: string;
  avatarUrl?: string;
  accent: string;
  vida: number;
  sanidade: number;
  entropia: number;
  attrs: Array<{ short: string; value: number }>;
  topSkills: string[];
}

/**
 * AnimeCardExport — renderiza um card estilizado (estilo carta de anime/TCG) e
 * o exporta como PNG. Usa html-to-image para rasterizar o DOM. O card fica
 * visível como preview e o botão faz o download em alta resolução.
 */
export function AnimeCardExport({ data }: { data: AnimeCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function download() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        // Evita quebra por imagens externas sem CORS: se falhar, ainda gera o resto.
        skipFonts: false,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(data.name || "ficha").replace(/\s+/g, "-").toLowerCase()}-solando.png`;
      a.click();
    } catch {
      setErr("Não foi possível exportar (a imagem do avatar pode bloquear por CORS). Tente sem avatar externo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card ink-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-200">Card de Anime</h2>
          <p className="text-xs text-zinc-500">Exporte sua ficha como uma carta ilustrada.</p>
        </div>
        <button onClick={download} disabled={busy} className="btn-sol !px-4 text-sm disabled:opacity-50">
          {busy ? "Gerando…" : "⬇️ Exportar PNG"}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-sol-soft">{err}</p>}

      <div className="mt-4 flex justify-center overflow-x-auto">
        {/* O card exportado */}
        <div
          ref={cardRef}
          className="relative w-[340px] shrink-0 overflow-hidden rounded-2xl p-[3px]"
          style={{
            background: `linear-gradient(145deg, ${data.accent}, #0b0a17 60%, ${data.accent})`,
          }}
        >
          <div className="relative overflow-hidden rounded-[14px] bg-void-950">
            {/* Kanji marca-d'água */}
            <span
              aria-hidden
              className="font-ink pointer-events-none absolute -right-2 top-6 select-none text-[7rem] leading-none text-white/[0.05]"
            >
              魂
            </span>

            {/* Cabeçalho */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: `linear-gradient(90deg, ${data.accent}33, transparent)` }}
            >
              <div
                className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl text-2xl font-black text-void-950"
                style={{ background: data.accent }}
              >
                {data.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" crossOrigin="anonymous" />
                ) : (
                  (data.name.charAt(0) || "?").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-xl font-black text-white">
                  {data.name || "Sem nome"}
                </div>
                <div className="truncate text-xs text-zinc-400">
                  {[data.race, data.charClass].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-ink text-2xl font-black" style={{ color: data.accent }}>
                  {data.rank}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">Nv {data.level}</div>
              </div>
            </div>

            {/* Barras */}
            <div className="grid grid-cols-3 gap-2 px-4 pt-3">
              {[
                { label: "Vida", value: data.vida, color: "#ef4444" },
                { label: "Sanidade", value: data.sanidade, color: "#a855f7" },
                { label: "Entropia", value: data.entropia, color: "#22d3ee" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-void-900/80 p-2 text-center">
                  <div className="text-lg font-black" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-[9px] uppercase tracking-wide text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Atributos */}
            <div className="grid grid-cols-4 gap-1.5 px-4 pt-3">
              {data.attrs.map((a) => (
                <div key={a.short} className="rounded-md bg-void-900/60 py-1.5 text-center">
                  <div className="text-sm font-bold text-zinc-100">{a.value}</div>
                  <div className="text-[8px] uppercase tracking-wide text-zinc-500">{a.short}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="px-4 pb-4 pt-3">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-zinc-500">Skills</div>
              <div className="flex flex-wrap gap-1">
                {data.topSkills.length ? (
                  data.topSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-600">—</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                <span className="font-display text-[10px] font-bold tracking-[0.3em] text-zinc-500">
                  SOLANDO
                </span>
                <span className="font-ink text-xs text-white/40">卍解</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
