"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Forja de Personagens com IA — a partir de um conceito/arquétipo, sugere uma
 * build coerente com as regras (raça, classe, atributos, skills, gancho).
 * Serve tanto para personagens jogáveis quanto para NPCs do Mestre.
 * É inspiracional: não salva ficha automaticamente (o jogador usa como norte).
 */
export function AICharacterForge() {
  const [open, setOpen] = useState(false);
  const [concept, setConcept] = useState("");
  const [kind, setKind] = useState<"pc" | "npc">("pc");
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function forge() {
    if (!concept.trim() || loading) return;
    setLoading(true);
    setNote(null);
    setResult(null);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "personagem", payload: { concept, kind, level } }),
      });
      const data = (await res.json()) as { text?: string; fallback?: boolean; error?: string };
      if (data.text) setResult(data.text);
      else if (data.fallback)
        setNote("A IA ainda não está ativa (falta a chave). Crie manualmente por enquanto.");
      else setNote(data.error ?? "Não foi possível gerar agora.");
    } catch {
      setNote("Falha de rede ao gerar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-vibe ink-panel overflow-hidden p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-mente-deep to-alma text-lg">
          ✨
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-zinc-100">
            Forja de Personagens (IA)
          </h3>
          <p className="text-xs text-zinc-500">
            Descreva um conceito e receba uma build pronta como inspiração.
          </p>
        </div>
        <span className="text-zinc-500">{open ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-lg border border-white/10">
                  <button
                    onClick={() => setKind("pc")}
                    className={`px-3 py-1.5 text-xs ${kind === "pc" ? "bg-mente/20 text-white" : "text-zinc-400"}`}
                  >
                    🎭 Jogável
                  </button>
                  <button
                    onClick={() => setKind("npc")}
                    className={`px-3 py-1.5 text-xs ${kind === "npc" ? "bg-sol/20 text-white" : "text-zinc-400"}`}
                  >
                    👺 NPC
                  </button>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                  Nível
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={level}
                    onChange={(e) => setLevel(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                    className="w-16 rounded-lg border border-white/10 bg-void-950/60 px-2 py-1 text-center text-zinc-100 outline-none focus:border-mente/50"
                  />
                </label>
              </div>

              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ex.: um caçador amaldiçoado que odeia magia mas depende dela; ou 'tanque sombrio inspirado em samurai'."
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-mente/50"
              />

              <div className="flex flex-wrap gap-2">
                {["Espadachim andarilho e honrado", "Bruxa das sombras vingativa", "Ferreiro gigante gentil"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setConcept(s)}
                    className="rounded-lg border border-white/10 bg-void-950/40 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:bg-white/5"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={forge}
                disabled={loading || !concept.trim()}
                className="btn-primary w-full text-sm disabled:opacity-50"
              >
                {loading ? "Forjando alma…" : "✦ Forjar com IA"}
              </button>

              {note && <p className="text-xs text-sol-soft">{note}</p>}
              {result && (
                <div className="rounded-xl border border-alma/30 bg-alma/5 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-zinc-200">{result}</p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(result)}
                    className="mt-2 text-xs text-mente-soft underline"
                  >
                    Copiar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
