"use client";

import { useState } from "react";
import { Character, Skill, skillSlots } from "@/lib/solando/character";
import { uid } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import {
  SharedSkill,
  getSharedSkills,
  hydrateSharedSkills,
  publishSkill,
} from "@/lib/solando/sharedSkills";
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

interface SkillAnalysis {
  suggestedCost: number;
  effects: string[];
  notes: string;
  balance: "baixo" | "ok" | "alto";
}

interface AnalysisState {
  loading: boolean;
  result?: SkillAnalysis;
  error?: string;
  resting?: boolean;
}

export function SkillsTab({ character, patch }: TabProps) {
  const slots = skillSlots(character);
  const { profile } = useAuth();
  const [building, setBuilding] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, AnalysisState>>({});
  const [grimorio, setGrimorio] = useState(false);
  const [grimorioQuery, setGrimorioQuery] = useState("");
  const [shared, setShared] = useState<SharedSkill[]>([]);
  const [loadingGrimorio, setLoadingGrimorio] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  async function openGrimorio() {
    const next = !grimorio;
    setGrimorio(next);
    if (next) {
      setLoadingGrimorio(true);
      await hydrateSharedSkills();
      setShared(getSharedSkills());
      setLoadingGrimorio(false);
    }
  }

  function importSkill(sk: SharedSkill) {
    const skill: Skill = {
      id: uid("skill"),
      name: sk.name,
      cost: sk.cost,
      description: sk.description,
      effects: sk.effects,
      area: sk.area,
      passive: sk.passive,
    };
    patch({ skills: [...character.skills, skill] });
    setFlash(`"${sk.name}" importada para a ficha.`);
  }

  async function publish(s: Skill) {
    setPublishing(s.id);
    try {
      await publishSkill(s, profile?.displayName);
      setShared(getSharedSkills());
      setFlash(`"${s.name}" publicada no grimório.`);
    } finally {
      setPublishing(null);
    }
  }

  function addManual() {
    const skill: Skill = { id: uid("skill"), name: "Nova skill", cost: 4, description: "" };
    patch({ skills: [...character.skills, skill] });
  }
  function update(id: string, p: Partial<Skill>) {
    patch({ skills: character.skills.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  }
  function remove(id: string) {
    patch({ skills: character.skills.filter((s) => s.id !== id) });
    setAnalysis((a) => {
      const next = { ...a };
      delete next[id];
      return next;
    });
  }

  async function analyze(s: Skill) {
    if (!s.description.trim()) {
      setAnalysis((a) => ({
        ...a,
        [s.id]: { loading: false, error: "Descreva a skill antes de analisar." },
      }));
      return;
    }
    setAnalysis((a) => ({ ...a, [s.id]: { loading: true } }));
    try {
      const res = await fetch("/api/skill-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, description: s.description, cost: s.cost }),
      });
      const data = (await res.json()) as SkillAnalysis & {
        fallback?: boolean;
        resting?: boolean;
        error?: string;
      };
      if (data.error) {
        setAnalysis((a) => ({ ...a, [s.id]: { loading: false, error: data.error } }));
        return;
      }
      if (data.fallback) {
        setAnalysis((a) => ({
          ...a,
          [s.id]: {
            loading: false,
            resting: data.resting,
            error: data.resting
              ? "O Arquimago está descansando (IA sobrecarregada). Tente de novo em instantes."
              : "IA indisponível agora. Defina o custo manualmente pelo manual.",
          },
        }));
        return;
      }
      setAnalysis((a) => ({
        ...a,
        [s.id]: {
          loading: false,
          result: {
            suggestedCost: data.suggestedCost,
            effects: data.effects ?? [],
            notes: data.notes ?? "",
            balance: data.balance ?? "ok",
          },
        },
      }));
    } catch {
      setAnalysis((a) => ({
        ...a,
        [s.id]: { loading: false, error: "Falha ao contatar a IA." },
      }));
    }
  }

  function dismiss(id: string) {
    setAnalysis((a) => {
      const next = { ...a };
      delete next[id];
      return next;
    });
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
          (também pode ser pago com Vida/Sanidade).{" "}
          {character.skills.length > slots && (
            <b className="text-amber-300">
              Você passou dos slots sugeridos (dica, sem trava).
            </b>
          )}
        </p>

        <div className="space-y-2">
          {character.skills.map((s) => {
            const a = analysis[s.id];
            return (
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
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    className="btn-ghost !py-1.5 text-sm"
                    onClick={() => analyze(s)}
                    disabled={a?.loading}
                  >
                    {a?.loading ? "🔮 Consultando o Arquimago…" : "🔮 Analisar com IA"}
                  </button>
                  <button
                    className="btn-ghost !py-1.5 text-sm"
                    onClick={() => publish(s)}
                    disabled={publishing === s.id}
                  >
                    {publishing === s.id ? "📤 Publicando…" : "📤 Publicar no grimório"}
                  </button>
                  <span className="text-[10px] text-zinc-500">
                    A IA sugere custo/efeitos a partir do seu texto (sem reescrever).
                  </span>
                </div>

                {a?.error && (
                  <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2 text-xs text-amber-300">
                    {a.error}
                  </p>
                )}

                {a?.result && (
                  <div className="mt-2 rounded-xl border border-mente/30 bg-mente/5 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-mente-soft">Sugestão do Arquimago</span>
                      <button
                        className="btn-ghost !px-2 !py-1 text-xs"
                        onClick={() => dismiss(s.id)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="chip text-sol-soft">
                        Custo sugerido: {a.result.suggestedCost}
                      </span>
                      <span
                        className={`chip ${
                          a.result.balance === "ok"
                            ? "text-emerald-300"
                            : a.result.balance === "alto"
                            ? "text-red-400"
                            : "text-amber-300"
                        }`}
                      >
                        {a.result.balance === "ok"
                          ? "Equilibrada"
                          : a.result.balance === "alto"
                          ? "Cara demais"
                          : "Barata demais"}
                      </span>
                      {a.result.suggestedCost !== s.cost && (
                        <button
                          className="btn-sol !py-1 !px-3 text-xs"
                          onClick={() => update(s.id, { cost: a.result!.suggestedCost })}
                        >
                          Aplicar custo {a.result.suggestedCost}
                        </button>
                      )}
                    </div>
                    {a.result.effects.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {a.result.effects.map((eff, i) => (
                          <li key={i} className="chip text-[10px] text-zinc-300">
                            {eff}
                          </li>
                        ))}
                      </ul>
                    )}
                    {a.result.notes && (
                      <p className="mt-2 text-xs text-zinc-400">{a.result.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {character.skills.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma skill ainda.</p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary flex-1" onClick={() => setBuilding((v) => !v)}>
            {building ? "Fechar construtor" : "✨ Criar skill (com custo automático)"}
          </button>
          <button className="btn-ghost" onClick={addManual}>
            + Manual
          </button>
          <button className="btn-ghost" onClick={openGrimorio}>
            {grimorio ? "Fechar grimório" : "📖 Grimório"}
          </button>
        </div>

        {flash && (
          <p className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-2 text-xs text-emerald-300">
            {flash}
          </p>
        )}
      </div>

      {grimorio && (
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-mente-soft">
              📖 Grimório compartilhado
            </h3>
            <span className="chip text-zinc-400">{shared.length} skills</span>
          </div>
          <p className="text-xs text-zinc-500">
            Skills criadas pela comunidade. Importe para sua ficha ou publique as suas com o
            botão “📤 Publicar no grimório”.
          </p>
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              🔍
            </span>
            <input
              className="input pl-9"
              placeholder="Buscar skill no grimório…"
              value={grimorioQuery}
              onChange={(e) => setGrimorioQuery(e.target.value)}
            />
          </label>

          {loadingGrimorio ? (
            <p className="text-sm text-zinc-500">Abrindo o grimório…</p>
          ) : shared.length === 0 ? (
            <p className="text-sm text-zinc-500">
              O grimório ainda está vazio. Seja o primeiro a publicar uma skill!
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {shared
                .filter((sk) => {
                  const q = grimorioQuery.trim().toLowerCase();
                  return (
                    !q ||
                    sk.name.toLowerCase().includes(q) ||
                    sk.description.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((sk) => (
                  <div
                    key={sk.slug}
                    className="flex flex-col rounded-xl border border-white/10 bg-void-950/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-100">{sk.name}</span>
                      <span className="chip text-[10px] text-sol-soft">{sk.cost} Entropia</span>
                    </div>
                    {sk.description && (
                      <p className="mt-1 flex-1 text-xs text-zinc-400">{sk.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">
                        {sk.author ? `por ${sk.author}` : "autor anônimo"}
                      </span>
                      <button
                        className="btn-sol !py-1 !px-3 text-xs"
                        onClick={() => importSkill(sk)}
                      >
                        Importar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

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
