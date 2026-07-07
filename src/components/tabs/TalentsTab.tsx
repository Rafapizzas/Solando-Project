"use client";

import { useState } from "react";
import {
  Character,
  Talent,
  talentPoints,
  talentPointsSpent,
} from "@/lib/solando/character";
import { uid } from "@/lib/storage";
import { TALENTS, TALENT_CATEGORIES, TalentDef } from "@/lib/solando/talents";

interface TabProps {
  character: Character;
  patch: (p: Partial<Character>) => void;
}

export function TalentsTab({ character, patch }: TabProps) {
  const available = talentPoints(character);
  const spent = talentPointsSpent(character);
  const left = available - spent;
  const [open, setOpen] = useState(false);

  function addTalent(def: TalentDef, points: number, effect: string) {
    const t: Talent = {
      id: uid("tal"),
      catalogId: def.id,
      name: def.name,
      cost: points,
      description: effect,
    };
    patch({ talents: [...character.talents, t] });
  }
  function remove(id: string) {
    patch({ talents: character.talents.filter((t) => t.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-zinc-100">Talentos</h3>
          <span className={`chip ${spent > available ? "text-red-400" : "text-zinc-300"}`}>
            {spent}/{available} pontos
          </span>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          Você começa com <b className="text-sol-soft">5 pontos de talento</b> no nível 0, +1
          por nível (algumas classes dão bônus). {left >= 0 ? `Restam ${left}.` : ""}
        </p>

        <div className="space-y-2">
          {character.talents.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-white/10 bg-void-950/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-zinc-100">{t.name}</span>
                  <span className="chip ml-2 text-[10px] text-sol-soft">{t.cost} pt</span>
                </div>
                <button
                  className="btn-ghost !px-3 !py-1.5 text-red-400"
                  onClick={() => remove(t.id)}
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{t.description}</p>
            </div>
          ))}
          {character.talents.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhum talento escolhido.</p>
          )}
        </div>

        <button className="btn-primary mt-3 w-full" onClick={() => setOpen((v) => !v)}>
          {open ? "Fechar catálogo" : "⭐ Escolher talentos do catálogo"}
        </button>
      </div>

      {open && (
        <div className="card space-y-4 p-5">
          {TALENT_CATEGORIES.map((cat) => {
            const list = TALENTS.filter((t) => t.category === cat.key);
            return (
              <div key={cat.key}>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {cat.label}
                </h4>
                <div className="space-y-2">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-white/10 bg-void-950/40 p-3"
                    >
                      <div className="text-sm font-semibold text-zinc-100">{t.name}</div>
                      <p className="text-xs text-zinc-500">{t.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {t.tiers.map((tier) => {
                          const affordable = tier.points <= left;
                          return (
                            <button
                              key={tier.points}
                              onClick={() => addTalent(t, tier.points, tier.effect)}
                              disabled={!affordable}
                              title={tier.effect}
                              className={`chip text-left ${
                                affordable
                                  ? "hover:border-sol/60 hover:text-sol-soft"
                                  : "opacity-40"
                              }`}
                            >
                              <b className="text-sol-soft">{tier.points}pt</b>
                              <span className="max-w-[220px] truncate">{tier.effect}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
