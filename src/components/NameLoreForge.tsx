"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Gerador de Nomes & Lore (IA) — sugere nomes evocativos e um mini-lore de
 * origem a partir da raça e de um conceito. Clicar num nome aplica na ficha;
 * o lore pode ser anexado às anotações. Degrada sem a chave da IA.
 */
export function NameLoreForge({
  raceName,
  onPickName,
  onLore,
}: {
  raceName: string;
  onPickName: (name: string) => void;
  onLore: (lore: string) => void;
}) {
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [lore, setLore] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function parse(text: string) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const picked: string[] = [];
    let loreText = "";
    for (const line of lines) {
      const m = line.match(/^\d+[.)-]\s*(.+)$/);
      if (m && picked.length < 5) picked.push(m[1].replace(/\*+/g, "").trim());
      else if (!/^\d/.test(line) && line.length > 30) loreText += (loreText ? " " : "") + line;
    }
    setNames(picked);
    setLore(loreText || null);
  }

  async function generate() {
    if (loading) return;
    setLoading(true);
    setNote(null);
    setNames([]);
    setLore(null);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "nome", payload: { race: raceName, concept } }),
      });
      const data = (await res.json()) as { text?: string; fallback?: boolean; error?: string };
      if (data.text) parse(data.text);
      else if (data.fallback) setNote("A IA ainda não está ativa (falta a chave).");
      else setNote(data.error ?? "Não foi possível gerar agora.");
    } catch {
      setNote("Falha de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-void-950/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Conceito p/ nomes (ex.: guerreira do gelo)"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-void-950/60 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-mente/50"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="btn-ghost !py-1.5 text-xs disabled:opacity-50"
        >
          {loading ? "Invocando…" : "🖋️ Gerar nome & lore"}
        </button>
      </div>

      {note && <p className="mt-2 text-xs text-sol-soft">{note}</p>}

      <AnimatePresence>
        {names.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {names.map((n) => (
                <button
                  key={n}
                  onClick={() => onPickName(n)}
                  className="chip hover:border-mente/60 hover:text-mente-soft"
                  title="Usar este nome"
                >
                  {n}
                </button>
              ))}
            </div>
            {lore && (
              <div className="rounded-lg border border-alma/30 bg-alma/5 p-2 text-xs text-zinc-300">
                <p className="whitespace-pre-wrap">{lore}</p>
                <button
                  onClick={() => onLore(lore)}
                  className="mt-1 text-[11px] text-mente-soft underline"
                >
                  Anexar às anotações
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
