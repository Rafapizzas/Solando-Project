"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useProfiles } from "@/lib/profiles";

/**
 * AccountMenu — pílula da barra que abre um menu deixando CLARA a diferença
 * entre CONTA (seu login) e PERFIL (persona dentro da conta). Traz as ações
 * que faltavam: trocar de perfil, gerenciar perfis, sair da conta e entrar
 * em outra conta.
 */
export function AccountMenu() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { activeProfile, clearActive } = useProfiles();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!profile) return null;

  function switchProfile() {
    setOpen(false);
    clearActive(); // o ProfileGate reabre a seleção de perfis
  }

  async function handleSignOut() {
    setOpen(false);
    clearActive();
    await signOut();
    router.push("/");
  }

  async function switchAccount() {
    setOpen(false);
    clearActive();
    await signOut();
    router.push("/entrar");
  }

  return (
    <div className="relative ml-1" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-sol/40 bg-sol/10 px-3 py-1.5 text-xs font-semibold text-sol-soft transition hover:brightness-110"
        title="Conta e perfis"
      >
        {activeProfile ? (
          <>
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[11px]"
              style={{ background: activeProfile.color }}
            >
              {activeProfile.emoji}
            </span>
            <span className="max-w-[110px] truncate">{activeProfile.name}</span>
            <span className="text-[9px] text-zinc-400">
              {activeProfile.role === "master" ? "👑" : "🎭"}
            </span>
          </>
        ) : profile.avatarUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
            <span className="max-w-[110px] truncate">{profile.displayName}</span>
          </>
        ) : (
          <>
            <span>🧙</span>
            <span className="max-w-[110px] truncate">{profile.displayName}</span>
          </>
        )}
        <span className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-void-950/95 shadow-2xl backdrop-blur-md">
          {/* CONTA */}
          <div className="flex items-center gap-3 border-b border-white/10 p-3">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-mente/20 text-lg">
                🧙
              </span>
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Conta
              </div>
              <div className="truncate text-sm font-semibold text-zinc-100">
                {profile.displayName}
              </div>
              {profile.email && (
                <div className="truncate text-xs text-zinc-500">{profile.email}</div>
              )}
            </div>
          </div>

          {/* PERFIL ATIVO */}
          <div className="border-b border-white/10 p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Perfil ativo
            </div>
            {activeProfile ? (
              <div className="flex items-center gap-2 text-sm text-zinc-200">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-xs"
                  style={{ background: activeProfile.color }}
                >
                  {activeProfile.emoji}
                </span>
                <span className="truncate">{activeProfile.name}</span>
                <span className="ml-auto text-xs text-zinc-400">
                  {activeProfile.role === "master" ? "👑 Mestre" : "🎭 Jogador"}
                </span>
              </div>
            ) : (
              <div className="text-sm text-zinc-500">Nenhum perfil selecionado</div>
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={switchProfile}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10"
              >
                Trocar de perfil
              </button>
              <Link
                href="/perfis"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-zinc-200 transition hover:bg-white/10"
              >
                Gerenciar
              </Link>
            </div>
          </div>

          {/* Esclarecimento */}
          <p className="border-b border-white/10 px-3 py-2 text-[11px] leading-snug text-zinc-500">
            <b className="text-zinc-400">Conta</b> é o seu login (e-mail/Google).{" "}
            <b className="text-zinc-400">Perfis</b> são personas dentro da mesma conta
            — como na Netflix.
          </p>

          {/* AÇÕES DE CONTA */}
          <div className="p-1.5">
            <button
              onClick={switchAccount}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/5"
            >
              🔁 Entrar em outra conta
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
            >
              🚪 Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
