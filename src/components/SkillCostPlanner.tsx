"use client";

/**
 * SkillCostPlanner — planejador de pagamento MISTO do custo de uma skill.
 *
 * O "score de entropia" (custo bruto) pode ser pago combinando Entropia, Vida,
 * Sanidade e debuffs auto-impostos (ex.: -5 em Pontaria por 1 turno = -5 de
 * custo). Segue as regras do Solando: é livre — o sistema só ALERTA, nunca trava.
 */

import { useMemo } from "react";
import { uid } from "@/lib/storage";
import {
  SkillCostPlan,
  SkillDebuff,
  evaluateCostPlan,
} from "@/lib/solando/skillBuilder";

interface Props {
  score: number;
  plan: SkillCostPlan;
  onChange: (plan: SkillCostPlan) => void;
}

export function SkillCostPlanner({ score, plan, onChange }: Props) {
  const res = useMemo(() => evaluateCostPlan(score, plan), [score, plan]);

  function setField(field: "entropy" | "life" | "sanity", value: number) {
    onChange({ ...plan, [field]: Math.max(0, value) });
  }
  function autoFill() {
    // Joga o que falta na Entropia.
    const rest = Math.max(0, score - plan.life - plan.sanity - res.discount);
    onChange({ ...plan, entropy: rest });
  }
  function addDebuff() {
    const d: SkillDebuff = { id: uid("deb"), label: "-5 em um dado por 1 turno", amount: 5 };
    onChange({ ...plan, debuffs: [...plan.debuffs, d] });
  }
  function updateDebuff(id: string, patch: Partial<SkillDebuff>) {
    onChange({
      ...plan,
      debuffs: plan.debuffs.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  }
  function removeDebuff(id: string) {
    onChange({ ...plan, debuffs: plan.debuffs.filter((d) => d.id !== id) });
  }

  const covered = res.remaining <= 0;

  return (
    <div className="space-y-3 rounded-xl border border-mente/30 bg-mente/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-400">Score de entropia (custo bruto)</div>
          <div className="text-2xl font-black text-mente-soft">{score}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Cobertura do plano</div>
          <div
            className={`text-lg font-bold ${
              covered ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {res.covered}/{score}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { key: "entropy", label: "Entropia", color: "text-mente-soft" },
            { key: "life", label: "Vida", color: "text-red-300" },
            { key: "sanity", label: "Sanidade", color: "text-sky-300" },
          ] as const
        ).map((f) => (
          <div key={f.key}>
            <label className={`label ${f.color}`}>{f.label}</label>
            <input
              type="number"
              min={0}
              className="input text-center"
              value={plan[f.key]}
              onChange={(e) => setField(f.key, Number(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="label !mb-0">Debuffs auto-impostos (abatem o custo)</span>
          <button type="button" className="chip hover:border-alma/50" onClick={addDebuff}>
            + Debuff
          </button>
        </div>
        {plan.debuffs.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-void-950/40 p-2"
          >
            <input
              className="input flex-1 !py-1.5 text-sm"
              value={d.label}
              onChange={(e) => updateDebuff(d.id, { label: e.target.value })}
              placeholder="Ex.: -5 em Pontaria por 1 turno"
            />
            <span className="text-xs text-zinc-500">−</span>
            <input
              type="number"
              min={0}
              className="input w-16 !py-1.5 text-center"
              value={d.amount}
              onChange={(e) => updateDebuff(d.id, { amount: Number(e.target.value) || 0 })}
            />
            <button
              className="btn-ghost !px-2 !py-1 text-red-400"
              onClick={() => removeDebuff(d.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={autoFill}>
          Preencher a Entropia com o que falta
        </button>
        <span className="text-xs text-zinc-400">
          Desconto por debuffs: <b className="text-emerald-300">{res.discount}</b>
        </span>
      </div>

      {res.warnings.map((w, i) => (
        <p key={i} className="text-[11px] text-amber-300">
          ⚠ {w}
        </p>
      ))}
    </div>
  );
}
