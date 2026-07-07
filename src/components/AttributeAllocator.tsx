"use client";

import { motion } from "framer-motion";
import {
  ATTRIBUTES,
  AttributeKey,
  MAX_ATTRIBUTE,
  rankFor,
} from "@/lib/solando/rules";
import {
  Attributes,
  Character,
  clampAttribute,
  raceClassAttrBonus,
  remainingAttributePoints,
} from "@/lib/solando/character";
import { gamblerLuck, rollLuck } from "@/lib/solando/dice";
import {
  ARCHETYPES,
  Archetype,
  suggestDistribution,
} from "@/lib/solando/balance";
import { totalAttributePoints } from "@/lib/solando/character";

interface Props {
  character: Character;
  onChange: (attrs: Attributes, luckRoll?: number) => void;
}

const spectrumBar: Record<string, string> = {
  mente: "from-mente-deep to-mente",
  corpo: "from-corpo-deep to-corpo",
  alma: "from-alma-deep to-alma",
  sol: "from-sol-deep to-sol",
};

export function AttributeAllocator({ character, onChange }: Props) {
  const remaining = remainingAttributePoints(character);
  const total = totalAttributePoints(character);
  const bonus = raceClassAttrBonus(character);
  const totalBonus = Object.values(bonus).reduce((s, v) => s + (v || 0), 0);
  // A Sorte é rolada UMA única vez (dado normal OU Homem Apostador).
  const luckLocked = character.luckRoll > 0;

  function setAttr(key: AttributeKey, value: number) {
    const clamped = clampAttribute(value);
    onChange({ ...character.attributes, [key]: clamped });
  }

  function bump(key: AttributeKey, delta: number) {
    const current = character.attributes[key];
    if (delta > 0 && remaining <= 0) return; // sem pontos
    setAttr(key, current + delta);
  }

  function doRollLuck() {
    if (luckLocked) return; // uso único
    const v = rollLuck();
    onChange({ ...character.attributes, sorte: v }, v);
  }

  function doGamble() {
    if (luckLocked) return; // uso único
    const g = gamblerLuck();
    onChange({ ...character.attributes, sorte: g.luck }, g.luck);
  }

  function applyArchetype(a: Archetype) {
    const dist = suggestDistribution(a, total);
    // Preserva a sorte já rolada.
    dist.sorte = character.attributes.sorte;
    onChange(dist, character.luckRoll);
  }

  return (
    <div className="space-y-5">
      {/* Orçamento de pontos */}
      <div className="card flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-zinc-400">Pontos para distribuir</p>
          <p className="text-2xl font-black text-zinc-100">
            <span className={remaining < 0 ? "text-red-400" : "text-sol"}>
              {remaining}
            </span>
            <span className="text-base text-zinc-500"> / {total}</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {ARCHETYPES.map((a) => (
            <button
              key={a.key}
              title={a.blurb}
              onClick={() => applyArchetype(a.key)}
              className="chip hover:border-mente/60 hover:text-mente-soft"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {totalBonus > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
        >
          <span className="text-xl">🧬</span>
          <p className="text-zinc-300">
            <b className="text-emerald-400">+{totalBonus} de atributo</b> vindo de raça/classe,
            somados por cima dos pontos livres. Lembre-se: essas vantagens vêm com as
            <b className="text-red-400"> fraquezas</b> da raça (equilíbrio narrativo).
          </p>
        </motion.div>
      )}

      {/* Atributos */}
      <div className="space-y-3">
        {ATTRIBUTES.map((def) => {
          const base = character.attributes[def.key];
          const attrBonus = bonus[def.key] ?? 0;
          const value = base + attrBonus;
          const rank = rankFor(value);
          const isLuck = def.key === "sorte";

          return (
            <motion.div
              key={def.key}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-zinc-100">
                      {def.label}
                    </span>
                    <motion.span
                      key={rank.rank}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${rank.color} ${rank.ring}/40`}
                    >
                      {rank.rank}
                    </motion.span>
                    <span className="text-xs text-zinc-500">
                      {rank.diceMod > 0
                        ? `+${rank.diceMod} vantagem`
                        : rank.diceMod < 0
                        ? `${rank.diceMod} desvantagem`
                        : "normal"}
                    </span>
                    {attrBonus > 0 && (
                      <span
                        title={`Base ${base} + ${attrBonus} de raça/classe = ${value} efetivo`}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 animate-glowRing"
                      >
                        🧬 +{attrBonus} raça/classe
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{def.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost !px-3 !py-1.5"
                    onClick={() => bump(def.key, -1)}
                  >
                    −
                  </button>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      value={base}
                      onChange={(e) => setAttr(def.key, Number(e.target.value) || 0)}
                      className="input w-16 text-center"
                    />
                    {attrBonus > 0 && (
                      <span className="mt-1 text-[10px] font-bold text-emerald-300">
                        efetivo {value}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn-ghost !px-3 !py-1.5"
                    onClick={() => bump(def.key, +1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Barra visual (base + bônus destacado) */}
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-void-950">
                <motion.div
                  className={`h-full bg-gradient-to-r ${spectrumBar[def.spectrum]}`}
                  animate={{ width: `${(base / MAX_ATTRIBUTE) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
                {attrBonus > 0 && (
                  <motion.div
                    className="h-full bg-emerald-400/80"
                    animate={{ width: `${(attrBonus / MAX_ATTRIBUTE) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              {isLuck && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className="btn-ghost !py-1.5 text-sm"
                    onClick={doRollLuck}
                    disabled={luckLocked}
                  >
                    🎲 Rolar Sorte (1d20)
                  </button>
                  <button
                    className="btn-sol !py-1.5 text-sm"
                    onClick={doGamble}
                    disabled={luckLocked}
                  >
                    🃏 Homem Apostador
                  </button>
                  {luckLocked ? (
                    <span className="chip text-sol-soft">
                      🔒 Sorte definida: {character.luckRoll} (uso único)
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">
                      Escolha um: a Sorte é rolada uma única vez.
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
