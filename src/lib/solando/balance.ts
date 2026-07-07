/**
 * balance.ts — Assistente de Balanceamento (o "Oráculo da Entropia").
 *
 * Motor determinístico, 100% local e sem custo, que analisa uma ficha e gera
 * insights de balanceamento com base nas regras do Sistema Solando 4.0.
 * Substitui uma IA paga por heurísticas explicáveis e ajustáveis.
 */

import { rankFor, ATTRIBUTES, AttributeKey } from "./rules";
import {
  Character,
  competencePoints,
  competencePointsSpent,
  conditionPointsRaw,
  derivedStats,
  effectiveAttributes,
  entropyKiSpent,
  entropyKiTotal,
  inventoryStatus,
  raceClassAttrBonus,
  remainingAttributePoints,
  skillSlots,
  spentAttributePoints,
  talentPoints,
  talentPointsSpent,
  totalAttributePoints,
} from "./character";
import { MAX_CONDITION_POINTS } from "./conditions";
import { resolveRace } from "./customContent";

export type InsightLevel = "erro" | "alerta" | "dica" | "ok";

export interface Insight {
  level: InsightLevel;
  title: string;
  detail: string;
}

export interface BalanceReport {
  /** 0–100. Quão "válida e equilibrada" está a ficha. */
  score: number;
  valid: boolean; // sem erros bloqueantes
  insights: Insight[];
}

function attrLabel(key: AttributeKey): string {
  return ATTRIBUTES.find((a) => a.key === key)?.label ?? key;
}

