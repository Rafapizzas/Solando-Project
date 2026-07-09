/**
 * character.ts — Modelo de personagem (ficha) e cálculos derivados do sistema.
 */

import {
  ATTRIBUTE_KEYS,
  AttributeKey,
  BASE_ATTRIBUTE_POINTS,
  INVENTORY_BY_FORCE_RANK,
  ItemWeight,
  MAX_ATTRIBUTE,
  PER_LEVEL_ATTRIBUTE_POINTS,
  PER_LEVEL_SKILL_UPS,
  RankDef,
  WEIGHT_UNITS,
  rankFor,
} from "./rules";
import {
  BASE_TALENT_POINTS,
  PER_LEVEL_TALENT_POINTS,
} from "./talents";
import {
  ENTROPY_PER_CONDITION_POINT,
  MAX_CONDITION_POINTS,
} from "./conditions";
import {
  classAttrBonus,
  raceAttrBonus,
  resolveClass,
} from "./customContent";
import { INITIAL_COMPETENCE_POINTS } from "./competences";
import type { SkillCostPlan } from "./skillBuilder";

export type Attributes = Record<AttributeKey, number>;

export interface Condition {
  id: string;
  /** id do catálogo de condições (quando escolhida da lista). */
  catalogId?: string;
  name: string;
  /** Pontos da condição (1–5). Cada ponto = +2 de Entropia. */
  points: number;
  note?: string;
}

export interface Skill {
  id: string;
  name: string;
  cost: number; // custo em Entropia
  description: string;
  spectrum?: "mente" | "corpo" | "alma";
  /** Efeitos usados na calculadora do Grimório (opcional). */
  effects?: Array<{ id: string; kind: string; magnitude: number }>;
  area?: string;
  passive?: boolean;
  ups?: number;
  /** Score de entropia (custo bruto calculado dos efeitos). */
  score?: number;
  /** Plano de pagamento misto do custo (entropia/vida/sanidade/debuffs). */
  costPlan?: SkillCostPlan;
}

export interface Talent {
  id: string;
  /** id do catálogo de talentos (quando escolhido da lista). */
  catalogId?: string;
  name: string;
  cost: number; // custo em pontos de talento
  description: string;
}

export interface CompetenceEntry {
  id: string; // id do catálogo de competências
  level: number; // nível de proficiência (cada nível = +10)
}

/**
 * Alocação da Entropia-KI (moeda) gerada por condições/desvantagens.
 * Cada ponto de Entropia-KI vale 1:1 no destino escolhido.
 */
export interface EntropyAllocation {
  /** KI convertidos em pontos de talento extra. */
  talentos: number;
  /** KI convertidos em pontos de competência extra. */
  competencias: number;
  /** KI reservados para reduzir custo de skills (1 KI = -1 de custo). */
  custoSkill: number;
  /** KI reservados para +dano/+cura em skills (1 KI = +1). */
  potencia: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  weight: ItemWeight;
  qty: number;
  note?: string;
}

export interface Character {
  id: string;
  name: string;
  moral: number; // -100 a 100
  sex: string;
  age: string;
  origin: string; // "Fonte"
  level: number;
  xp: number;
  race: string;
  charClass: string;
  entropySource: string; // key de ENTROPY_SOURCES
  attributes: Attributes;
  /** Base do d20 de Sorte rolado na criação (0 se não rolado). */
  luckRoll: number;
  conditions: Condition[];
  skills: Skill[];
  talents: Talent[];
  competences: CompetenceEntry[];
  inventory: InventoryItem[];
  /** Entropia-KI extra ganha em sessão (recompensas do mestre). */
  entropyGranted?: number;
  /** Como o jogador aloca a Entropia-KI (moeda de condições/desvantagens). */
  entropyAlloc?: EntropyAllocation;
  notes: string;
  /** Cor de destaque escolhida pelo jogador (personalização). */
  accent: string;
  avatarUrl?: string;
  /** Vida atual (status em jogo). undefined = cheia (usa o máximo derivado). */
  currentVida?: number;
  /** Entropia/mana atual (status em jogo). undefined = cheia. */
  currentEntropia?: number;
  createdAt: number;
  updatedAt: number;
}

export function emptyAttributes(): Attributes {
  return {
    forca: 0,
    mente: 0,
    constituicao: 0,
    aspecto: 0,
    destreza: 0,
    poder: 0,
    sorte: 0,
  };
}

export function emptyEntropyAlloc(): EntropyAllocation {
  return { talentos: 0, competencias: 0, custoSkill: 0, potencia: 0 };
}

