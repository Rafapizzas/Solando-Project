/**
 * dice.ts — Rolagem de dados do sistema Solando.
 *
 * Regra base: teste = 1d100. Ranks concedem dados extras de vantagem
 * (pega o maior) ou desvantagem (pega o pior). Competências somam +10 por nível.
 */

import { RANKS, rankFor } from "./rules";

export interface DieRoll {
  sides: number;
  value: number;
}

export interface RollResult {
  /** Todos os dados rolados (para o "pool" de vantagem/desvantagem). */
  pool: number[];
  /** Dado escolhido (maior em vantagem, menor em desvantagem, único caso neutro). */
  chosen: number;
  /** Modificador plano somado (competências, bônus/penalidades). */
  modifier: number;
  /** Resultado final = chosen + modifier. */
  total: number;
  /** Número de dados de vantagem (>0) ou desvantagem (<0). */
  diceMod: number;
  faces: number;
  crit: "critico" | "falha-critica" | null;
  label?: string;
}

function rollDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Rola um teste com vantagem/desvantagem.
 * @param faces faces do dado (padrão 100)
 * @param diceMod +N vantagem / -N desvantagem (rola |N|+1 dados)
 * @param modifier bônus/penalidade plano (competências, condições...)
 */
export function roll(
  faces = 100,
  diceMod = 0,
  modifier = 0,
  label?: string,
): RollResult {
  const count = Math.abs(diceMod) + 1;
  const pool: number[] = [];
  for (let i = 0; i < count; i++) pool.push(rollDie(faces));

  let chosen: number;
  if (diceMod > 0) chosen = Math.max(...pool);
  else if (diceMod < 0) chosen = Math.min(...pool);
  else chosen = pool[0];

  const total = chosen + modifier;

  // Crítico/falha crítica com base no dado d100 (regra de defesa por Constituição
  // e leitura geral de acertos/erros extremos).
  let crit: RollResult["crit"] = null;
  if (faces === 100) {
    if (chosen >= 96) crit = "critico";
    else if (chosen <= 5) crit = "falha-critica";
  }

  return { pool, chosen, modifier, total, diceMod, faces, crit, label };
}

/**
 * Rola um teste de atributo: converte pontos do atributo em rank -> diceMod.
 * Se o atributo está em Rank F (0 pontos), retorna falha absoluta.
 */
export function rollAttribute(
  attributePoints: number,
  competenceLevel = 0,
  extraModifier = 0,
  label?: string,
): RollResult & { falhaAbsoluta: boolean } {
  const rank = rankFor(attributePoints);
  const falhaAbsoluta = rank.rank === "F";
  const modifier = competenceLevel * 10 + extraModifier;
  const result = roll(100, rank.diceMod, modifier, label);
  return { ...result, falhaAbsoluta };
}

/** Rola a Sorte inicial (1d20). */
export function rollLuck(): number {
  return rollDie(20);
}

/**
 * "Homem Apostador": arrisca tudo no d20 de Sorte.
 * 20 -> 40, 1 -> 0 (sorte nula), qualquer outro -> valor do dado.
 */
export function gamblerLuck(): { die: number; luck: number; nula: boolean } {
  const die = rollDie(20);
  if (die === 20) return { die, luck: 40, nula: false };
  if (die === 1) return { die, luck: 0, nula: true };
  return { die, luck: die, nula: false };
}

/** Interpreta uma expressão simples de dados tipo "2d20+5" ou "1d100-4". */
export function rollExpression(expr: string): RollResult | null {
  const m = expr
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?$/);
  if (!m) return null;
  const count = Math.max(1, parseInt(m[1], 10));
  const faces = Math.max(2, parseInt(m[2], 10));
  const modifier = m[3] ? parseInt(m[3].replace(/\s/g, ""), 10) : 0;

  const pool: number[] = [];
  for (let i = 0; i < count; i++) pool.push(rollDie(faces));
  const sum = pool.reduce((a, b) => a + b, 0);

  return {
    pool,
    chosen: sum,
    modifier,
    total: sum + modifier,
    diceMod: 0,
    faces,
    crit: null,
    label: expr,
  };
}

export { RANKS };
