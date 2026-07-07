"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Mural de Feedbacks — painel público: qualquer um vê os feedbacks enviados,
 * seu status e conversa nos comentários. O administrador (dono) pode alterar o
 * status (ex.: marcar um erro como resolvido) e o autor é avisado por e-mail.
 */

interface FeedbackRow {
  id: string;
  created_at: string;
  category: "bug" | "sugestao" | "opiniao" | "outro";
  rating: number | null;
  message: string;
  status: "aberto" | "em_analise" | "resolvido" | "fechado";
  profile_name: string | null;
}

interface CommentRow {
  id: string;
  feedback_id: string;
  created_at: string;
  author_name: string;
  body: string;
  is_admin: boolean;
}

const CAT: Record<FeedbackRow["category"], { emoji: string; label: string }> = {
  bug: { emoji: "🐛", label: "Erro / Bug" },
  sugestao: { emoji: "💡", label: "Sugestão" },
  opiniao: { emoji: "💬", label: "Opinião" },
  outro: { emoji: "❓", label: "Outro" },
};

const STATUS: Record<FeedbackRow["status"], { label: string; cls: string }> = {
  aberto: { label: "Aberto", cls: "border-white/15 text-zinc-300" },
  em_analise: { label: "Em análise", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  resolvido: { label: "Resolvido ✅", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  fechado: { label: "Fechado", cls: "border-white/10 text-zinc-500" },
};

const STATUS_ORDER: FeedbackRow["status"][] = ["aberto", "em_analise", "resolvido", "fechado"];

function Stars({ n }: { n: number | null }) {
  if (!n) return null;
  return (
    <span className="text-sol" title={`${n}/5`}>
      {"★".repeat(n)}
      <span className="text-zinc-600">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function FeedbackWallPage() {
  const { profile, isAuthenticated } = useAuth();
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | FeedbackRow["category"]>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !!profile?.email && !!adminEmail && profile.email.toLowerCase() === adminEmail.toLowerCase();

  const load = useCallback(async () => {
    if (!isSupabaseEnabled() || !supabase) {
      setError("O mural precisa do Supabase configurado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: fb, error: e1 } = await supabase
      .from("feedback_public")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (e1) {
      setError("Não foi possível carregar os feedbacks.");
      setLoading(false);
      return;
    }
    const rows = (fb ?? []) as FeedbackRow[];
    setItems(rows);

    const { data: cs } = await supabase
      .from("feedback_comments")
      .select("*")
      .order("created_at", { ascending: true });
    const grouped: Record<string, CommentRow[]> = {};
    for (const c of (cs ?? []) as CommentRow[]) {
      (grouped[c.feedback_id] ??= []).push(c);
    }
    setComments(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function token(): Promise<string | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function postComment(id: string) {
    const body = (drafts[id] ?? "").trim();
    if (!body || busy) return;
    const t = await token();
    if (!t) {
      setError("Faça login para comentar.");
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/feedback/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ feedbackId: id, body }),
      });
      const data = (await res.json()) as { ok?: boolean; comment?: CommentRow; error?: string };
      if (!res.ok || !data.ok || !data.comment) {
        setError(data.error ?? "Não foi possível comentar.");
      } else {
        setComments((prev) => ({
          ...prev,
          [id]: [...(prev[id] ?? []), data.comment as CommentRow],
        }));
        setDrafts((prev) => ({ ...prev, [id]: "" }));
      }
    } catch {
      setError("Falha de rede ao comentar.");
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(id: string, status: FeedbackRow["status"]) {
    const t = await token();
    if (!t) return;
    setBusy(id);
    try {
      const res = await fetch("/api/feedback/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ feedbackId: id, status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
      } else {
        setError(data.error ?? "Não foi possível alterar o status.");
      }
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(null);
    }
  }

  const visible = useMemo(
    () => (filter === "todos" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="manga-title text-3xl font-black title-gradient">Mural de Feedbacks</h1>
        <p className="mt-2 text-zinc-400">
          O que a comunidade está relatando, sugerindo e comentando. Participe da conversa! 💬
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2">
        {(["todos", "bug", "sugestao", "opiniao", "outro"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === c
                ? "border-mente bg-mente/15 text-white"
                : "border-white/10 bg-void-950/40 text-zinc-300 hover:bg-white/5"
            }`}
          >
            {c === "todos" ? "Todos" : `${CAT[c].emoji} ${CAT[c].label}`}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-center text-sm text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-zinc-500">Carregando o mural…</p>
      ) : visible.length === 0 ? (
        <div className="card p-8 text-center text-zinc-400">
          <p>Nenhum feedback por aqui ainda.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Use o botão flutuante 📨 para ser o primeiro!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((it) => {
            const thread = comments[it.id] ?? [];
            const open = expanded === it.id;
            return (
              <motion.div
                key={it.id}
                layout
                className="card overflow-hidden p-0"
              >
                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-zinc-200">
                      {CAT[it.category].emoji} {CAT[it.category].label}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 ${STATUS[it.status].cls}`}>
                      {STATUS[it.status].label}
                    </span>
                    <Stars n={it.rating} />
                    <span className="ml-auto text-zinc-500">
                      {it.profile_name ? `${it.profile_name} · ` : ""}
                      {timeAgo(it.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-zinc-100">{it.message}</p>

                  {/* Controles de admin */}
                  {isAdmin && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Admin:
                      </span>
                      {STATUS_ORDER.map((s) => (
                        <button
                          key={s}
                          disabled={busy === it.id || it.status === s}
                          onClick={() => setStatus(it.id, s)}
                          className={`rounded-md border px-2 py-1 text-[11px] transition disabled:opacity-40 ${
                            it.status === s
                              ? STATUS[s].cls
                              : "border-white/10 text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          {STATUS[s].label}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setExpanded(open ? null : it.id)}
                    className="mt-3 text-xs font-medium text-mente-soft transition hover:text-mente"
                  >
                    💬 {thread.length > 0 ? `${thread.length} comentário${thread.length > 1 ? "s" : ""}` : "Comentar"}
                    {open ? " ▲" : " ▼"}
                  </button>
                </div>

                {open && (
                  <div className="space-y-3 border-t border-white/10 bg-void-950/40 p-4">
                    {thread.map((c) => (
                      <div key={c.id} className="text-sm">
                        <div className="mb-0.5 flex items-center gap-2 text-[11px]">
                          <span
                            className={`font-semibold ${
                              c.is_admin ? "text-sol-soft" : "text-mente-soft"
                            }`}
                          >
                            {c.is_admin ? "🧙 " : ""}
                            {c.author_name}
                          </span>
                          {c.is_admin && (
                            <span className="rounded-full border border-sol/40 bg-sol/10 px-1.5 text-[9px] text-sol-soft">
                              ADMIN
                            </span>
                          )}
                          <span className="text-zinc-600">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-zinc-200">{c.body}</p>
                      </div>
                    ))}

                    {isAuthenticated ? (
                      <div className="flex gap-2 pt-1">
                        <input
                          value={drafts[it.id] ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [it.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void postComment(it.id);
                          }}
                          placeholder="Escreva um comentário…"
                          maxLength={2000}
                          className="flex-1 rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-mente/50"
                        />
                        <button
                          onClick={() => void postComment(it.id)}
                          disabled={busy === it.id || !(drafts[it.id] ?? "").trim()}
                          className="btn-primary !px-4 text-sm disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        <Link href="/entrar" className="text-mente-soft underline">
                          Entre
                        </Link>{" "}
                        para participar da conversa.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
