"use client";

import Link from "next/link";
import { Character } from "@/lib/solando/character";
import { ENTROPY_SOURCES, ATTRIBUTES } from "@/lib/solando/rules";
import {
  allRaces,
  allClasses,
  resolveRace,
  resolveClass,
  raceAttrBonus,
  classAttrBonus,
  AttrBonus,
} from "@/lib/solando/customContent";

interface TabProps {
  character: Character;
  patch: (p: Partial<Character>) => void;
}

function BonusPills({ bonus }: { bonus: AttrBonus }) {
  const entries = Object.entries(bonus).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => {
        const label = ATTRIBUTES.find((a) => a.key === k)?.short ?? k;
        return (
          <span key={k} className="chip text-[10px] text-emerald-400">
            +{v} {label}
          </span>
        );
      })}
    </div>
  );
}

export function IdentityTab({ character, patch }: TabProps) {
  const race = resolveRace(character.race);
  const klass = resolveClass(character.charClass);
  const races = allRaces();
  const classes = allClasses();

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Raça e classe podem conceder bônus de atributo (aplicados aos status).
        </p>
        <Link href="/criar" className="chip hover:border-mente/60 hover:text-mente-soft">
          + Criar raça/classe
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Raça</label>
          <select
            className="input"
            value={character.race}
            onChange={(e) => patch({ race: e.target.value })}
          >
            <option value="">— Escolha uma raça —</option>
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {(r as { custom?: boolean }).custom ? " (sua)" : ""}
              </option>
            ))}
          </select>
          {race && (
            <div className="mt-2 rounded-xl border border-white/10 bg-void-950/40 p-3 text-xs">
              <p className="text-zinc-400">{race.lore}</p>
              <p className="mt-1">
                <b className="text-emerald-400">Habilidades:</b>{" "}
                <span className="text-zinc-300">{race.abilities}</span>
              </p>
              <p className="mt-1">
                <b className="text-red-400">Fraquezas:</b>{" "}
                <span className="text-zinc-300">{race.weaknesses}</span>
              </p>
              <BonusPills bonus={raceAttrBonus(character.race)} />
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Classe</label>
          <select
            className="input"
            value={character.charClass}
            onChange={(e) => patch({ charClass: e.target.value })}
          >
            <option value="">— Escolha uma classe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.secret ? " (secreta)" : ""}
                {(c as { custom?: boolean }).custom ? " (sua)" : ""}
              </option>
            ))}
          </select>
          {klass && (
            <div className="mt-2 rounded-xl border border-white/10 bg-void-950/40 p-3 text-xs">
              <p className="text-zinc-500">{klass.role}</p>
              <p className="mt-1">
                <b className="text-zinc-200">Nível 0:</b>{" "}
                <span className="text-zinc-300">{klass.level0}</span>
              </p>
              {klass.bonus?.note && (
                <p className="mt-1 text-sol-soft">Bônus: {klass.bonus.note}</p>
              )}
              <BonusPills bonus={classAttrBonus(character.charClass)} />
            </div>
          )}
        </div>

        <div>
          <label className="label">Sexo</label>
          <input
            className="input"
            value={character.sex}
            onChange={(e) => patch({ sex: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Idade</label>
          <input
            className="input"
            value={character.age}
            onChange={(e) => patch({ age: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Nível</label>
          <input
            type="number"
            min={0}
            className="input"
            value={character.level}
            onChange={(e) => patch({ level: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className="label">Moral (-100 a 100)</label>
          <input
            type="number"
            min={-100}
            max={100}
            className="input"
            value={character.moral}
            onChange={(e) =>
              patch({ moral: Math.max(-100, Math.min(100, Number(e.target.value) || 0)) })
            }
          />
        </div>
      </div>

      <div>
        <label className="label">Fonte de Entropia</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {ENTROPY_SOURCES.map((src) => (
            <button
              key={src.key}
              onClick={() => patch({ entropySource: src.key })}
              className={`rounded-xl border p-3 text-left transition ${
                character.entropySource === src.key
                  ? "border-mente bg-mente/10"
                  : "border-white/10 bg-void-950/40 hover:border-white/20"
              }`}
            >
              <div className="text-sm font-bold text-zinc-100">{src.label}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                {src.spectrumLabel}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{src.passive}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Anotações / História</label>
        <textarea
          className="input min-h-[120px]"
          value={character.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Passado, motivações, aparência..."
        />
      </div>
    </div>
  );
}
