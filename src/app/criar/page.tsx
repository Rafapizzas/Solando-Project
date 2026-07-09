"use client";

import { useEffect, useState } from "react";
import { ATTRIBUTES } from "@/lib/solando/rules";
import { AttributeKey } from "@/lib/solando/rules";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/storage";
import type { Skill } from "@/lib/solando/character";
import {
  AREA_OPTIONS,
  BuilderEffect,
  SKILL_EFFECTS,
  SkillArea,
  SkillEffectKind,
  buildSkill,
} from "@/lib/solando/skillBuilder";
import {
  SharedSkill,
  getSharedSkills,
  hydrateSharedSkills,
  publishSkill,
  unpublishSkill,
} from "@/lib/solando/sharedSkills";
import {
  AttrBonus,
  CustomClass,
  CustomRace,
  getCustomClasses,
  getCustomRaces,
  hydrateSharedContent,
  removeCustomClass,
  removeCustomRace,
  saveCustomClass,
  saveCustomRace,
  slugify,
} from "@/lib/solando/customContent";

function emptyBonus(): AttrBonus {
  return {};
}

function BonusEditor({
  bonus,
  onChange,
}: {
  bonus: AttrBonus;
  onChange: (b: AttrBonus) => void;
}) {
  return (
    <div>
      <label className="label">Bônus de atributo (opcional)</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ATTRIBUTES.map((a) => (
          <div key={a.key} className="flex items-center gap-1">
            <span className="w-10 text-xs text-zinc-400">{a.short}</span>
            <input
              type="number"
              className="input !py-1.5 text-center"
              value={bonus[a.key] ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                const next = { ...bonus };
                if (v === 0) delete next[a.key as AttributeKey];
                else next[a.key as AttributeKey] = v;
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CriarPage() {
  const [tab, setTab] = useState<"raca" | "classe" | "skill">("raca");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Forjar Conteúdo</h1>
        <p className="mt-1 text-zinc-400">
          Crie suas próprias raças, classes e skills — com história, efeitos e bônus. Tudo
          que você salva vai para a Comunidade/Grimório para todos usarem.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={`btn text-sm ${tab === "raca" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("raca")}
        >
          🧬 Raças
        </button>
        <button
          className={`btn text-sm ${tab === "classe" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("classe")}
        >
          ⚔️ Classes
        </button>
        <button
          className={`btn text-sm ${tab === "skill" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("skill")}
        >
          ✨ Skills
        </button>
      </div>

      {tab === "raca" ? <RaceForge /> : tab === "classe" ? <ClassForge /> : <SkillForge />}
    </div>
  );
}

function RaceForge() {
  const [list, setList] = useState<CustomRace[]>([]);
  const [name, setName] = useState("");
  const [lore, setLore] = useState("");
  const [abilities, setAbilities] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [bonus, setBonus] = useState<AttrBonus>(emptyBonus());

  function reload() {
    setList(getCustomRaces());
  }
  useEffect(() => {
    reload();
    void hydrateSharedContent().then(reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    if (!name.trim()) return;
    const race: CustomRace = {
      custom: true,
      id: slugify(name),
      name: name.trim(),
      lore: lore.trim(),
      abilities: abilities.trim() || "—",
      weaknesses: weaknesses.trim() || "—",
      attrBonus: bonus,
    };
    saveCustomRace(race);
    setName("");
    setLore("");
    setAbilities("");
    setWeaknesses("");
    setBonus(emptyBonus());
    reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h3 className="font-display text-lg font-bold text-mente-soft">Nova Raça</h3>
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">História / Lore</label>
          <textarea className="input min-h-[70px]" value={lore} onChange={(e) => setLore(e.target.value)} />
        </div>
        <div>
          <label className="label">Habilidades (o que ela faz)</label>
          <textarea
            className="input min-h-[70px]"
            value={abilities}
            onChange={(e) => setAbilities(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Fraquezas</label>
          <textarea
            className="input min-h-[60px]"
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
          />
        </div>
        <BonusEditor bonus={bonus} onChange={setBonus} />
        <button className="btn-primary w-full" onClick={save}>
          Salvar raça
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-zinc-200">Suas raças</h3>
        {list.length === 0 && <p className="text-sm text-zinc-500">Nenhuma raça criada ainda.</p>}
        {list.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-mente-soft">{r.name}</h4>
              <button
                className="text-xs text-red-400 hover:underline"
                onClick={() => {
                  removeCustomRace(r.id);
                  reload();
                }}
              >
                excluir
              </button>
            </div>
            <p className="text-xs text-zinc-400">{r.lore}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassForge() {
  const [list, setList] = useState<CustomClass[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [level0, setLevel0] = useState("");
  const [progression, setProgression] = useState("");
  const [bonus, setBonus] = useState<AttrBonus>(emptyBonus());
  const [attrPoints, setAttrPoints] = useState(0);
  const [talentPts, setTalentPts] = useState(0);

  function reload() {
    setList(getCustomClasses());
  }
  useEffect(() => {
    reload();
    void hydrateSharedContent().then(reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    if (!name.trim()) return;
    const klass: CustomClass = {
      custom: true,
      id: slugify(name),
      name: name.trim(),
      role: role.trim() || "Classe personalizada",
      level0: level0.trim() || "—",
      progression: progression.trim() || "—",
      attrBonus: bonus,
      bonus: {
        attributePoints: attrPoints || undefined,
        talentPoints: talentPts || undefined,
        note:
          [attrPoints ? `+${attrPoints} pts atributo` : "", talentPts ? `+${talentPts} talento` : ""]
            .filter(Boolean)
            .join(" · ") || undefined,
      },
    };
    saveCustomClass(klass);
    setName("");
    setRole("");
    setLevel0("");
    setProgression("");
    setBonus(emptyBonus());
    setAttrPoints(0);
    setTalentPts(0);
    reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h3 className="font-display text-lg font-bold text-sol-soft">Nova Classe</h3>
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Papel (resumo)</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div>
          <label className="label">Benefício de Nível 0</label>
          <textarea
            className="input min-h-[70px]"
            value={level0}
            onChange={(e) => setLevel0(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Progressão</label>
          <textarea
            className="input min-h-[60px]"
            value={progression}
            onChange={(e) => setProgression(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">+ Pontos de atributo (nv0)</label>
            <input
              type="number"
              className="input"
              value={attrPoints}
              onChange={(e) => setAttrPoints(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">+ Pontos de talento (nv0)</label>
            <input
              type="number"
              className="input"
              value={talentPts}
              onChange={(e) => setTalentPts(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <BonusEditor bonus={bonus} onChange={setBonus} />
        <button className="btn-primary w-full" onClick={save}>
          Salvar classe
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-zinc-200">Suas classes</h3>
        {list.length === 0 && <p className="text-sm text-zinc-500">Nenhuma classe criada ainda.</p>}
        {list.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sol-soft">{c.name}</h4>
              <button
                className="text-xs text-red-400 hover:underline"
                onClick={() => {
                  removeCustomClass(c.id);
                  reload();
                }}
              >
                excluir
              </button>
            </div>
            <p className="text-xs text-zinc-400">{c.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillForge() {
  const { profile, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [effects, setEffects] = useState<BuilderEffect[]>([]);
  const [area, setArea] = useState<SkillArea>("unico");
  const [passive, setPassive] = useState(false);
  const [mine, setMine] = useState<SharedSkill[]>([]);
  const [flash, setFlash] = useState("");
  const [saving, setSaving] = useState(false);

  const result = buildSkill({ effects, area, passive, ups: 0 });

  function reload() {
    setMine(getSharedSkills());
  }
  useEffect(() => {
    reload();
    void hydrateSharedSkills().then(reload);
  }, []);

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

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const desc = effects
        .map((e) => {
          const def = SKILL_EFFECTS.find((d) => d.kind === e.kind)!;
          return `${def.label}: ${e.magnitude} ${def.unit}`;
        })
        .join(" · ");
      const areaLabel = AREA_OPTIONS.find((a) => a.key === area)!.label;
      const skill: Skill = {
        id: uid("skill"),
        name: name.trim(),
        cost: result.totalCost,
        description:
          [notes.trim(), desc, areaLabel, passive ? "Passiva" : ""]
            .filter(Boolean)
            .join(" · "),
        effects,
        area,
        passive,
        ups: 0,
      };
      await publishSkill(skill, profile?.displayName);
      reload();
      setFlash(`"${skill.name}" forjada e publicada no Grimório.`);
      setName("");
      setNotes("");
      setEffects([]);
      setArea("unico");
      setPassive(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h3 className="font-display text-lg font-bold text-mente-soft">Nova Skill</h3>
        {!isAuthenticated && (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-2 text-xs text-amber-300">
            Entre na sua conta para publicar no Grimório compartilhado (sem login, fica só neste
            navegador).
          </p>
        )}
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Lâmina Entrópica"
          />
        </div>
        <div>
          <label className="label">Descrição / lore (opcional)</label>
          <textarea
            className="input min-h-[60px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="O que a skill representa na história."
          />
        </div>

        <div>
          <label className="label">Efeitos (o custo em Entropia é calculado)</label>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_EFFECTS.map((e) => (
              <button
                key={e.kind}
                type="button"
                className="chip hover:border-alma/50"
                onClick={() => addEffect(e.kind)}
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
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-950/40 p-2"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-100">{def.label}</div>
                    <div className="text-[10px] text-zinc-500">{def.proportion}</div>
                  </div>
                  <input
                    type="number"
                    step={def.step}
                    className="input w-20 text-center"
                    value={e.magnitude}
                    onChange={(ev) => updateEffect(e.id, Number(ev.target.value) || 0)}
                  />
                  <span className="w-14 text-xs text-zinc-500">{def.unit}</span>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área</label>
            <select
              className="input"
              value={area}
              onChange={(e) => setArea(e.target.value as SkillArea)}
            >
              {AREA_OPTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={passive}
              onChange={(e) => setPassive(e.target.checked)}
            />
            Passiva (Regra 21)
          </label>
        </div>

        <div className="rounded-xl border border-mente/30 bg-mente/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-mente-soft">Custo (score de entropia)</span>
            <span className="chip text-sol-soft">{result.totalCost} Entropia</span>
          </div>
          {result.warnings.map((w, i) => (
            <p key={i} className="mt-1 text-[11px] text-amber-300">
              {w}
            </p>
          ))}
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={saving || !name.trim()}>
          {saving ? "Forjando…" : "Forjar e publicar skill"}
        </button>
        {flash && (
          <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-2 text-xs text-emerald-300">
            {flash}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-zinc-200">Grimório</h3>
        {mine.length === 0 && (
          <p className="text-sm text-zinc-500">Nenhuma skill no grimório ainda.</p>
        )}
        {mine
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
          .map((s) => (
            <div key={s.slug} className="card p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-mente-soft">{s.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="chip text-[10px] text-sol-soft">{s.cost} Entropia</span>
                  <button
                    className="text-xs text-red-400 hover:underline"
                    onClick={() => {
                      void unpublishSkill(s.slug).then(reload);
                    }}
                  >
                    excluir
                  </button>
                </div>
              </div>
              {s.description && <p className="mt-1 text-xs text-zinc-400">{s.description}</p>}
              {s.author && <p className="mt-1 text-[10px] text-zinc-500">por {s.author}</p>}
            </div>
          ))}
      </div>
    </div>
  );
}
