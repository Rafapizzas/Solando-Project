"use client";

import { useState } from "react";
import { Character, Skill, skillSlots } from "@/lib/solando/character";
import { uid } from "@/lib/storage";
import {
  AREA_OPTIONS,
  BuilderEffect,
  SKILL_EFFECTS,
  SkillArea,
  SkillEffectKind,
  buildSkill,
} from "@/lib/solando/skillBuilder";

interface TabProps {
  character: Character;
  patch: (p: Partial<Character>) => void;
}

export function SkillsTab({ character, patch }: TabProps) {
  const slots = skillSlots(character);
  const [building, setBuilding] = useState(false);

  function addManual() {
    const skill: Skill = { id: uid("skill"), name: "Nova skill", cost: 4, description: "" };
    patch({ skills: [...character.skills, skill] });
  }
  function update(id: string, p: Partial<Skill>) {
    patch({ skills: character.skills.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  }
  function remove(id: string) {
    patch({ skills: character.skills.filter((s) => s.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-zinc-100">Skills</h3>
          <span
            className={`chip ${
              character.skills.length > slots ? "text-red-400" : "text-zinc-300"
            }`}
          >
            {character.skills.length}/{slots} slots
          </span>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          1 base + 1 a cada 10 de Mente ou Destreza + 1 por nível. O custo é em Entropia
          (também pode ser pago com Vida/Sanidade).
        </p>

        <div className="space-y-2">
          {character.skills.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-void-950/40 p-3">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  value={s.name}
                  onChange={(e) => update(s.id, { name: e.target.value })}
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">custo</span>
                  <input
                    type="number"
                    className="input w-16 text-center"
                    value={s.cost}
                    onChange={(e) => update(s.id, { cost: Number(e.target.value) || 0 })}
                  />
                </div>
                <button
                  className="btn-ghost !px-3 !py-2 text-red-400"
                  onClick={() => remove(s.id)}
                >
                  ✕
                </button>
              </div>
              <textarea
                className="input mt-2 min-h-[56px] text-sm"
                placeholder="O que a skill faz na prática?"
                value={s.description}
                onChange={(e) => update(s.id, { description: e.target.value })}
              />
            </div>
          ))}
          {character.skills.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma skill ainda.</p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-primary flex-1"
            onClick={() => setBuilding((v) => !v)}
            disabled={character.skills.length >= slots}
          >
            {building ? "Fechar construtor" : "✨ Criar skill (com custo automático)"}
          </button>
          <button
            className="btn-ghost"
            onClick={addManual}
            disabled={character.skills.length >= slots}
          >
            + Manual
          </button>
        </div>
      </div>

      {building && (
        <SkillBuilder
          onCreate={(skill) => {
            patch({ skills: [...character.skills, skill] });
            setBuilding(false);
          }}
        />
      )}
    </div>
  );
}

function SkillBuilder({ onCreate }: { onCreate: (skill: Skill) => void }) {
  const [name, setName] = useState("");
  const [effects, setEffects] = useState<BuilderEffect[]>([]);
  const [area, setArea] = useState<SkillArea>("unico");
  const [passive, setPassive] = useState(false);

  const result = buildSkill({ effects, area, passive, ups: 0 });

  function addEffect(kind: SkillEffectKind) {
    const def = SKILL_EFFECTS.find((e) => e.kind === kind)!;
    setEffects((prev) => [...prev, { id: uid("eff"), kind, magnitude: def.step }]);
  }
  function updateEffect(id: string, magnitude: number) {
    setEffects((prev) => prev.map((e) => (e.id === id ? { ...e, magnitude } : e)));
  }
  function removeEffect(id: string) {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }

  function create() {
    const desc = effects
      .map((e) => {
        const def = SKILL_EFFECTS.find((d) => d.kind === e.kind)!;
        return `${def.label}: ${e.magnitude} ${def.unit}`;
      })
      .join(" · ");
    const areaLabel = AREA_OPTIONS.find((a) => a.key === area)!.label;
    onCreate({
      id: uid("skill"),
      name: name.trim() || "Skill personalizada",
      cost: result.totalCost,
      description: `${desc}${desc ? " · " : ""}${areaLabel}${passive ? " · Passiva" : ""}`,
      effects,
      area,
      passive,
      ups: 0,
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <h3 className="font-display text-lg font-bold text-mente-soft">
        ✨ Construtor de Skill (Grimório)
      </h3>

      <div>
        <label className="label">Nome da skill</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Lâmina Entrópica"
        />
      </div>

      <div>
        <label className="label">Adicionar efeito</label>
        <div className="flex flex-wrap gap-1.5">
          {SKILL_EFFECTS.map((e) => (
            <button
              key={e.kind}
              onClick={() => addEffect(e.kind)}
              className="chip hover:border-mente/60 hover:text-mente-soft"
              title={e.proportion}
            >
              + {e.label}
            </button>
          ))}
        </div>
      </div>

      {effects.length > 0 && (
        <div className="space-y-2">
          {effects.map((e) => {
            const def = SKILL_EFFECTS.find((d) => d.kind === e.kind)!;
            return (
              <div
                key={e.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-950/40 p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-100">{def.label}</div>
                  <div className="text-[10px] text-sol-soft">{def.proportion}</div>
                </div>
                <input
                  type="number"
                  step={def.step}
                  className="input w-20 text-center"
                  value={e.magnitude}
                  onChange={(ev) => updateEffect(e.id, Number(ev.target.value) || 0)}
                />
                <span className="text-xs text-zinc-500">{def.unit}</span>
                <span className="chip text-sol-soft">{def.cost(e.magnitude)}</span>
                <button
                  className="btn-ghost !px-2 !py-1 text-red-400"
                  onClick={() => removeEffect(e.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">Área de efeito</label>
          <select
            className="input"
            value={area}
            onChange={(e) => setArea(e.target.value as SkillArea)}
          >
            {AREA_OPTIONS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} {a.add > 0 ? `(+${a.add})` : ""} · {a.targets}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={passive}
            onChange={(e) => setPassive(e.target.checked)}
          />
          Passiva (Regra 21)
        </label>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-mente/30 bg-mente/5 p-4">
        <div>
          <div className="text-xs text-zinc-400">Custo calculado</div>
          <div className="text-3xl font-black text-mente-soft">
            {result.totalCost}
            <span className="text-sm text-zinc-500"> de Entropia</span>
          </div>
        </div>
        <button className="btn-primary" onClick={create}>
          Adicionar à ficha
        </button>
      </div>

      {result.warnings.length > 0 && (
        <ul className="space-y-1 text-xs text-sol-soft">
          {result.warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