export function analyzeCharacter(character: Character): BalanceReport {
  const insights: Insight[] = [];
  const a = character.attributes;
  const eff = effectiveAttributes(character);
  const bonus = raceClassAttrBonus(character);
  const totalBonus = Object.values(bonus).reduce((s, v) => s + (v || 0), 0);

  const total = totalAttributePoints(character);
  const spent = spentAttributePoints(character);
  const remaining = remainingAttributePoints(character);

  // --- Erros bloqueantes -------------------------------------------------
  if (!character.name.trim()) {
    insights.push({
      level: "erro",
      title: "Sem nome",
      detail: "Dê um nome ao personagem antes de finalizar a ficha.",
    });
  }

  if (spent > total) {
    insights.push({
      level: "erro",
      title: "Pontos de atributo excedidos",
      detail: `Você gastou ${spent} de ${total} pontos. Reduza ${spent - total} ponto(s).`,
    });
  }

  // Skills e talentos além do permitido
  const slots = skillSlots(character);
  if (character.skills.length > slots) {
    insights.push({
      level: "erro",
      title: "Skills além do limite",
      detail: `Você tem ${character.skills.length} skills, mas só pode ter ${slots} (1 base + 1 a cada 10 de Mente ou Destreza + ups de nível).`,
    });
  }

  const tPoints = talentPoints(character);
  const tSpent = talentPointsSpent(character);
  if (tSpent > tPoints) {
    insights.push({
      level: "erro",
      title: "Talentos além do orçamento",
      detail: `Talentos custam ${tSpent} pontos, mas você só tem ${tPoints} (5 base no nível 0 + 1 por nível + bônus de classe).`,
    });
  }

  // Condições: teto de 5 pontos
  const condRaw = conditionPointsRaw(character);
  if (condRaw > MAX_CONDITION_POINTS) {
    insights.push({
      level: "erro",
      title: "Condições além do teto",
      detail: `Você tem ${condRaw} pontos de condição, mas o máximo é ${MAX_CONDITION_POINTS}. Só os primeiros ${MAX_CONDITION_POINTS} contam para o bônus de Entropia.`,
    });
  }

  // Competências: não gastar além do disponível
  const compAvail = competencePoints(character);
  const compSpent = competencePointsSpent(character);
  if (compSpent > compAvail) {
    insights.push({
      level: "erro",
      title: "Competências além do orçamento",
      detail: `Você alocou ${compSpent} níveis de competência, mas só tem ${compAvail} pontos (3 iniciais + 1 a cada 10 de Mente ou Destreza).`,
    });
  }

  const inv = inventoryStatus(character);
  if (inv.overCapacity) {
    insights.push({
      level: "erro",
      title: "Inventário sobrecarregado",
      detail: `Carga ${inv.usedUnits} excede a capacidade do seu Rank de Força (${inv.capacityLabel}).`,
    });
  }

  // Entropia-KI: não gastar mais moeda do que a disponível
  const kiTotal = entropyKiTotal(character);
  const kiSpent = entropyKiSpent(character);
  if (kiSpent > kiTotal) {
    insights.push({
      level: "erro",
      title: "Entropia-KI excedida",
      detail: `Você alocou ${kiSpent} de Entropia-KI, mas só tem ${kiTotal} (2 por ponto de condição + concessões de sessão). Reduza ${kiSpent - kiTotal}.`,
    });
  }

  // --- Alertas -----------------------------------------------------------
  if (remaining > 0) {
    insights.push({
      level: "alerta",
      title: "Pontos de atributo sobrando",
      detail: `Ainda há ${remaining} ponto(s) para distribuir.`,
    });
  }

  if (eff.constituicao === 0) {
    insights.push({
      level: "alerta",
      title: "Vida zerada",
      detail:
        "Constituição 0 significa Vida = 0. Com as regras atuais, qualquer dano deixa a vida negativa e você entra em estado de morrendo.",
    });
  }
  if (eff.aspecto === 0) {
    insights.push({
      level: "alerta",
      title: "Sanidade zerada",
      detail: "Aspecto 0 significa Sanidade = 0 — você começa efetivamente insano.",
    });
  }

  // Fonte de entropia sem poder para sustentar
  if (character.entropySource && derivedStats(character).entropia === 0) {
    insights.push({
      level: "alerta",
      title: "Entropia insuficiente",
      detail:
        "Sua fonte de Entropia não terá energia (Entropia = 0). Invista em Aspecto/Constituição e Poder/Força.",
    });
  }

  // --- Dicas de balanceamento -------------------------------------------
  // Bônus de raça/classe: vantagem que deve ser paga com fraquezas.
  if (totalBonus > 0) {
    const race = character.race ? resolveRace(character.race) : undefined;
    const weaknesses = race?.weaknesses?.length ?? 0;
    if (weaknesses === 0) {
      insights.push({
        level: "dica",
        title: "Vantagem sem contrapartida",
        detail: `Raça/classe concedem +${totalBonus} de atributo, mas a raça escolhida não lista fraquezas. Para manter o equilíbrio, adicione fraquezas à raça (em Forjar) ou compense com condições.`,
      });
    } else {
      insights.push({
        level: "dica",
        title: "Balanço de raça/classe",
        detail: `+${totalBonus} de atributo vindo de raça/classe, equilibrado por ${weaknesses} fraqueza(s) da raça. Combos poderosos são intencionais — seguem as regras do manual.`,
      });
    }
  }

  // "Glass cannon": muito dano, pouca defesa
  const dano = Math.max(eff.forca, eff.poder);
  const defesa = eff.constituicao;
  if (dano >= 20 && defesa < 10) {
    insights.push({
      level: "dica",
      title: "Perfil 'canhão de vidro'",
      detail: `Seu ${eff.forca >= eff.poder ? "Força" : "Poder"} está alto (${dano}) mas a Constituição (${defesa}) deixa sua Vida em ${defesa * 10}. Considere reforçar a defesa.`,
    });
  }

  // Sem nenhuma via de dano
  if (eff.forca < 5 && eff.poder < 5) {
    insights.push({
      level: "dica",
      title: "Baixo potencial ofensivo",
      detail: "Força e Poder baixos limitam seu dano. Ao menos um deles no Rank D+ é recomendável.",
    });
  }

  // Competências não distribuídas
  const compLeft = compAvail - compSpent;
  if (compLeft > 0) {
    insights.push({
      level: "dica",
      title: `${compLeft} ponto(s) de competência disponível(is)`,
      detail: "Cada nível de competência dá +10 em dados da área. Distribua nas perícias do personagem.",
    });
  }

  // Sorte não rolada
  if (character.luckRoll === 0 && a.sorte === 0) {
    insights.push({
      level: "dica",
      title: "Role a Sorte",
      detail: "A Sorte começa com um 1d20. Role o dado (ou arrisque como 'Homem Apostador').",
    });
  }

  // Concentração excessiva: um atributo domina tudo
  const values = Object.entries(a) as Array<[AttributeKey, number]>;
  const totalVal = values.reduce((s, [, v]) => s + v, 0);
  if (totalVal > 0) {
    const [topKey, topVal] = values.reduce((m, cur) => (cur[1] > m[1] ? cur : m));
    if (topVal / totalVal > 0.6 && totalVal >= 20) {
      insights.push({
        level: "dica",
        title: "Ficha muito especializada",
        detail: `${attrLabel(topKey)} concentra ${Math.round((topVal / totalVal) * 100)}% dos seus pontos. Personagens muito unidimensionais sofrem em testes variados.`,
      });
    }
  }

  // --- Elogios / OK ------------------------------------------------------
  if (insights.every((i) => i.level !== "erro") && remaining === 0 && totalVal > 0) {
    insights.push({
      level: "ok",
      title: "Ficha dentro das regras",
      detail: "Todos os pontos distribuídos e nenhum limite estourado. Bom trabalho!",
    });
  }

  // --- Score --------------------------------------------------------------
  // Apenas ERROS (bloqueantes) e ALERTAS afetam o score. As "dicas" são
  // sugestões de estilo e não indicam desequilíbrio — uma ficha válida e
  // totalmente preenchida (mesmo com muitos atributos por raça/classe) chega
  // a 100.
  const hasError = insights.some((i) => i.level === "erro");
  let score = 100;
  score -= insights.filter((i) => i.level === "erro").length * 25;
  score -= insights.filter((i) => i.level === "alerta").length * 12;
  score = Math.max(0, Math.min(100, score));

  return { score, valid: !hasError, insights };
}

