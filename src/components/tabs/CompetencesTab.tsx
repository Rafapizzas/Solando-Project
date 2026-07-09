"use client";

import { useState } from "react";
import {
  Character,
  CompetenceEntry,
  competencePoints,
  competencePointsSpent,
} from "@/lib/solando/character";
import {
  COMPETENCES,
  competenceCap,
  findCompetence,
} from "@/lib/solando/competences";

interface TabProps {
  character: Character;
  patch: (p: Partial<Character>) => void;
}

export function CompetencesTab({ character, patch }: TabProps) {
  const available = competencePoints(character);
  const spent = competencePointsSpent(character);
  const capBonus = competenceCap(character.level);
  const capLevel = capBonus / 10;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function setLevel(id: string, level: number) {
    const clamped = Math.max(0, Math.min(capLevel, level));
    const existing = character.competences.find((c) => c.id === id);
    let next: CompetenceEntry[];
    if (existing) {
      next =
        clamped === 0
          ? character.competences.filter((c) => c.id !== id)
          : character.competences.map((c) => (c.id === id ? { ...c, level: clamped } : c));
    } else if (clamped > 0) {
      next = [...character.competences, { id, level: clamped }];
    } else {
      next = character.competences;
    }
    patch({ competences: next });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-zinc-100">Competências</h3>
          <span className={`chip ${spent > available ? "text-red-400" : "text-zinc-300"}`}>
            {spent}/{available} pontos
          </span>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          3 pontos iniciais + 1 a cada 10 de Mente ou Destreza. Cada nível dá{" "}
          <b className="text-alma-soft">+10 no dado</b>. Teto no seu nível: NVL {capLevel} (
          +{capBonus}).{" "}
          {spent > available && (
            <b className="text-amber-300">Você passou do sugerido (dica, sem trava).</b>
          )}
        </p>

        <div className="space-y-2">
          {character.competences.map((c) => {
            const def = findCompetence(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-950/40 p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold text-zinc-100">
                    {def?.name ?? c.id}
                  </div>
                  <div className="text-[10px] text-alma-soft">
                    NVL {c.level} · +{c.level * 10} no dado
                  </div>
                </div>
                <button className="btn-ghost !px-3 !py-1.5" onClick={() => setLevel(c.id, c.level - 1)}>
                  −
                </button>
                <span className="w-6 text-center font-bold">{c.level}</span>
                <button
                  className="btn-ghost !px-3 !py-1.5"
                  onClick={() => setLevel(c.id, c.level + 1)}
                  disabled={c.level >= capLevel}
                >
                  +
                </button>
              </div>
            );
          })}
          {character.competences.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma competência ainda.</p>
          )}
        </div>

        <button className="btn-primary mt-3 w-full" onClick={() => setOpen((v) => !v)}>
          {open ? "Fechar lista" : "📚 Adicionar competências"}
        </button>
      </div>

      {open && (
        <div className="card space-y-3 p-5">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              🔍
            </span>
            <input
              className="input pl-9"
              placeholder="Buscar competência…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {COMPETENCES.filter((c) => !character.competences.some((e) => e.id === c.id))
              .filter((c) => {
                const q = query.trim().toLowerCase();
                return (
                  !q ||
                  c.name.toLowerCase().includes(q) ||
                  c.description.toLowerCase().includes(q)
                );
              })
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => setLevel(c.id, 1)}
                  className="rounded-xl border border-white/10 bg-void-950/40 p-3 text-left transition hover:border-alma/50"
                >
                  <div className="text-sm font-semibold text-alma-soft">{c.name}</div>
                  <p className="text-xs text-zinc-400">{c.description}</p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
