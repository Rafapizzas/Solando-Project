"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const SUGGESTIONS = [
  "Como calculo a Vida e a Entropia?",
  "Quantos pontos de talento eu tenho no nível 5?",
  "O que as condições fazem?",
  "Como funcionam as competências?",
];

/**
 * Consultor de Regras — chat com IA (grounded no manual) para tirar dúvidas.
 * Se a IA não estiver configurada, mostra um aviso amigável (nunca quebra).
 */
export function RulesConsultant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setNote(null);
    setInput("");
    const history = messages.slice(-6);
    const next = [...messages, { role: "user" as const, text: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/consultor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const data = (await res.json()) as {
        text?: string;
        fallback?: boolean;
        error?: string;
      };
      if (data.text) {
        setMessages((prev) => [...prev, { role: "model", text: data.text as string }]);
      } else if (data.fallback) {
        setNote(
          "O consultor por IA ainda não está ativo (falta configurar a chave). Use o compêndio abaixo para consultar as regras.",
        );
      } else {
        setNote(data.error ?? "Não foi possível consultar agora.");
      }
    } catch {
      setNote("Falha de rede ao consultar.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🧙‍♂️</span>
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-100">
            Consultor de Regras
          </h2>
          <p className="text-xs text-zinc-500">
            Tire dúvidas do manual — respostas baseadas nas regras oficiais.
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div
          ref={listRef}
          className="mb-3 max-h-[360px] space-y-2 overflow-y-auto pr-1"
        >
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-3 text-sm ${
                m.role === "user"
                  ? "border-mente/30 bg-mente/5 text-zinc-100"
                  : "border-alma/30 bg-alma/5 text-alma-soft"
              }`}
            >
              <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                {m.role === "user" ? "Você" : "Consultor"}
              </div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </motion.div>
          ))}
          {loading && (
            <div className="rounded-xl border border-white/10 bg-void-950/40 p-3 text-sm text-zinc-500">
              Consultando o manual…
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-lg border border-white/10 bg-void-950/40 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre as regras…"
          className="flex-1 rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-mente/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary !px-4 text-sm disabled:opacity-50"
        >
          Perguntar
        </button>
      </form>

      {note && <p className="mt-2 text-xs text-sol-soft">{note}</p>}
    </div>
  );
}