/**
 * Sugere uma distribuição de atributos a partir de um "arquétipo" e um total de
 * pontos. Ajuda jogadores novatos a começar equilibrados.
 */
export type Archetype =
  | "guerreiro"
  | "mago"
  | "bruto"
  | "tanque"
  | "trapaceiro"
  | "equilibrado";

export const ARCHETYPES: Array<{ key: Archetype; label: string; blurb: string }> = [
  { key: "equilibrado", label: "Equilibrado", blurb: "Bom em tudo, mestre de nada." },
  { key: "guerreiro", label: "Guerreiro", blurb: "Força e Constituição, combate físico." },
  { key: "mago", label: "Mago", blurb: "Poder e Aspecto, dano místico." },
  { key: "bruto", label: "Bruto", blurb: "Força extrema, pouca finesse." },
  { key: "tanque", label: "Tanque", blurb: "Constituição altíssima, aguenta tudo." },
  { key: "trapaceiro", label: "Trapaceiro", blurb: "Destreza, Mente e Sorte." },
];

const WEIGHTS: Record<Archetype, Partial<Record<AttributeKey, number>>> = {
  equilibrado: { forca: 1, mente: 1, constituicao: 1, aspecto: 1, destreza: 1, poder: 1 },
  guerreiro: { forca: 3, constituicao: 3, destreza: 2, mente: 1 },
  mago: { poder: 4, aspecto: 3, mente: 2, constituicao: 1 },
  bruto: { forca: 5, constituicao: 3 },
  tanque: { constituicao: 5, forca: 2, aspecto: 1 },
  trapaceiro: { destreza: 4, mente: 3, sorte: 2, aspecto: 1 },
};

export function suggestDistribution(
  archetype: Archetype,
  totalPoints: number,
): Record<AttributeKey, number> {
  const weights = WEIGHTS[archetype];
  const sumW = Object.values(weights).reduce((s, w) => s + (w ?? 0), 0);
  const result: Record<AttributeKey, number> = {
    forca: 0,
    mente: 0,
    constituicao: 0,
    aspecto: 0,
    destreza: 0,
    poder: 0,
    sorte: 0,
  };
  let allocated = 0;
  const entries = Object.entries(weights) as Array<[AttributeKey, number]>;
  for (const [key, w] of entries) {
    const pts = Math.floor((totalPoints * w) / sumW);
    result[key] = pts;
    allocated += pts;
  }
  // Distribui a sobra por arredondamento no atributo de maior peso.
  const leftover = totalPoints - allocated;
  if (leftover > 0 && entries.length) {
    const topKey = entries.reduce((m, c) => (c[1] > m[1] ? c : m))[0];
    result[topKey] += leftover;
  }
  return result;
}
