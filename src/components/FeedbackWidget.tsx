"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * FeedbackWidget — botão flutuante + formulário rápido e divertido para o
 * público mandar erro/sugestão/opinião com nota em estrelas. Envia para
 * /api/feedback (salva no Supabase e, se configurado, e-mail para o dono).
 */

type Category = "bug" | "sugestao" | "opiniao" | "outro";

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "bug", label: "Erro / Bug", emoji: "🐛" },
  { id: "sugestao", label: "Sugestão", emoji: "💡" },
  { id: "opiniao", label: "Opinião", emoji: "💬" },
  { id: "outro", label: "Outro", emoji: "❓" },
];

const PLACEHOLDERS: Record<Category, string> = {
  bug: "Conta o que quebrou, o que você esperava e como reproduzir…",
  sugestao: "Manda a ideia! O que deixaria o Solando ainda melhor?",
  opiniao: "O que achou do site? Pode ser sincero, o Arquimago aguenta. 🧙",
  outro: "Fala aí o que você quiser…",
};

const RATING_HINTS = ["", "Eita…", "Dá pra melhorar", "Tá de boa", "Curti!", "Épico! ⚔️"];

export function FeedbackWidget() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("sugestao");
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-preenche o e-mail de contato com o da conta, se houver.
  useEffect(() => {
    if (open && profile?.email && !email) setEmail(profile.email);
  }, [open, profile?.email, email]);

  // Fecha com ESC.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setCategory("sugestao");
    setRating(0);
    setHoverStar(0);
    setMessage("");
    setError(null);
    setDone(false);
  }

  async function submit() {
    if (sending) return;
    if (!message.trim()) {
      setError("Escreve uma mensagenzinha antes de enviar. 🙏");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          rating: rating || undefined,
          message: message.trim(),
          email: email.trim() || undefined,
          page: pathname,
          profileName: profile?.displayName,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não deu para enviar agora. Tenta de novo?");
      } else {
        setDone(true);
        setMessage("");
      }
    } catch {
      setError("Falha de rede ao enviar. Tenta de novo?");
    } finally {
      setSending(false);
    }
  }

  const shownStar = hoverStar || rating;

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        onClick={() => setOpen(true)}
        className="group fixed bottom-5 left-5 z-[60] flex items-center gap-2 rounded-full border border-mente/40 bg-void-950/90 px-4 py-2.5 text-sm font-semibold text-zinc-100 shadow-glow backdrop-blur transition hover:border-mente hover:bg-void-900"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Enviar feedback"
      >
        <motion.span
          aria-hidden
          animate={{ rotate: [0, -12, 12, -8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 }}
        >
          📨
        </motion.span>
        <span className="hidden sm:inline">Feedback</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[85] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="vn-box relative w-full max-w-md overflow-hidden rounded-2xl p-5"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="halftone pointer-events-none absolute inset-0 opacity-[0.05]" />

              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>

              {done ? (
                <div className="relative flex flex-col items-center gap-3 py-8 text-center">
                  <motion.div
                    className="text-6xl"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  >
                    🎉
                  </motion.div>
                  <h3 className="font-display text-xl font-bold title-gradient">
                    Feedback enviado!
                  </h3>
                  <p className="max-w-xs text-sm text-zinc-400">
                    Valeu por ajudar a forjar o Solando, aventureiro. Cada relato
                    torna a mesa mais forte. ⚔️
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={reset} className="chip">
                      Enviar outro
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="btn-primary !px-4 text-sm"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-sol-soft">
                      📨 Manda a real pro Arquimago
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Erro, ideia ou opinião — tudo é bem-vindo (e lido!).
                    </p>
                  </div>

                  {/* Estrelas */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onMouseEnter={() => setHoverStar(n)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setRating(n === rating ? 0 : n)}
                          className="text-2xl transition-transform hover:scale-125"
                          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                        >
                          <span
                            className={
                              n <= shownStar ? "text-sol drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-zinc-600"
                            }
                          >
                            {n <= shownStar ? "★" : "☆"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">{RATING_HINTS[shownStar]}</span>
                  </div>

                  {/* Categorias */}
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          category === c.id
                            ? "border-mente bg-mente/15 text-white"
                            : "border-white/10 bg-void-950/40 text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Mensagem */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder={PLACEHOLDERS[category]}
                    className="w-full resize-none rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-mente/50"
                  />

                  {/* E-mail opcional */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu e-mail (opcional, se quiser resposta)"
                    className="w-full rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-mente/50"
                  />

                  {error && <p className="text-xs text-fail">{error}</p>}

                  <button
                    onClick={submit}
                    disabled={sending}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {sending ? "Enviando…" : "Enviar feedback ✨"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
