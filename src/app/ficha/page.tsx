"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Character, derivedStats, forceRank } from "@/lib/solando/character";
import { characterRepo, grantsRepo } from "@/lib/storage";
import { analyzeCharacter } from "@/lib/solando/balance";
import { findRace } from "@/lib/solando/races";
import { findClass } from "@/lib/solando/classes";
import { AICharacterForge } from "@/components/AICharacterForge";

export default function FichasPage() {
  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [shared, setShared] = useState<Character[]>([]);

  async function load() {
    const [mine, sharedWithMe] = await Promise.all([
      characterRepo.list(),
      grantsRepo.sharedWithMe().catch(() => []),
    ]);
    setCharacters(mine);
    setShared(sharedWithMe);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Excluir esta ficha? Essa ação não pode ser desfeita.")) return;
    await characterRepo.remove(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black title-gradient">Minhas Fichas</h1>
          <p className="mt-1 text-zinc-400">Seus personagens do universo Solando.</p>
        </div>
        <Link href="/ficha/nova" className="btn-primary">
          + Nova ficha
        </Link>
      </div>

      <AICharacterForge />

      {characters === null ? (
        <div className="py-16 text-center text-zinc-500">Carregando...</div>
      ) : characters.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <span className="text-5xl">📜</span>
          <p className="text-zinc-400">Você ainda não criou nenhuma ficha.</p>
          <Link href="/ficha/nova" className="btn-primary">
            Criar minha primeira ficha
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => {
            const d = derivedStats(c);
            const report = analyzeCharacter(c);
            return (
              <div
                key={c.id}
                className="card-glow flex flex-col p-5"
                style={{ borderColor: `${c.accent}33` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl text-lg font-black text-void-950"
                    style={{ background: c.accent }}
                  >
                    {c.name.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-bold text-zinc-100">
                      {c.name || "Sem nome"}
                    </h3>
                    <p className="truncate text-xs text-zinc-500">
                      {findRace(c.race)?.name || "—"} · {findClass(c.charClass)?.name || "—"} · Nv {c.level}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-void-950/50 p-2">
                    <div className="font-bold text-corpo-soft">{d.vida}</div>
                    <div className="text-[10px] text-zinc-500">Vida</div>
                  </div>
                  <div className="rounded-lg bg-void-950/50 p-2">
                    <div className="font-bold text-alma-soft">{d.sanidade}</div>
                    <div className="text-[10px] text-zinc-500">San.</div>
                  </div>
                  <div className="rounded-lg bg-void-950/50 p-2">
                    <div className="font-bold text-mente-soft">{d.entropia}</div>
                    <div className="text-[10px] text-zinc-500">Entr.</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="chip">Força {forceRank(c).rank}</span>
                  <span
                    className={
                      report.valid ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    equilíbrio {report.score}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href={`/ficha/${c.id}`} className="btn-ghost flex-1 text-sm">
                    Abrir
                  </Link>
                  <Link href={`/ficha/${c.id}/ver`} className="btn-ghost flex-1 text-sm">
                    Ver
                  </Link>
                  <button
                    className="btn-ghost !px-3 text-red-400"
                    onClick={() => remove(c.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shared.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xl font-black text-zinc-100">
            🤝 Compartilhadas comigo
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((c) => {
              const d = derivedStats(c);
              return (
                <div
                  key={c.id}
                  className="card flex flex-col p-5"
                  style={{ borderColor: `${c.accent}33` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-xl text-lg font-black text-void-950"
                      style={{ background: c.accent }}
                    >
                      {c.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold text-zinc-100">
                        {c.name || "Sem nome"}
                      </h3>
                      <p className="truncate text-xs text-zinc-500">
                        {findRace(c.race)?.name || "—"} · {findClass(c.charClass)?.name || "—"} · Nv{" "}
                        {c.level}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-void-950/50 p-2">
                      <div className="font-bold text-corpo-soft">{d.vida}</div>
                      <div className="text-[10px] text-zinc-500">Vida</div>
                    </div>
                    <div className="rounded-lg bg-void-950/50 p-2">
                      <div className="font-bold text-alma-soft">{d.sanidade}</div>
                      <div className="text-[10px] text-zinc-500">San.</div>
                    </div>
                    <div className="rounded-lg bg-void-950/50 p-2">
                      <div className="font-bold text-mente-soft">{d.entropia}</div>
                      <div className="text-[10px] text-zinc-500">Entr.</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/ficha/${c.id}/ver`} className="btn-ghost w-full text-sm">
                      Ver ficha
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
