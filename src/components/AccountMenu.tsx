"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * AccountMenu — pílula da barra com as ações da conta: editar conta, amigos,
 * entrar em outra conta e sair. O papel de mestre passou a ser por mesa, então
 * não há mais troca de perfil aqui.
 */
export function AccountMenu() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
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

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  async function switchAccount() {
    setOpen(false);
    await signOut();
    router.push("/entrar");
  }

  return (
    <div className="relative ml-1" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-sol/40 bg-sol/10 px-3 py-1.5 text-xs font-semibold text-sol-soft transition hover:brightness-110"
        title="Conta"
      >
        {profile.avatarUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
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

          {/* NAVEGAÇÃO */}
          <div className="p-1.5">
            <Link
              href="/conta"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/5"
            >
              ⚙️ Editar conta
            </Link>
            <Link
              href="/amigos"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/5"
            >
              🫂 Amigos
            </Link>
          </div>

          {/* AÇÕES DE CONTA */}
          <div className="border-t border-white/10 p-1.5">
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
