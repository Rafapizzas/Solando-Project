"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  characterRepo,
  grantsRepo,
  type CharacterGrant,
  type GrantPermission,
} from "@/lib/storage";

const PERM_LABELS: Record<GrantPermission, string> = {
  view: "Ver",
  use: "Usar",
  edit: "Editar",
};

/**
 * ShareCharacter — painel do dono da ficha para compartilhá-la: alterna
 * "pública" (todos veem) e concede acesso a amigos por código (ver/usar/editar).
 */
export function ShareCharacter({ characterId }: { characterId: string }) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [grants, setGrants] = useState<CharacterGrant[]>([]);
  const [code, setCode] = useState("");
  const [perm, setPerm] = useState<GrantPermission>("view");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pub, gr] = await Promise.all([
        characterRepo.isPublic(characterId),
        grantsRepo.listForCharacter(characterId),
      ]);
      setIsPublic(pub);
      setGrants(gr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    }
  }, [characterId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  async function togglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    try {
      await characterRepo.setPublic(characterId, next);
      notify(next ? "Ficha agora é pública." : "Ficha voltou a ser privada.");
    } catch {
      setIsPublic(!next);
      setError("Não foi possível alterar a visibilidade.");
    }
  }

  async function add() {
    setBusy(true);
    setError(null);
    const err = await grantsRepo.addByCode(characterId, code, perm);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setCode("");
    notify("Compartilhado!");
    await load();
  }

  async function changePerm(id: string, value: GrantPermission) {
    await grantsRepo.setPermission(id, value);
    await load();
  }

  async function removeGrant(id: string) {
    await grantsRepo.remove(id);
    await load();
  }

  return (
    <div className="card p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-lg font-bold text-zinc-100">
          🤝 Compartilhar ficha
        </span>
        <span className="text-sm text-zinc-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
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

          {/* Pública */}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-void-950/40 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-zinc-100">Ficha pública</div>
              <div className="text-xs text-zinc-500">
                Qualquer pessoa logada pode ver esta ficha.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={togglePublic}
              className="h-5 w-5 accent-mente"
            />
          </label>

          {/* Adicionar por código */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-mente-soft">
              Compartilhar com um amigo
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO DE AMIGO"
                className="flex-1 rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 font-mono tracking-widest text-zinc-100 outline-none focus:border-mente/50"
              />
              <select
                value={perm}
                onChange={(e) => setPerm(e.target.value as GrantPermission)}
                className="rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-sm text-zinc-100 outline-none"
              >
                <option value="view">Ver</option>
                <option value="use">Usar</option>
                <option value="edit">Editar</option>
              </select>
              <button
                onClick={add}
                disabled={busy || !code.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                Compartilhar
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Pegue o código na página{" "}
              <Link href="/amigos" className="text-mente-soft underline">
                Amigos
              </Link>
              .
            </p>
          </div>

          {/* Lista de compartilhamentos */}
          {grants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Compartilhada com
              </p>
              {grants.map((g) => (
                <div key={g.id} className="flex items-center gap-3">
                  {g.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-mente/20 text-sm">
                      {g.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm text-zinc-200">
                    {g.displayName}
                  </span>
                  <select
                    value={g.permission}
                    onChange={(e) => changePerm(g.id, e.target.value as GrantPermission)}
                    className="rounded-lg border border-white/10 bg-void-950/60 px-2 py-1 text-xs text-zinc-100 outline-none"
                    title={PERM_LABELS[g.permission]}
                  >
                    <option value="view">Ver</option>
                    <option value="use">Usar</option>
                    <option value="edit">Editar</option>
                  </select>
                  <button
                    onClick={() => removeGrant(g.id)}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
