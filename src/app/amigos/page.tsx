"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  accountRepo,
  friendsRepo,
  type Account,
  type Friend,
  type FriendRequest,
  type PresenceStatus,
} from "@/lib/storage";

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
  online: { label: "Online", dot: "bg-emerald-400", text: "text-emerald-300" },
  in_session: { label: "Em sessão", dot: "bg-sky-400", text: "text-sky-300" },
  mastering: { label: "Mestrando", dot: "bg-amber-400", text: "text-amber-300" },
  offline: { label: "Offline", dot: "bg-zinc-600", text: "text-zinc-500" },
};

function Avatar({ url, name }: { url?: string; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-mente/20 text-lg">
      {name.charAt(0).toUpperCase() || "🧙"}
    </span>
  );
}

export default function AmigosPage() {
  const { isAuthenticated, ready } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acc, fr, rq] = await Promise.all([
        accountRepo.get(),
        friendsRepo.list(),
        friendsRepo.requests(),
      ]);
      setAccount(acc);
      setFriends(fr);
      setRequests(rq);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar amigos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && isAuthenticated) void load();
  }, [ready, isAuthenticated, load]);

  // Atualiza a presença dos amigos periodicamente.
  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(() => {
      void friendsRepo.list().then(setFriends).catch(() => {});
    }, 30_000);
    return () => clearInterval(t);
  }, [isAuthenticated]);

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  async function add() {
    setBusy(true);
    setError(null);
    const err = await friendsRepo.addByCode(code);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setCode("");
    notify("Pedido enviado!");
    await load();
  }

  async function accept(id: string) {
    await friendsRepo.accept(id);
    notify("Amizade aceita!");
    await load();
  }

  async function reject(id: string) {
    await friendsRepo.remove(id);
    await load();
  }

  const incoming = requests.filter((r) => r.direction === "incoming");
  const outgoing = requests.filter((r) => r.direction === "outgoing");

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-black title-gradient">Amigos</h1>
        <p className="text-zinc-400">Entre na sua conta para ver e adicionar amigos.</p>
        <Link href="/entrar" className="btn-primary inline-block">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="manga-title text-3xl font-black title-gradient">Amigos</h1>
        <p className="mt-2 text-zinc-400">
          Adicione pessoas pelo código de amigo e veja quem está online.
        </p>
      </div>

      {flash && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-center text-sm text-emerald-300">
          {flash}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Adicionar amigo */}
      <div className="card space-y-3 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-sol-soft">
          Adicionar amigo
        </p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && !busy && add()}
            placeholder="CÓDIGO DE AMIGO"
            className="flex-1 rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 font-mono tracking-widest text-zinc-100 outline-none focus:border-mente/50"
          />
          <button
            onClick={add}
            disabled={busy || !code.trim()}
            className="btn-primary !px-4 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
        {account?.friendCode && (
          <p className="text-xs text-zinc-500">
            Seu código:{" "}
            <span className="font-mono tracking-widest text-sol-soft">
              {account.friendCode}
            </span>{" "}
            ·{" "}
            <Link href="/conta" className="text-mente-soft underline">
              gerenciar conta
            </Link>
          </p>
        )}
      </div>

      {/* Pedidos recebidos */}
      {incoming.length > 0 && (
        <div className="card space-y-2 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-mente-soft">
            Pedidos recebidos
          </p>
          {incoming.map((r) => (
            <div key={r.friendshipId} className="flex items-center gap-3">
              <Avatar url={r.avatarUrl} name={r.displayName} />
              <span className="flex-1 truncate text-sm text-zinc-200">{r.displayName}</span>
              <button
                onClick={() => accept(r.friendshipId)}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 transition hover:brightness-110"
              >
                Aceitar
              </button>
              <button
                onClick={() => reject(r.friendshipId)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/5"
              >
                Recusar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pedidos enviados */}
      {outgoing.length > 0 && (
        <div className="card space-y-2 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Pedidos enviados
          </p>
          {outgoing.map((r) => (
            <div key={r.friendshipId} className="flex items-center gap-3">
              <Avatar url={r.avatarUrl} name={r.displayName} />
              <span className="flex-1 truncate text-sm text-zinc-300">{r.displayName}</span>
              <span className="text-xs text-zinc-500">Aguardando…</span>
              <button
                onClick={() => reject(r.friendshipId)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-white/5"
              >
                Cancelar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lista de amigos */}
      <div className="card space-y-2 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-sol-soft">
          Meus amigos {friends.length > 0 && `(${friends.length})`}
        </p>
        {loading ? (
          <p className="py-4 text-center text-sm text-zinc-500">Carregando…</p>
        ) : friends.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            Você ainda não tem amigos. Compartilhe seu código!
          </p>
        ) : (
          friends
            .slice()
            .sort((a, b) => {
              const order = (p: PresenceStatus) => (p === "offline" ? 1 : 0);
              return order(a.presence.status) - order(b.presence.status);
            })
            .map((f) => {
              const meta = PRESENCE_META[f.presence.status];
              return (
                <div key={f.friendshipId} className="flex items-center gap-3 py-1">
                  <div className="relative">
                    <Avatar url={f.avatarUrl} name={f.displayName} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-void-950 ${meta.dot}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-100">
                      {f.displayName}
                    </div>
                    <div className={`text-xs ${meta.text}`}>{meta.label}</div>
                  </div>
                  <button
                    onClick={() => reject(f.friendshipId)}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    Remover
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
