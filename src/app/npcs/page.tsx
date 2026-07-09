"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { NpcManager } from "@/components/NpcManager";

export default function NpcsPage() {
  const { ready, isAuthenticated } = useAuth();

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <span className="text-5xl">🗿</span>
          <h1 className="font-display text-2xl font-bold text-sol-soft">Menu do Mestre — NPCs</h1>
          <p className="text-zinc-400">
            Entre na sua conta para montar sua galeria de NPCs, reutilizá-los entre mesas e
            compartilhá-los com a comunidade.
          </p>
          <Link href="/entrar" className="btn-sol">
            👑 Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">🗿 NPCs do Mestre</h1>
        <p className="mt-1 text-zinc-400">
          Sua galeria de personagens do mundo — aliados, vilões e figurantes. História, objetivo
          e status ficam <b>só com você</b>. Ao colocar um NPC numa mesa, os jogadores veem apenas
          um card com a imagem e o nome.
        </p>
      </div>
      <NpcManager />
    </div>
  );
}
