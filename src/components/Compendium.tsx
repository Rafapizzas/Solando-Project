"use client";

import { useMemo, useState } from "react";
import { RACES } from "@/lib/solando/races";
import { CLASSES } from "@/lib/solando/classes";
import { TALENTS, TALENT_CATEGORIES } from "@/lib/solando/talents";
import { CONDITIONS_CATALOG } from "@/lib/solando/conditions";
import { COMPETENCES } from "@/lib/solando/competences";
import { SKILL_EFFECTS } from "@/lib/solando/skillBuilder";
import { ENTROPY_SOURCES } from "@/lib/solando/rules";

type Section =
  | "racas"
  | "classes"
  | "talentos"
  | "condicoes"
  | "competencias"
  | "fontes"
  | "skills";

const SECTIONS: Array<{ key: Section; label: string; icon: string }> = [
  { key: "racas", label: "Raças", icon: "🧬" },
  { key: "classes", label: "Classes", icon: "⚔️" },
  { key: "talentos", label: "Talentos", icon: "⭐" },
  { key: "condicoes", label: "Condições", icon: "⚖️" },
  { key: "competencias", label: "Competências", icon: "📚" },
  { key: "fontes", label: "Fontes de Entropia", icon: "🔮" },
  { key: "skills", label: "Criar Skills", icon: "✨" },
];

export function Compendium({ initial = "racas" }: { initial?: Section }) {
  const [section, setSection] = useState<Section>(initial);
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const match = (text: string) => !query || text.toLowerCase().includes(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`btn text-sm ${section === s.key ? "btn-primary" : "btn-ghost"}`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <input
        className="input"
        placeholder="Buscar no manual..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {section === "racas" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {RACES.filter((r) => match(r.name + r.lore)).map((r) => (
            <div key={r.id} className="card p-4">
              <h4 className="font-display text-base font-bold text-mente-soft">{r.name}</h4>
              <p className="mt-1 text-xs text-zinc-400">{r.lore}</p>
              <p className="mt-2 text-xs">
                <b className="text-emerald-400">Habilidades:</b>{" "}
                <span className="text-zinc-300">{r.abilities}</span>
              </p>
              <p className="mt-1 text-xs">
                <b className="text-red-400">Fraquezas:</b>{" "}
                <span className="text-zinc-300">{r.weaknesses}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {section === "classes" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {CLASSES.filter((c) => match(c.name + c.role)).map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center gap-2">
                <h4 className="font-display text-base font-bold text-sol-soft">{c.name}</h4>
                {c.secret && <span className="chip text-[10px] text-mente-soft">secreta</span>}
              </div>
              <p className="text-xs text-zinc-500">{c.role}</p>
              <p className="mt-2 text-xs">
                <b className="text-zinc-200">Nível 0:</b>{" "}
                <span className="text-zinc-300">{c.level0}</span>
              </p>
              <p className="mt-1 text-xs">
                <b className="text-zinc-200">Progressão:</b>{" "}
                <span className="text-zinc-400">{c.progression}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {section === "talentos" && (
        <div className="space-y-4">
          {TALENT_CATEGORIES.map((cat) => {
            const list = TALENTS.filter(
              (t) => t.category === cat.key && match(t.name + t.summary),
            );
            if (!list.length) return null;
            return (
              <div key={cat.key}>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                  {cat.label}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {list.map((t) => (
                    <div key={t.id} className="card p-4">
                      <h5 className="font-semibold text-zinc-100">{t.name}</h5>
                      <p className="text-xs text-zinc-400">{t.summary}</p>
                      <ul className="mt-2 space-y-1">
                        {t.tiers.map((tier) => (
                          <li key={tier.points} className="text-xs text-zinc-300">
                            <span className="chip mr-1 text-[10px] text-sol-soft">
                              {tier.points} pt
                            </span>
                            {tier.effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {section === "condicoes" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {CONDITIONS_CATALOG.filter((c) => match(c.name + c.description)).map((c) => (
            <div key={c.id} className="card flex items-start gap-3 p-3">
              <span className="chip shrink-0 text-[10px] text-sol-soft">
                {c.min === c.max ? `${c.min}` : `${c.min}–${c.max}`} pt
              </span>
              <div>
                <h5 className="text-sm font-semibold text-zinc-100">{c.name}</h5>
                <p className="text-xs text-zinc-400">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "competencias" && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETENCES.filter((c) => match(c.name + c.description)).map((c) => (
            <div key={c.id} className="card p-3">
              <h5 className="text-sm font-semibold text-alma-soft">{c.name}</h5>
              <p className="text-xs text-zinc-400">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      {section === "fontes" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ENTROPY_SOURCES.filter((s) => match(s.label + s.spectrumLabel)).map((s) => (
            <div key={s.key} className="card p-4">
              <h5 className="font-semibold text-mente-soft">{s.label}</h5>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {s.spectrumLabel}
              </p>
              <p className="mt-1 text-xs text-zinc-300">{s.passive}</p>
            </div>
          ))}
        </div>
      )}

      {section === "skills" && (
        <div className="space-y-3">
          <div className="card p-4 text-sm text-zinc-300">
            No Sistema Solando você <b>cria</b> suas skills combinando efeitos. Cada efeito
            tem um custo em Status (Entropia/Vida/Sanidade) definido por uma proporção. Use
            a aba <b>Habilidades → Criar skill</b> na ficha para calcular o custo automaticamente.
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILL_EFFECTS.filter((e) => match(e.label + e.proportion)).map((e) => (
              <div key={e.kind} className="card p-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-zinc-100">{e.label}</h5>
                  <span className="chip text-[10px]">{e.action}</span>
                </div>
                <p className="text-xs text-sol-soft">{e.proportion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
