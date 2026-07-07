"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useProfiles } from "@/lib/profiles";
import { ProfilePicker } from "@/components/ProfilePicker";

export default function PerfisPage() {
  const { isAuthenticated, ready, profile, signOut } = useAuth();
  const { activeProfile, clearActive } = useProfiles();

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-black title-gradient">Perfis</h1>
        <p className="text-zinc-400">Entre na sua conta para gerenciar seus perfis.</p>
        <Link href="/entrar" className="btn-primary inline-block">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="manga-title text-3xl font-black title-gradient">Seus Perfis</h1>
        <p className="mt-2 text-zinc-400">
          Crie perfis de <b>Jogador</b> ou <b>Mestre</b> e troque entre eles a qualquer
          momento — tudo na mesma conta.
        </p>
        {activeProfile && (
          <p className="mt-2 text-sm text-zinc-500">
            Perfil ativo:{" "}
            <span className="font-semibold text-zinc-200">
              {activeProfile.emoji} {activeProfile.name}
            </span>{" "}
            ·{" "}
            <button onClick={clearActive} className="text-mente-soft underline">
              trocar de perfil
            </button>
          </p>
        )}
      </div>

      {/* Conta ≠ Perfil — explicação + ações de conta */}
      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-mente-soft">
              Sua conta
            </p>
            <p className="mt-1 font-semibold text-zinc-100">
              {profile?.displayName ?? "Aventureiro"}
            </p>
            {profile?.email && (
              <p className="text-sm text-zinc-500">{profile.email}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                clearActive();
                void signOut();
              }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              🔁 Entrar em outra conta
            </button>
            <button
              onClick={() => {
                clearActive();
                void signOut();
              }}
              className="rounded-lg border border-fail/40 bg-fail/10 px-3 py-1.5 text-sm text-fail transition hover:brightness-110"
            >
              🚪 Sair da conta
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-void-950/40 p-3 text-sm text-zinc-400">
          <b className="text-zinc-200">Conta</b> é o seu login (e-mail/Google) — onde ficam
          seus dados e assinatura. <b className="text-zinc-200">Perfis</b> são personas
          dentro da mesma conta (Jogador ou Mestre), como os perfis da Netflix. Você troca
          de perfil sem sair da conta.
        </div>
      </div>

      <div className="card p-8">
        <ProfilePicker manage />
      </div>
    </div>
  );
}
