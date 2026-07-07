/**
 * skillBuilder.ts — Calculadora de custo de Skills baseada no Grimório Entrópico.
 *
 * O Grimório define proporções entre "Status" (Entropia/Vida/Sanidade) e o
 * efeito da habilidade. Aqui traduzimos essas proporções em uma calculadora
 * que soma o custo de cada efeito, evitando skills desbalanceadas.
 *
 * Regra de arredondamento do sistema: sempre para cima.
 * Regra 19: cada up de skill soma +2 de efeito sem custo adicional.
 * Regra 21: efeitos que custariam 2 viram passivas (custo 0).
 */

export type SkillEffectKind =
  | "dano"
  | "cura_aliado"
  | "cura_proprio"
  | "buff_atributo"
  | "debuff_atributo"
  | "competencia"
  | "critico"
  | "resistencia_fisica"
  | "resistencia_mistica"
  | "penetracao"
  | "stun";

export interface SkillEffectDef {
  kind: SkillEffectKind;
  label: string;
  /** Descrição da proporção conforme o Grimório. */
  proportion: string;
  /** Unidade do valor de entrada (ex.: "de dano", "de atributo", "%"). */
  unit: string;
  /** Passo/incremento sugerido no input. */
  step: number;
  /** Calcula o custo em Status para um dado valor de magnitude. */
  cost: (magnitude: number) => number;
  /** Ação associada (informativo). */
  action: string;
}

const ceil = (n: number) => Math.ceil(n);

export const SKILL_EFFECTS: SkillEffectDef[] = [
  {
    kind: "dano",
    label: "Dano",
    proportion: "1 de Status → 2 de dano",
    unit: "de dano",
    step: 2,
    cost: (m) => ceil(m / 2),
    action: "Ação principal",
  },
  {
    kind: "cura_aliado",
    label: "Cura (em aliado)",
    proportion: "1 de Status → 2 de cura",
    unit: "de cura",
    step: 2,
    cost: (m) => ceil(m / 2),
    action: "Ação principal",
  },
  {
    kind: "cura_proprio",
    label: "Cura / Regeneração (em si)",
    proportion: "1 de Status → 1 de Vida",
    unit: "de vida",
    step: 1,
    cost: (m) => ceil(m),
    action: "Ação principal",
  },
  {
    kind: "buff_atributo",
    label: "Buff de Atributo",
    proportion: "1 de Status → 1 de atributo",
    unit: "de atributo",
    step: 1,
    cost: (m) => ceil(m),
    action: "Ação principal",
  },
  {
    kind: "debuff_atributo",
    label: "Debuff de Atributo (por turno)",
    proportion: "1 de Status → 1 de atributo",
    unit: "de atributo",
    step: 1,
    cost: (m) => ceil(m),
    action: "Ação livre (manter)",
  },
  {
    kind: "competencia",
    label: "Bônus de Acerto (competência)",
    proportion: "1 de Status → 1 de bônus",
    unit: "de bônus",
    step: 1,
    cost: (m) => ceil(m),
    action: "Ação principal",
  },
  {
    kind: "critico",
    label: "Acerto Crítico",
    proportion: "1 de Status → 1% (limite 100%)",
    unit: "%",
    step: 1,
    cost: (m) => ceil(Math.min(100, m)),
    action: "Ação principal",
  },
  {
    kind: "resistencia_fisica",
    label: "Resistência Física",
    proportion: "1 de Status → 2 de resistência",
    unit: "de resistência",
    step: 2,
    cost: (m) => ceil(m / 2),
    action: "Ação de movimento",
  },
  {
    kind: "resistencia_mistica",
    label: "Resistência Mística",
    proportion: "1 de Status → 2 de resistência",
    unit: "de resistência",
    step: 2,
    cost: (m) => ceil(m / 2),
    action: "Ação de movimento",
  },
  {
    kind: "penetracao",
    label: "Penetração de Armadura",
    proportion: "25/50/75/100% = 5/10/15/20 de Status",
    unit: "%",
    step: 25,
    cost: (m) => {
      const pct = Math.min(100, Math.max(0, m));
      return ceil((pct / 25) * 5);
    },
    action: "Ação de movimento",
  },
  {
    kind: "stun",
    label: "Stun (atordoar)",
    proportion: "10 de Status por turno de stun",
    unit: "turno(s)",
    step: 1,
    cost: (m) => ceil(m) * 10,
    action: "Ação principal",
  },
];

export type SkillArea = "unico" | "curta" | "media" | "longa";

export const AREA_OPTIONS: Array<{ key: SkillArea; label: string; add: number; targets: string }> = [
  { key: "unico", label: "Alvo único", add: 0, targets: "1 alvo" },
  { key: "curta", label: "Área curta (4 m)", add: 2, targets: "~4 alvos" },
  { key: "media", label: "Área média (8 m)", add: 4, targets: "~8 alvos" },
  { key: "longa", label: "Área longa (16 m)", add: 8, targets: "~16 alvos" },
];

export interface BuilderEffect {
  id: string;
  kind: SkillEffectKind;
  magnitude: number;
}

export interface SkillBuildInput {
  effects: BuilderEffect[];
  area: SkillArea;
  /** Skill é passiva? (efeitos que custariam 2 viram 0 — Regra 21) */
  passive: boolean;
  /** Ups investidos (Regra 19: cada up = +2 de efeito, não muda custo). */
  ups: number;
}

export interface SkillBuildResult {
  totalCost: number;
  breakdown: Array<{ label: string; magnitude: number; cost: number }>;
  areaAdd: number;
  effectsCount: number;
  bonusFromUps: number;
  warnings: string[];
}

function effectDef(kind: SkillEffectKind): SkillEffectDef {
  return SKILL_EFFECTS.find((e) => e.kind === kind)!;
}

/**
 * Custo base de qualquer ação padrão é 4 de Entropia. Uma skill sem efeitos
 * "compráveis" ainda custa esse valor mínimo (a não ser que seja passiva).
 */
export const BASE_ACTION_COST = 4;

export function buildSkill(input: SkillBuildInput): SkillBuildResult {
  const breakdown = input.effects.map((e) => {
    const def = effectDef(e.kind);
    return { label: def.label, magnitude: e.magnitude, cost: def.cost(e.magnitude) };
  });

  const areaOpt = AREA_OPTIONS.find((a) => a.key === input.area)!;
  const effectsCost = breakdown.reduce((s, b) => s + b.cost, 0);
  let total = effectsCost + areaOpt.add;

  const warnings: string[] = [];

  // Regra 21: passiva zera custos baixos (efeitos que custariam ≤2).
  if (input.passive) {
    total = 0;
    warnings.push("Passiva (Regra 21): efeitos que custariam 2 não têm custo.");
  } else {
    // Custo mínimo de uma ação padrão.
    total = Math.max(total, BASE_ACTION_COST);
  }

  // Regra 15: no máximo 6 efeitos de debuff numa skill.
  const debuffs = input.effects.filter((e) => e.kind === "debuff_atributo").length;
  if (debuffs > 6) warnings.push("Regra 15: evite mais de 6 efeitos de debuff em uma skill.");

  if (input.effects.length >= 3) {
    warnings.push("Skill combinando vários efeitos — o Mestre deve validar o balanceamento (Regra 3/4).");
  }

  return {
    totalCost: total,
    breakdown,
    areaAdd: areaOpt.add,
    effectsCount: input.effects.length,
    bonusFromUps: input.ups * 2,
    warnings,
  };
}
