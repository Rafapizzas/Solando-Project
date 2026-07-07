"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Contramestre (IA) — painel do Mestre na mesa: gera ganchos de cena, NPCs
 * rápidos e narra dramaticamente a última rolagem. Visível para todos, mas
 * pensado para o Mestre conduzir a sessão. Degrada com elegância sem a chave.
 */
export function MesaAssistant({ lastRoll }: { lastRoll?: string }) {
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState<null | "cena" | "npc" | "narrar">(null);
  const [result, setResult] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(mode: "cena" | "npc" | "narrar") {
    if (loading) return;
    setLoading(mode);
    setNote(null);
    setResult(null);
    const ctx =
      mode === "narrar" ? lastRoll || context : context || "Uma cena da campanha atual.";
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "mestre", payload: { mode, context: ctx } }),
      });
      const data = (await res.json()) as { text?: string; fallback?: boolean; error?: string };
      if (data.text) setResult(data.text);
      else if (data.fallback)
        setNote("A IA ainda não está ativa (falta a chave).");
      else setNote(data.error ?? "Não foi possível gerar agora.");
    } catch {
      setNote("Falha de rede.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card ink-panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">⛩️</span>
        <div>
          <h3 className="font-display text-lg font-bold text-zinc-100">Contramestre (IA)</h3>
          <p className="text-xs text-zinc-500">Ganchos, NPCs e narração da sessão.</p>
        </div>
      </div>

      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Contexto da cena (opcional): onde estão, o que acabou de acontecer…"
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-mente/50"
      />

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          onClick={() => run("cena")}
          disabled={!!loading}
          className="btn-ghost !py-1.5 text-xs disabled:opacity-50"
        >
          {loading === "cena" ? "…" : "🗺️ Ganchos"}
        </button>
        <button
          onClick={() => run("npc")}
          disabled={!!loading}
          className="btn-ghost !py-1.5 text-xs disabled:opacity-50"
        >
          {loading === "npc" ? "…" : "👺 NPC"}
        </button>
        <button
          onClick={() => run("narrar")}
          disabled={!!loading || !lastRoll}
          title={lastRoll ? `Narrar: ${lastRoll}` : "Role algo primeiro"}
          className="btn-ghost !py-1.5 text-xs disabled:opacity-50"
        >
          {loading === "narrar" ? "…" : "🎬 Narrar"}
        </button>
      </div>

      {note && <p className="mt-2 text-xs text-sol-soft">{note}</p>}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-alma/30 bg-alma/5 p-3 text-sm"
          >
            <p className="whitespace-pre-wrap text-zinc-200">{result}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
