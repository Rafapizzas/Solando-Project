"use client";

import { useEffect, useState } from "react";
import { ATTRIBUTES } from "@/lib/solando/rules";
import { AttributeKey } from "@/lib/solando/rules";
import {
  AttrBonus,
  CustomClass,
  CustomRace,
  getCustomClasses,
  getCustomRaces,
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
  const [tab, setTab] = useState<"raca" | "classe">("raca");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Forjar Conteúdo</h1>
        <p className="mt-1 text-zinc-400">
          Crie suas próprias raças e classes — com história, efeitos e bônus de atributo.
        </p>
      </div>

      <div className="flex gap-2">
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
      </div>

      {tab === "raca" ? <RaceForge /> : <ClassForge />}
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
  useEffect(reload, []);

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
  useEffect(reload, []);

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
