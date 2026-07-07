"use client";

import { motion } from "framer-motion";
import {
  Character,
  competencePoints,
  competencePointsSpent,
  derivedStats,
  forceRank,
  talentPoints,
  talentPointsSpent,
} from "@/lib/solando/character";
import { INVENTORY_BY_FORCE_RANK } from "@/lib/solando/rules";

export function DerivedStatsPanel({ character }: { character: Character }) {
  const d = derivedStats(character);
  const fRank = forceRank(character);

  const stats = [
    { label: "Vida", value: d.vida, sub: "Constituição × 10", color: "text-corpo-soft" },
    { label: "Sanidade", value: d.sanidade, sub: "Aspecto × 10", color: "text-alma-soft" },
    { label: "Entropia (mana)", value: d.entropia, sub: d.entropiaFormula, color: "text-mente-soft" },
  ];

  const talentAvail = talentPoints(character);
  const talentSpent = talentPointsSpent(character);
  const compAvail = competencePoints(character);
  const compSpent = competencePointsSpent(character);

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-display text-lg font-bold text-zinc-100">
        Status Derivados
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ scale: 1.04, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="rounded-xl border border-white/10 bg-void-950/50 p-3 text-center hover:ring-1 hover:ring-mente/40"
          >
            <motion.div
              key={s.value}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 14 }}
              className={`text-2xl font-black ${s.color}`}
            >
              {s.value}
            </motion.div>
            <div className="text-xs font-semibold text-zinc-300">{s.label}</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-void-950/50 p-3">
          <div className="text-zinc-500">Multiplicador de dano</div>
          <div className="font-bold text-zinc-100">× {d.danoMultiplicador}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-void-950/50 p-3">
          <div className="text-zinc-500">XP p/ próximo nível</div>
          <div className="font-bold text-zinc-100">
            {character.xp}/{d.xpParaProximoNivel}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-void-950/50 p-3">
          <div className="text-zinc-500">Talentos</div>
          <div
            className={`font-bold ${talentSpent > talentAvail ? "text-red-400" : "text-zinc-100"}`}
          >
            {talentSpent}/{talentAvail} pts
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-void-950/50 p-3">
          <div className="text-zinc-500">Competências</div>
          <div
            className={`font-bold ${compSpent > compAvail ? "text-red-400" : "text-zinc-100"}`}
          >
            {compSpent}/{compAvail} pts
          </div>
        </div>
      </div>

      {d.entropiaKiTotal > 0 && (
        <div className="mt-3 rounded-xl border border-sol/25 bg-sol/5 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sol-soft">⚡ Entropia-KI (moeda)</span>
            <span className="text-zinc-300">
              {d.entropiaKiRestante}/{d.entropiaKiTotal} livres
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-void-950">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sol-deep to-sol"
              animate={{
                width: `${
                  d.entropiaKiTotal > 0
                    ? (d.entropiaKiGasto / d.entropiaKiTotal) * 100
                    : 0
                }%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-500">
            Moeda vinda de condições/desvantagens (1 pt condição = 2 KI). Gaste em talentos,
            competências, menos custo ou +potência de skills (1:1). NÃO soma na mana.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-void-950/50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Inventário (Rank de Força {fRank.rank})</span>
          <span className="chip">{fRank.label}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {INVENTORY_BY_FORCE_RANK[fRank.rank].label}
        </p>
      </div>
    </div>
  );
}
