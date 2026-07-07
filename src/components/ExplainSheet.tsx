"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Explique minha ficha (IA) — lê um resumo do personagem e explica, em
 * linguagem simples para iniciantes, quem ele é, forças, fraquezas e como
 * jogá-lo bem. Degrada com elegância sem a chave da IA.
 */
export function ExplainSheet({ summary }: { summary: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function explain() {
    if (loading) return;
    setLoading(true);
    setNote(null);
    setText(null);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "explicar", payload: { summary } }),
      });
      const data = (await res.json()) as { text?: string; fallback?: boolean; error?: string };
      if (data.text) setText(data.text);
      else if (data.fallback) setNote("A IA ainda não está ativa (falta a chave).");
      else setNote(data.error ?? "Não foi possível explicar agora.");
    } catch {
      setNote("Falha de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card ink-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-200">Explique minha ficha (IA)</h2>
          <p className="text-xs text-zinc-500">
            Ideal para iniciantes: entenda forças, fraquezas e como jogar.
          </p>
        </div>
        <button
          onClick={explain}
          disabled={loading}
          className="btn-primary !px-4 text-sm disabled:opacity-50"
        >
          {loading ? "Analisando…" : "🧠 Explicar"}
        </button>
      </div>

      {note && <p className="mt-2 text-xs text-sol-soft">{note}</p>}
      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-alma/30 bg-alma/5 p-3 text-sm"
          >
            <p className="whitespace-pre-wrap text-zinc-200">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
