"use client";

import { useState } from "react";
import {
  Character,
  Condition,
  EntropyAllocation,
  conditionKi,
  conditionPointsRaw,
  emptyEntropyAlloc,
  entropyKiRemaining,
  entropyKiTotal,
} from "@/lib/solando/character";
import { uid } from "@/lib/storage";
import {
  CONDITIONS_CATALOG,
  ConditionDef,
  MAX_CONDITION_POINTS,
} from "@/lib/solando/conditions";

interface TabProps {
  character: Character;
  patch: (p: Partial<Character>) => void;
}

const KI_BUCKETS: Array<{ key: keyof EntropyAllocation; label: string; hint: string }> = [
  { key: "talentos", label: "Talentos", hint: "1 KI = +1 ponto de talento" },
  { key: "competencias", label: "Competências", hint: "1 KI = +1 nível de competência" },
  { key: "custoSkill", label: "Menos custo", hint: "1 KI = -1 de custo de skill" },
  { key: "potencia", label: "Potência", hint: "1 KI = +1 de dano/cura" },
];

export function ConditionsTab({ character, patch }: TabProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const raw = conditionPointsRaw(character);
  const ki = conditionKi(character);
  const kiTotal = entropyKiTotal(character);
  const kiRestante = entropyKiRemaining(character);
  const alloc = character.entropyAlloc ?? emptyEntropyAlloc();

  function setAlloc(key: keyof EntropyAllocation, delta: number) {
    // Sem trava: permite passar do total de KI; o contador vira dica (fica
    // vermelho quando negativo), mas nunca impede a alocação.
    const cur = alloc[key] ?? 0;
    const next = Math.max(0, cur + delta);
    patch({ entropyAlloc: { ...emptyEntropyAlloc(), ...alloc, [key]: next } });
  }

  function add(def: ConditionDef) {
    const c: Condition = {
      id: uid("cond"),
      catalogId: def.id,
      name: def.name,
      points: def.min,
      note: def.description,
    };
    patch({ conditions: [...character.conditions, c] });
  }
  function addManual() {
    const c: Condition = {
      id: uid("cond"),
      name: "Nova condição",
      points: 1,
      note: "",
    };
    patch({ conditions: [...character.conditions, c] });
  }
  function update(id: string, p: Partial<Condition>) {
    patch({
      conditions: character.conditions.map((c) => (c.id === id ? { ...c, ...p } : c)),
    });
  }
  function remove(id: string) {
    patch({ conditions: character.conditions.filter((c) => c.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-zinc-100">Condições</h3>
          <span className={`chip ${raw > MAX_CONDITION_POINTS ? "text-red-400" : "text-sol-soft"}`}>
            {raw}/{MAX_CONDITION_POINTS} pts · +{ki} Entropia-KI
          </span>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          Cada ponto de condição gera <b className="text-sol-soft">+2 de Entropia-KI</b> (teto
          de {MAX_CONDITION_POINTS} pontos). A Entropia-KI é uma <b>moeda</b> — não soma na mana.
          Gaste-a no painel abaixo em talentos, competências, menos custo ou mais potência de
          skills.
        </p>

        <div className="space-y-2">
          {character.conditions.map((c) => {
            const def = c.catalogId
              ? CONDITIONS_CATALOG.find((d) => d.id === c.catalogId)
              : undefined;
            const min = def?.min ?? 1;
            const max = def?.max ?? MAX_CONDITION_POINTS;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/10 bg-void-950/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="input flex-1"
                    value={c.name}
                    onChange={(e) => update(c.id, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500">pts</span>
                    <button
                      className="btn-ghost !px-2.5 !py-1.5"
                      onClick={() => update(c.id, { points: Math.max(min, c.points - 1) })}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-sol-soft">{c.points}</span>
                    <button
                      className="btn-ghost !px-2.5 !py-1.5"
                      onClick={() => update(c.id, { points: Math.min(max, c.points + 1) })}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="btn-ghost !px-3 !py-2 text-red-400"
                    onClick={() => remove(c.id)}
                  >
                    ✕
                  </button>
                </div>
                {c.note && <p className="mt-1 text-xs text-zinc-400">{c.note}</p>}
              </div>
            );
          })}
          {character.conditions.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma condição.</p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary flex-1" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar catálogo" : "⚖️ Escolher condições do catálogo"}
          </button>
          <button className="btn-ghost" onClick={addManual}>
            + Manual
          </button>
        </div>
      </div>

      {/* Alocação de Entropia-KI */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-sol-soft">⚡ Entropia-KI (moeda)</h3>
          <span className={`chip ${kiRestante < 0 ? "text-red-400" : "text-sol-soft"}`}>
            {kiRestante}/{kiTotal} livres
          </span>
        </div>
        {kiTotal === 0 ? (
          <p className="text-sm text-zinc-500">
            Sem Entropia-KI ainda. Adicione condições/desvantagens (ou ganhe em sessão) para
            obter a moeda.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {KI_BUCKETS.map((b) => (
              <div
                key={b.key}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-void-950/40 p-3"
              >
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{b.label}</div>
                  <div className="text-[10px] text-zinc-500">{b.hint}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost !px-3 !py-1.5"
                    onClick={() => setAlloc(b.key, -1)}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-sol-soft">
                    {alloc[b.key] ?? 0}
                  </span>
                  <button
                    className="btn-sol !px-3 !py-1.5"
                    onClick={() => setAlloc(b.key, +1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="card space-y-3 p-5">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              🔍
            </span>
            <input
              className="input pl-9"
              placeholder="Buscar condição…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {CONDITIONS_CATALOG.filter((c) => {
              const q = query.trim().toLowerCase();
              return (
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q)
              );
            })
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => add(c)}
                  className="rounded-xl border border-white/10 bg-void-950/40 p-3 text-left transition hover:border-sol/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-100">{c.name}</span>
                    <span className="chip text-[10px] text-sol-soft">
                      {c.min === c.max ? c.min : `${c.min}–${c.max}`} pt
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{c.description}</p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
