"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { characterRepo } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import {
  type Character,
  derivedStats,
  effectiveAttributes,
  forceRank,
} from "@/lib/solando/character";
import { ATTRIBUTES } from "@/lib/solando/rules";
import { resolveRace, resolveClass } from "@/lib/solando/customContent";

/**
 * Preview consultável de uma ficha (link compartilhável).
 * A permissão de LEITURA é garantida pelo RLS do Supabase: o jogador só
 * enxerga a própria ficha (ou fichas de mesas que participa); o mestre enxerga
 * as fichas vinculadas às suas mesas. Se não houver permissão, `get` volta vazio.
 * As barras de Vida/Entropia são editáveis e salvas — quem não for dono da ficha
 * altera apenas localmente (o save é bloqueado pelo RLS e tratado com aviso).
 */
export default function VerFichaPage({ params }: { params: { id: string } }) {
  const { ready } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "denied">(
    "idle",
  );

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const c = await characterRepo.get(params.id);
        if (!alive) return;
        if (!c) {
          setNotFound(true);
        } else {
          setCharacter(c);
        }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, params.id]);

  const derived = useMemo(
    () => (character ? derivedStats(character) : null),
    [character],
  );
  const attrs = useMemo(
    () => (character ? effectiveAttributes(character) : null),
    [character],
  );

  const persist = useCallback(async (next: Character) => {
    setSaveState("saving");
    try {
      await characterRepo.save(next);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("denied");
    }
  }, []);

  const setVida = useCallback(
    (value: number) => {
      if (!character || !derived) return;
      const clamped = Math.max(0, Math.min(derived.vida, Math.round(value)));
      const next = { ...character, currentVida: clamped };
      setCharacter(next);
      void persist(next);
    },
    [character, derived, persist],
  );

  const setEntropia = useCallback(
    (value: number) => {
      if (!character || !derived) return;
      const clamped = Math.max(0, Math.min(derived.entropia, Math.round(value)));
      const next = { ...character, currentEntropia: clamped };
      setCharacter(next);
      void persist(next);
    },
    [character, derived, persist],
  );

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-zinc-500">
        Carregando ficha…
      </div>
    );
  }

  if (notFound || !character || !derived || !attrs) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-black title-gradient">Ficha indisponível</h1>
        <p className="text-zinc-400">
          Esta ficha não existe ou você não tem permissão para visualizá-la.
        </p>
        <Link href="/ficha" className="btn-ghost inline-block">
          Voltar às fichas
        </Link>
      </div>
    );
  }

  const race = resolveRace(character.race);
  const klass = resolveClass(character.charClass);
  const currentVida = character.currentVida ?? derived.vida;
  const currentEntropia = character.currentEntropia ?? derived.entropia;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl font-black text-void-950"
          style={{ background: character.accent }}
        >
          {character.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.avatarUrl}
              alt={character.name || "Avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            (character.name.charAt(0) || "?").toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-black title-gradient">
            {character.name || "Sem nome"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {[race?.name, klass?.name].filter(Boolean).join(" · ") || "—"}
            {" · "}
            Nível {character.level} · Força {forceRank(character).rank}
          </p>
        </div>
        <Link href={`/ficha/${character.id}`} className="btn-ghost text-sm">
          Editar
        </Link>
      </div>

      {/* Barras de status editáveis */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatBar
          label="Vida"
          color="#ef4444"
          current={currentVida}
          max={derived.vida}
          onChange={setVida}
        />
        <StatBar
          label="Entropia (mana)"
          color="#a855f7"
          current={currentEntropia}
          max={derived.entropia}
          onChange={setEntropia}
        />
      </div>
      <div className="min-h-[1rem] text-xs">
        {saveState === "saving" && <span className="text-zinc-500">Salvando…</span>}
        {saveState === "saved" && <span className="text-emerald-400">Salvo ✓</span>}
        {saveState === "denied" && (
          <span className="text-amber-400">
            Alteração local (você não é o dono desta ficha).
          </span>
        )}
      </div>

      {/* Atributos */}
      <section className="card">
        <h2 className="mb-3 text-lg font-bold text-zinc-200">Atributos</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ATTRIBUTES.map((def) => (
            <div key={def.key} className="rounded-lg bg-void-950/50 p-3 text-center">
              <div className="text-xl font-black text-zinc-100">
                {attrs[def.key]}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                {def.short}
              </div>
            </div>
          ))}
          <div className="rounded-lg bg-void-950/50 p-3 text-center">
            <div className="text-xl font-black text-alma-soft">
              {derived.sanidade}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">
              San.
            </div>
          </div>
        </div>
      </section>

      {/* Condições */}
      {character.conditions.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-lg font-bold text-zinc-200">Condições</h2>
          <ul className="space-y-2">
            {character.conditions.map((cond) => (
              <li
                key={cond.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-void-950/40 p-3"
              >
                <div>
                  <div className="font-semibold text-zinc-100">{cond.name}</div>
                  {cond.note && (
                    <div className="text-xs text-zinc-400">{cond.note}</div>
                  )}
                </div>
                <span className="chip shrink-0">{cond.points} pt</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Skills */}
      {character.skills.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-lg font-bold text-zinc-200">Skills</h2>
          <ul className="space-y-2">
            {character.skills.map((skill) => (
              <li key={skill.id} className="rounded-lg bg-void-950/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-zinc-100">{skill.name}</span>
                  <span className="chip shrink-0">{skill.cost} entr.</span>
                </div>
                {skill.description && (
                  <p className="mt-1 text-xs text-zinc-400">{skill.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatBar({
  label,
  color,
  current,
  max,
  onChange,
}: {
  label: string;
  color: string;
  current: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  return (
    <div className="card">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-bold text-zinc-200">{label}</span>
        <span className="text-sm text-zinc-400">
          <b className="text-zinc-100">{current}</b> / {max}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-void-950">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-current"
        style={{ accentColor: color }}
        aria-label={`Ajustar ${label}`}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onChange(current - 5)}>
          −5
        </button>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onChange(current - 1)}>
          −1
        </button>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onChange(current + 1)}>
          +1
        </button>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onChange(current + 5)}>
          +5
        </button>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => onChange(max)}>
          Cheia
        </button>
      </div>
    </div>
  );
}