export function newCharacter(partial?: Partial<Character>): Character {
  const now = Date.now();
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `char_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    moral: 0,
    sex: "",
    age: "",
    origin: "",
    level: 0,
    xp: 0,
    race: "",
    charClass: "",
    entropySource: "",
    attributes: emptyAttributes(),
    luckRoll: 0,
    conditions: [],
    skills: [],
    talents: [],
    competences: [],
    inventory: [],
    entropyGranted: 0,
    entropyAlloc: emptyEntropyAlloc(),
    notes: "",
    accent: "#a855f7",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * Garante que uma ficha carregada (possivelmente antiga) tenha todos os campos
 * esperados. Evita erros de runtime quando o modelo evolui (migração leve).
 */
export function normalizeCharacter(c: Partial<Character> | null | undefined): Character {
  const base = newCharacter();
  if (!c) return base;
  return {
    ...base,
    ...c,
    attributes: { ...emptyAttributes(), ...(c.attributes ?? {}) },
    conditions: c.conditions ?? [],
    skills: c.skills ?? [],
    talents: c.talents ?? [],
    competences: c.competences ?? [],
    inventory: c.inventory ?? [],
    entropyGranted: c.entropyGranted ?? 0,
    entropyAlloc: { ...emptyEntropyAlloc(), ...(c.entropyAlloc ?? {}) },
  };
}

// ---------------------------------------------------------------------------
// Cálculos de pontos (orçamento de criação/balanceamento)
// ---------------------------------------------------------------------------

/**
 * Bônus de pontos de atributo concedido pela classe no nível 0 (ex.: Combatente
 * +6, Berserker +2). Não inclui os ganhos escalonados por nível de classe.
 */
export function classAttributeBonus(character: Character): number {
  return resolveClass(character.charClass)?.bonus?.attributePoints ?? 0;
}

/**
 * Soma dos bônus de atributo FIXOS concedidos por raça e classe (ex.: Anão +4
 * Força/Aspecto). Diferente dos pontos livres para distribuir.
 */
export function raceClassAttrBonus(character: Character): Attributes {
  const bonus = emptyAttributes();
  const rb = raceAttrBonus(character.race);
  const cb = classAttrBonus(character.charClass);
  for (const key of ATTRIBUTE_KEYS) {
    bonus[key] = (rb[key] ?? 0) + (cb[key] ?? 0);
  }
  return bonus;
}

/** Normaliza nome de atributo em PT (minúsculo, sem acento) para casar chaves. */
function normalizeAttrName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Nomes de atributo (PT normalizado) → chave interna. */
const ATTR_NAME_TO_KEY: Record<string, AttributeKey> = {
  forca: "forca",
  destreza: "destreza",
  constituicao: "constituicao",
  aspecto: "aspecto",
  mente: "mente",
  poder: "poder",
  sorte: "sorte",
};

/**
 * Bônus de atributo concedido por TALENTOS selecionados. Considera talentos
 * cujo efeito é um bônus PERMANENTE de atributo, aceitando os formatos:
 *   "+2 de Aspecto."                     (Arrojado, Super Força…)
 *   "+4 Força/Destreza/Constituição, …"  (Poderes de Lobisomem — barra = cada um)
 *   "+4 de Força ou Poder"               (escolha → aplica a ambos como referência)
 * Efeitos temporários/condicionais (que gastam Entropia, duram "por 1 turno",
 * dão dano/dado, defesa, regeneração, resistência) NÃO entram no cálculo.
 */
export function talentAttrBonus(character: Character): Attributes {
  const bonus = emptyAttributes();
  for (const t of character.talents ?? []) {
    const effect = (t.description ?? "").trim();
    // Quebra o efeito em cláusulas independentes.
    for (const raw of effect.split(/[,;.]/)) {
      const clause = raw.trim();
      if (!clause) continue;
      // Ignora cláusulas que não sejam bônus permanente de atributo.
      if (/entropia|turno|no dado|de dano|dano de|defesa|regenera|cura|resist|garras|esquiva|teste/i.test(clause))
        continue;
      // "+N [de] <Attr>[/<Attr>/…]" ou "… ou <Attr>".
      const m = clause.match(/^\+(\d+)\s+(?:de\s+)?(.+)$/);
      if (!m) continue;
      const amount = Number(m[1]);
      const parts = m[2]
        .split(/\s*\/\s*|\s+ou\s+/i)
        .map((p) => normalizeAttrName(p.trim()))
        .filter(Boolean);
      const keys = parts
        .map((p) => ATTR_NAME_TO_KEY[p])
        .filter((k): k is AttributeKey => Boolean(k));
      // Só aplica se TODOS os tokens forem nomes de atributo (evita "+4 dano de garras").
      if (keys.length === 0 || keys.length !== parts.length) continue;
      for (const k of keys) bonus[k] += amount;
    }
  }
  return bonus;
}

/** Todos os bônus de atributo FIXOS: raça + classe + talentos. */
export function attributeBonus(character: Character): Attributes {
  const rc = raceClassAttrBonus(character);
  const tb = talentAttrBonus(character);
  const bonus = emptyAttributes();
  for (const key of ATTRIBUTE_KEYS) {
    bonus[key] = rc[key] + tb[key];
  }
  return bonus;
}

/** Atributos efetivos = base (pontos gastos) + bônus fixos de raça/classe/talento. */
export function effectiveAttributes(character: Character): Attributes {
  const bonus = attributeBonus(character);
  const eff = emptyAttributes();
  for (const key of ATTRIBUTE_KEYS) {
    eff[key] = (character.attributes?.[key] ?? 0) + bonus[key];
  }
  return eff;
}

/** Total de pontos de atributo: base + nível + bônus de classe. */
export function totalAttributePoints(character: Character): number {
  const fromLevel = BASE_ATTRIBUTE_POINTS + character.level * PER_LEVEL_ATTRIBUTE_POINTS;
  return fromLevel + classAttributeBonus(character);
}

// --- Condições -------------------------------------------------------------

/** Soma dos pontos de condição, limitada ao teto de 5. */
export function conditionPoints(character: Character): number {
  const raw = (character.conditions ?? []).reduce((s, c) => s + c.points, 0);
  return Math.min(MAX_CONDITION_POINTS, raw);
}

/** Pontos de condição declarados (sem o teto), para detectar excesso. */
export function conditionPointsRaw(character: Character): number {
  return (character.conditions ?? []).reduce((s, c) => s + c.points, 0);
}

/**
 * Entropia-KI (moeda) gerada pelas condições: +2 por ponto de condição
 * (teto de 5 pontos de condição → até 10 de KI).
 */
export function conditionKi(character: Character): number {
  return conditionPoints(character) * ENTROPY_PER_CONDITION_POINT;
}

/** Compatibilidade: nome antigo aponta para conditionKi. */
export function conditionEntropyBonus(character: Character): number {
  return conditionKi(character);
}

/** Total de Entropia-KI disponível: condições + concessões de sessão. */
export function entropyKiTotal(character: Character): number {
  return conditionKi(character) + (character.entropyGranted ?? 0);
}

/** Entropia-KI já alocada pelo jogador. */
export function entropyKiSpent(character: Character): number {
  const a = character.entropyAlloc;
  if (!a) return 0;
  return (a.talentos ?? 0) + (a.competencias ?? 0) + (a.custoSkill ?? 0) + (a.potencia ?? 0);
}

/** Entropia-KI ainda disponível para gastar. */
export function entropyKiRemaining(character: Character): number {
  return entropyKiTotal(character) - entropyKiSpent(character);
}

/** Pontos de atributo já gastos (soma dos atributos, exceto a Sorte rolada). */
export function spentAttributePoints(character: Character): number {
  // A Sorte pode vir de um d20 (luckRoll) e/ou de pontos investidos.
  // Convencionamos: pontos investidos em sorte = attributes.sorte - luckRoll (>=0).
  const luckInvested = Math.max(0, character.attributes.sorte - character.luckRoll);
  let total = luckInvested;
  for (const key of ATTRIBUTE_KEYS) {
    if (key === "sorte") continue;
    total += character.attributes[key];
  }
  return total;
}

export function remainingAttributePoints(character: Character): number {
  return totalAttributePoints(character) - spentAttributePoints(character);
}

/** Skills disponíveis: 1 base + 1 a cada 10 pts em Mente OU Destreza + ups de nível. */
export function skillSlots(character: Character): number {
  const fromMind = Math.floor(character.attributes.mente / 10);
  const fromDex = Math.floor(character.attributes.destreza / 10);
  const fromLevel = character.level * PER_LEVEL_SKILL_UPS;
  return 1 + fromMind + fromDex + fromLevel;
}

/** Pontos de competência: 3 iniciais + 1 a cada 10 pts em Mente OU Destreza + KI alocado. */
export function competencePoints(character: Character): number {
  return (
    INITIAL_COMPETENCE_POINTS +
    Math.floor(character.attributes.mente / 10) +
    Math.floor(character.attributes.destreza / 10) +
    (character.entropyAlloc?.competencias ?? 0)
  );
}

/** Pontos de competência já gastos (soma dos níveis alocados). */
export function competencePointsSpent(character: Character): number {
  return (character.competences ?? []).reduce((s, c) => s + c.level, 0);
}

/**
 * Pontos de talento disponíveis: 5 base (nível 0) + 1 por nível + bônus da
 * classe no nível 0 (ex.: Mago/Suporte +2) + Entropia-KI alocada em talentos.
 */
export function talentPoints(character: Character): number {
  const fromClass = resolveClass(character.charClass)?.bonus?.talentPoints ?? 0;
  return (
    BASE_TALENT_POINTS +
    character.level * PER_LEVEL_TALENT_POINTS +
    fromClass +
    (character.entropyAlloc?.talentos ?? 0)
  );
}

export function talentPointsSpent(character: Character): number {
  return (character.talents ?? []).reduce((s, t) => s + t.cost, 0);
}

// ---------------------------------------------------------------------------
// Status derivados
// ---------------------------------------------------------------------------

export interface DerivedStats {
  vida: number;
  sanidade: number;
  /** Nível de Entropia = MANA máxima (recurso variável gasto em jogo). */
  entropia: number;
  /** Fórmula usada para a mana, exibível ao usuário. */
  entropiaFormula: string;
  /** Entropia-KI total (moeda vinda de condições/desvantagens/sessão). */
  entropiaKiTotal: number;
  /** Entropia-KI já alocada. */
  entropiaKiGasto: number;
  /** Entropia-KI disponível. */
  entropiaKiRestante: number;
  danoMultiplicador: number;
  xpParaProximoNivel: number;
}

export function derivedStats(character: Character): DerivedStats {
  const a = effectiveAttributes(character);
  const vida = a.constituicao * 10;
  const sanidade = a.aspecto * 10;

  // Nível de Entropia (MANA) = (Aspecto×5 OU Constituição×5) + (Poder×2 OU Força×2).
  // As condições NÃO entram aqui — elas geram Entropia-KI (moeda), não mana.
  const primaria = Math.max(a.aspecto, a.constituicao) * 5;
  const primariaLabel = a.aspecto >= a.constituicao ? "Aspecto×5" : "Constituição×5";
  const secundaria = Math.max(a.poder, a.forca) * 2;
  const secundariaLabel = a.poder >= a.forca ? "Poder×2" : "Força×2";
  const entropia = primaria + secundaria;

  const entropiaKiTotal = entropyKiTotal(character);
  const entropiaKiGasto = entropyKiSpent(character);
  const entropiaKiRestante = entropiaKiTotal - entropiaKiGasto;

  const danoMultiplicador = Math.min(3.0, 1.0 + character.level * 0.1);
  const xpParaProximoNivel = (character.level + 1) * 10;

  return {
    vida,
    sanidade,
    entropia,
    entropiaFormula: `${primariaLabel} + ${secundariaLabel}`,
    entropiaKiTotal,
    entropiaKiGasto,
    entropiaKiRestante,
    danoMultiplicador: Number(danoMultiplicador.toFixed(1)),
    xpParaProximoNivel,
  };
}

export function forceRank(character: Character): RankDef {
  return rankFor(effectiveAttributes(character).forca);
}

export interface InventoryStatus {
  capacityLabel: string;
  usedUnits: number;
  /** Melhor capacidade em unidades leves entre os loadouts possíveis. */
  maxUnits: number;
  overCapacity: boolean;
}

export function inventoryStatus(character: Character): InventoryStatus {
  const rank = forceRank(character).rank;
  const cap = INVENTORY_BY_FORCE_RANK[rank];

  const usedUnits = (character.inventory ?? []).reduce(
    (s, item) => s + WEIGHT_UNITS[item.weight] * item.qty,
    0,
  );

  // Converte cada loadout em unidades leves e pega o maior teto.
  const maxUnits = cap.options.reduce((best, opt) => {
    const units =
      (opt.leve ?? 0) * WEIGHT_UNITS.leve +
      (opt.medio ?? 0) * WEIGHT_UNITS.medio +
      (opt.pesado ?? 0) * WEIGHT_UNITS.pesado;
    return Math.max(best, units);
  }, 0);

  return {
    capacityLabel: cap.label,
    usedUnits,
    maxUnits,
    overCapacity: usedUnits > maxUnits,
  };
}

export function clampAttribute(value: number): number {
  return Math.max(0, Math.min(MAX_ATTRIBUTE, Math.round(value)));
}
