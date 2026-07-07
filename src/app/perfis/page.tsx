"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useProfiles } from "@/lib/profiles";
import { ProfilePicker } from "@/components/ProfilePicker";

export default function PerfisPage() {
  const { isAuthenticated, ready } = useAuth();
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

      <div className="card p-8">
        <ProfilePicker manage />
      </div>
    </div>
  );
}
