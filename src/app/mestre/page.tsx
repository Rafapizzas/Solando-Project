"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Campaign, campaignRepo, tableCharacterRepo } from "@/lib/storage";
import { Character, derivedStats, effectiveAttributes, forceRank } from "@/lib/solando/character";
import { analyzeCharacter } from "@/lib/solando/balance";
import { ATTRIBUTES, rankFor } from "@/lib/solando/rules";
import { findRace } from "@/lib/solando/races";
import { findClass } from "@/lib/solando/classes";
import { useAuth } from "@/lib/auth";

export default function MestrePage() {
  const { ready, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [chars, setChars] = useState<Character[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const cs = await campaignRepo.list();
      setCampaigns(cs);
      if (cs[0]) setSelected(cs[0].id);
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selected) {
      setChars([]);
      return;
    }
    (async () => {
      const list = await tableCharacterRepo.list(selected);
      setChars(list.map((tc) => tc.character));
    })();
  }, [selected]);

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <span className="text-5xl">🔐</span>
          <h1 className="font-display text-2xl font-bold text-sol-soft">Entre para gerenciar</h1>
          <p className="text-zinc-400">
            Faça login para criar e gerenciar suas mesas. Você é o mestre das mesas que criar.
          </p>
          <Link href="/entrar" className="btn-sol">
            👑 Entrar
          </Link>
        </div>
      </div>
    );
  }

  const campaign = campaigns.find((c) => c.id === selected);
  const members = chars;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Painel do Mestre</h1>
        <p className="mt-1 text-zinc-400">
          Acompanhe as fichas dos jogadores de cada campanha.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <span className="text-5xl">👁️</span>
          <p className="text-zinc-400">
            Nenhuma campanha ainda. Crie uma mesa para começar.
          </p>
          <Link href="/mesa" className="btn-primary">
            Ir para Mesas
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`btn text-sm ${
                  selected === c.id ? "btn-primary" : "btn-ghost"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {members.length === 0 ? (
            <div className="card py-12 text-center text-zinc-500">
              Nenhum personagem nesta campanha.{" "}
              <Link
                href={`/mesa/${campaign?.id}`}
                className="text-mente-soft underline"
              >
                Adicionar na mesa
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((c) => (
                <MasterCharacterCard key={c.id} character={c} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MasterCharacterCard({ character }: { character: Character }) {
  const d = derivedStats(character);
  const report = analyzeCharacter(character);

  return (
    <div
      className="card p-5"
      style={{ borderColor: `${character.accent}33` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl text-lg font-black text-void-950"
            style={{ background: character.accent }}
          >
            {character.name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-zinc-100">
              {character.name || "Sem nome"}
            </h3>
            <p className="text-xs text-zinc-500">
              {findRace(character.race)?.name || "—"} · {findClass(character.charClass)?.name || "—"} · Nv{" "}
              {character.level} · Força {forceRank(character).rank}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-center">
          <Stat label="Vida" value={d.vida} color="text-corpo-soft" />
          <Stat label="Sanidade" value={d.sanidade} color="text-alma-soft" />
          <Stat label="Entropia" value={d.entropia} color="text-mente-soft" />
          <Link href={`/ficha/${character.id}`} className="btn-ghost !py-1.5 text-sm">
            Abrir
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ATTRIBUTES.map((a) => {
          const eff = effectiveAttributes(character);
          const rank = rankFor(eff[a.key]);
          return (
            <div
              key={a.key}
              className="rounded-lg border border-white/10 bg-void-950/40 p-2 text-center"
            >
              <div className="text-[10px] text-zinc-500">{a.short}</div>
              <div className="font-bold text-zinc-100">
                {eff[a.key]}
              </div>
              <div className={`text-[10px] font-bold ${rank.color}`}>
                {rank.rank}
              </div>
            </div>
          );
        })}
      </div>

      {!report.valid && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-400">
          ⚠ Ficha com pendências de balanceamento (equilíbrio {report.score}).
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className={`text-lg font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}
