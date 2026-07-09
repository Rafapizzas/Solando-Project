"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  friendsRepo,
  invitesRepo,
  type Friend,
  type TableInvite,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase/client";

/**
 * MesaInvite — painel do mestre para convidar jogadores: gera código/link,
 * convida amigos direto da lista e envia convite por e-mail.
 */
export function MesaInvite({
  tableId,
  tableName,
  onChange,
}: {
  tableId: string;
  tableName: string;
  onChange?: () => void;
}) {
  const [invites, setInvites] = useState<TableInvite[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [inv, fr] = await Promise.all([
        invitesRepo.list(tableId),
        friendsRepo.list(),
      ]);
      setInvites(inv);
      setFriends(fr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar convites.");
    }
  }, [tableId]);

  useEffect(() => {
    void load();
  }, [load]);

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  const activeCode = invites[0]?.code ?? null;

  async function ensureCode(): Promise<string | null> {
    if (activeCode) return activeCode;
    const inv = await invitesRepo.create(tableId, {});
    await load();
    return inv.code;
  }

  async function copyLink() {
    setBusy(true);
    setError(null);
    try {
      const code = await ensureCode();
      if (!code) return;
      const link = `${window.location.origin}/mesa?convite=${encodeURIComponent(code)}`;
      await navigator.clipboard?.writeText(link);
      notify("Link copiado!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    setBusy(true);
    setError(null);
    try {
      const code = await ensureCode();
      if (!code) return;
      await navigator.clipboard?.writeText(code);
      notify("Código copiado!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar código.");
    } finally {
      setBusy(false);
    }
  }

  async function inviteFriend(f: Friend) {
    setError(null);
    const err = await invitesRepo.inviteFriend(tableId, f.userId);
    if (err) {
      setError(err);
      return;
    }
    notify(`${f.displayName} convidado!`);
    onChange?.();
  }

  async function sendEmailInvite() {
    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const code = await ensureCode();
      if (!code) return;
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const res = await fetch("/api/mesa/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tableId,
          tableName,
          email: email.trim(),
          code,
          origin: window.location.origin,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Falha ao enviar convite.");
        return;
      }
      if (data.ok) notify("Convite enviado por e-mail!");
      else setError(data.error ?? "E-mail indisponível — use o link/código.");
      setEmail("");
    } catch {
      setError("Falha ao enviar convite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <h3 className="font-display text-lg font-bold text-zinc-100">Convidar jogadores</h3>

      {flash && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
          {flash}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Código / link */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copyLink} disabled={busy} className="btn-sol text-sm disabled:opacity-50">
            🔗 Copiar link
          </button>
          <button
            onClick={copyCode}
            disabled={busy}
            className="btn-ghost text-sm disabled:opacity-50"
          >
            #️⃣ Copiar código
          </button>
          {activeCode && (
            <code className="rounded-lg border border-sol/30 bg-sol/10 px-3 py-1 font-mono tracking-widest text-sol-soft">
              {activeCode}
            </code>
          )}
        </div>
      </div>

      {/* E-mail */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <label className="label">Convidar por e-mail</label>
          <input
            className="input"
            type="email"
            value={email}
            placeholder="jogador@email.com"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && sendEmailInvite()}
          />
        </div>
        <button
          onClick={sendEmailInvite}
          disabled={busy || !email}
          className="btn-primary text-sm disabled:opacity-50"
        >
          Enviar
        </button>
      </div>

      {/* Amigos */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-mente-soft">
          Convidar amigos
        </p>
        {friends.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Você ainda não tem amigos.{" "}
            <Link href="/amigos" className="text-mente-soft underline">
              Adicionar
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friends.map((f) => (
              <button
                key={f.friendshipId}
                onClick={() => inviteFriend(f)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                {f.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-mente/20 text-[11px]">
                    {f.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                {f.displayName}
                <span className="text-xs text-sol-soft">+</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
