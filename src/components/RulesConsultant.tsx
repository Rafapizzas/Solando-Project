"use client";

import { useEffect, useRef, useState } from "react";
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

const MUTE_KEY = "solando:fx-muted:v1";

/**
 * Consultor de Regras — chat com IA (grounded no manual) para tirar dúvidas.
 * O Arquimago "fala": a resposta surge em efeito máquina de escrever, com o
 * emoji animando a boca e blips curtos (estilo Undertale). Respeita o mudo
 * global e `prefers-reduced-motion`. Se a IA não responder, mostra um aviso.
 */
export function RulesConsultant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpa o timer da digitação ao desmontar.
  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  function muted() {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function reducedMotion() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  }

  /** Blip curtinho de fala (síntese, sem assets). */
  function blip() {
    if (muted()) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(420 + Math.random() * 90, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      /* áudio indisponível — silencioso */
    }
  }

  function scrollDown() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  /** Revela o texto do Arquimago em efeito de fala. */
  function speak(fullText: string) {
    setMessages((prev) => [...prev, { role: "model", text: "" }]);

    if (reducedMotion()) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "model", text: fullText };
        return copy;
      });
      scrollDown();
      return;
    }

    setSpeaking(true);
    let i = 0;
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      i += 1;
      const slice = fullText.slice(0, i);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "model", text: slice };
        return copy;
      });
      const ch = fullText[i - 1];
      if (ch && ch !== " " && i % 2 === 0) blip();
      if (i % 6 === 0) scrollDown();
      if (i >= fullText.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = null;
        setSpeaking(false);
        scrollDown();
      }
    }, 22);
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading || speaking) return;
    setNote(null);
    setInput("");
    const history = messages.slice(-6);
    setMessages((prev) => [...prev, { role: "user", text: q }]);
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
        reason?: string;
        error?: string;
      };
      if (data.text) {
        speak(data.text);
      } else if (data.fallback) {
        setNote(
          `O Arquimago não conseguiu responder agora${
            data.reason ? ` (${data.reason})` : ""
          }. Use o compêndio abaixo para consultar as regras.`,
        );
      } else {
        setNote(data.error ?? "Não foi possível consultar agora.");
      }
    } catch {
      setNote("Falha de rede ao consultar.");
    } finally {
      setLoading(false);
      scrollDown();
    }
  }

  const lastModel = [...messages].reverse().find((m) => m.role === "model");
  const speech = lastModel?.text ?? "";
  const hasHistory = messages.length > 0;

  return (
    <div className="card overflow-hidden p-0">
      {/* Palco do Arquimago — estilo light novel */}
      <div className="relative grid gap-5 bg-gradient-to-b from-void-900/60 to-void-950/80 p-5 sm:grid-cols-[auto,1fr] sm:items-end">
        <div className="pointer-events-none absolute -left-12 top-0 h-44 w-44 rounded-full bg-mente/25 blur-3xl" />

        {/* Retrato grande do arquimago */}
        <div className="relative mx-auto sm:mx-0">
          <motion.div
            className="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border border-mente/40 bg-void-950/70 text-6xl shadow-glow sm:h-32 sm:w-32"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: speaking ? 0.6 : 3.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.05]" />
            <motion.span
              aria-hidden
              animate={
                speaking
                  ? { scaleY: [1, 0.78, 1.08, 1] }
                  : { scaleY: 1 }
              }
              transition={
                speaking
                  ? { duration: 0.18, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              🧙‍♂️
            </motion.span>
          </motion.div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-mente/40 bg-void-950 px-3 py-0.5 font-ink text-xs text-mente-soft">
            賢者
          </span>
        </div>

        {/* Caixa de diálogo estilo visual novel */}
        <div className="vn-box relative min-h-[128px] rounded-2xl p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-wide text-sol-soft">
              Arquimago Solador das Regras
            </span>
            {speaking && (
              <span className="text-[10px] text-zinc-500">✦ conjurando…</span>
            )}
          </div>
          <p className="whitespace-pre-wrap font-ink text-lg leading-relaxed text-zinc-100">
            {speech ? (
              <>
                {speech}
                {speaking && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-sol-soft/80 align-middle" />
                )}
              </>
            ) : loading ? (
              <span className="text-zinc-500">Os pergaminhos sussurram…</span>
            ) : (
              <span className="text-zinc-400">
                Aproxime-se, jovem aprendiz. Que dúvida das regras de Solando trago à
                luz hoje?
              </span>
            )}
          </p>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute bottom-2 right-3 text-mente-soft/60"
            animate={{ y: [0, 3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            ▼
          </motion.span>
        </div>
      </div>

      {/* Sugestões / histórico / entrada */}
      <div className="space-y-3 p-5 pt-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
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

        {hasHistory && (
          <details className="group rounded-lg border border-white/10 bg-void-950/40">
            <summary className="cursor-pointer list-none px-3 py-2 text-xs text-zinc-400 transition hover:text-zinc-200">
              📜 Pergaminho da conversa ({messages.length})
            </summary>
            <div
              ref={listRef}
              className="max-h-64 space-y-2 overflow-y-auto p-3 pt-0"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 text-sm ${
                    m.role === "user"
                      ? "border-mente/30 bg-mente/5 text-zinc-100"
                      : "border-alma/30 bg-alma/5 text-alma-soft"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                    {m.role === "user" ? "Você" : "Arquimago"}
                  </div>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
            </div>
          </details>
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
            disabled={loading || speaking}
          />
          <button
            type="submit"
            disabled={loading || speaking || !input.trim()}
            className="btn-primary !px-4 text-sm disabled:opacity-50"
          >
            Perguntar
          </button>
        </form>

        {note && <p className="text-xs text-sol-soft">{note}</p>}
      </div>
    </div>
  );
}
