/**
 * knowledge.ts — Compila um "digesto" textual do manual do Solando a partir dos
 * dados estruturados (raças, classes, talentos, condições, competências, fontes
 * de Entropia, efeitos de skill e regras nucleares).
 *
 * Usado para "aterrar" (grounding) o Consultor de Regras com IA: a resposta deve
 * se basear NESTE conteúdo, não em invenções. É puro (sem dependências de
 * navegador), então pode rodar no servidor (rota /api/consultor).
 */

import { RACES } from "./races";
import { CLASSES } from "./classes";
import { TALENTS, BASE_TALENT_POINTS, PER_LEVEL_TALENT_POINTS } from "./talents";
import {
  CONDITIONS_CATALOG,
  ENTROPY_PER_CONDITION_POINT,
  MAX_CONDITION_POINTS,
} from "./conditions";
import {
  COMPETENCES,
  INITIAL_COMPETENCE_POINTS,
  BONUS_PER_COMPETENCE_LEVEL,
} from "./competences";
import { ATTRIBUTES, ENTROPY_SOURCES } from "./rules";
import { SKILL_EFFECTS } from "./skillBuilder";

/** Cache do digesto do manual (dados estáticos → calcula uma vez). */
let manualCache: string | null = null;

function coreRules(): string {
  const attrs = ATTRIBUTES.map((a) => `${a.label} (${a.short}): ${a.description}`).join(
    "\n",
  );
  return [
    "== REGRAS NUCLEARES ==",
    "Atributos (0 a 100 cada):",
    attrs,
    "",
    "Estatísticas derivadas:",
    "- Vida = Constituição × 10.",
    "- Sanidade = Aspecto × 10.",
    "- Entropia (mana máxima) = (maior entre Aspecto e Constituição) × 5 + (maior entre Poder e Força) × 2.",
    "- Multiplicador de dano = min(3.0, 1 + nível × 0.1).",
    "- XP para o próximo nível = (nível atual + 1) × 10.",
    "- Classes evoluem nos níveis 0, 4, 8, 12, 16 e 20.",
    "",
    `Talentos: ${BASE_TALENT_POINTS} pontos no nível 0, +${PER_LEVEL_TALENT_POINTS} por nível (classes podem dar extras).`,
    `Competências: ${INITIAL_COMPETENCE_POINTS} pontos iniciais; cada nível de proficiência soma +${BONUS_PER_COMPETENCE_LEVEL} no dado da área (teto nv0 +20, nv5 +40, nv10 +60, nv15 +80, nv20 +100).`,
    `Condições (desvantagens): no máximo ${MAX_CONDITION_POINTS} pontos somados; cada ponto gera +${ENTROPY_PER_CONDITION_POINT} de Entropia-KI (moeda) para fortalecer a ficha — NÃO dão atributo direto.`,
  ].join("\n");
}

/** Monta o texto completo do manual para grounding. */
export function buildManualContext(): string {
  if (manualCache !== null) return manualCache;
  const racas = RACES.map(
    (r) => `- ${r.name}: ${r.lore} Habilidades: ${r.abilities} Fraquezas: ${r.weaknesses}`,
  ).join("\n");

  const classes = CLASSES.filter((c) => !c.secret)
    .map((c) => `- ${c.name} (${c.role}): Nível 0 — ${c.level0} Progressão: ${c.progression}`)
    .join("\n");

  const talentos = TALENTS.map((t) => {
    const tiers = t.tiers.map((tier) => `${tier.points}pt: ${tier.effect}`).join(" | ");
    return `- ${t.name} [${t.category}]: ${t.summary} Tiers: ${tiers}`;
  }).join("\n");

  const condicoes = CONDITIONS_CATALOG.map(
    (c) => `- ${c.name} (${c.min}–${c.max} pts): ${c.description}`,
  ).join("\n");

  const competencias = COMPETENCES.map(
    (c) => `- ${c.name} [${c.group}]: ${c.description}`,
  ).join("\n");

  const fontes = ENTROPY_SOURCES.map(
    (f) => `- ${f.label} (${f.spectrumLabel}): ${f.passive} ${f.description}`,
  ).join("\n");

  const efeitos = SKILL_EFFECTS.map(
    (e) => `- ${e.label}: ${e.proportion} (${e.action})`,
  ).join("\n");

  manualCache = [
    coreRules(),
    "\n== RAÇAS ==\n" + racas,
    "\n== CLASSES ==\n" + classes,
    "\n== TALENTOS ==\n" + talentos,
    "\n== CONDIÇÕES ==\n" + condicoes,
    "\n== COMPETÊNCIAS ==\n" + competencias,
    "\n== FONTES DE ENTROPIA ==\n" + fontes,
    "\n== EFEITOS DE SKILL (Grimório) ==\n" + efeitos,
  ].join("\n");
  return manualCache;
}

/**
 * Contexto mais enxuto para geração de personagens/NPCs: regras nucleares +
 * lista de raças, classes e fontes de Entropia (sem talentos/competências
 * detalhados), suficiente para a IA propor builds coerentes com o sistema.
 */
export function buildCreationContext(): string {
  const racas = RACES.map((r) => `- ${r.name}: ${r.lore}`).join("\n");
  const classes = CLASSES.filter((c) => !c.secret)
    .map((c) => `- ${c.name} (${c.role})`)
    .join("\n");
  const fontes = ENTROPY_SOURCES.map(
    (f) => `- ${f.label} (${f.spectrumLabel})`,
  ).join("\n");

  return [
    coreRules(),
    "\n== RAÇAS DISPONÍVEIS ==\n" + racas,
    "\n== CLASSES DISPONÍVEIS ==\n" + classes,
    "\n== FONTES DE ENTROPIA ==\n" + fontes,
  ].join("\n");
}
