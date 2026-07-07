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

/* ------------------------------------------------------------------ *
 * Manual por TÓPICOS — para responder rápido: em vez de mandar o manual
 * inteiro a cada pergunta, selecionamos só as seções relevantes (menos
 * tokens = resposta mais ágil e barata). As regras nucleares (fórmulas)
 * vão sempre junto, pois são curtas e pedidas com frequência.
 * ------------------------------------------------------------------ */

interface ManualSection {
  id: string;
  title: string;
  /** Palavras-chave (sem acento, minúsculas) que ativam esta seção. */
  keywords: string[];
  build: () => string;
}

let sectionsCache: ManualSection[] | null = null;

function getSections(): ManualSection[] {
  if (sectionsCache) return sectionsCache;
  sectionsCache = [
    {
      id: "racas",
      title: "RAÇAS",
      keywords: ["raca", "racas", "raça", "especie", "linhagem", "fraqueza", "habilidade racial"],
      build: () =>
        RACES.map(
          (r) =>
            `- ${r.name}: ${r.lore} Habilidades: ${r.abilities} Fraquezas: ${r.weaknesses}`,
        ).join("\n"),
    },
    {
      id: "classes",
      title: "CLASSES",
      keywords: ["classe", "classes", "progressao", "progressão", "role", "papel", "nivel 0", "arquetipo"],
      build: () =>
        CLASSES.filter((c) => !c.secret)
          .map(
            (c) =>
              `- ${c.name} (${c.role}): Nível 0 — ${c.level0} Progressão: ${c.progression}`,
          )
          .join("\n"),
    },
    {
      id: "talentos",
      title: "TALENTOS",
      keywords: ["talento", "talentos", "pericia", "perícia", "tier", "pontos de talento"],
      build: () =>
        TALENTS.map((t) => {
          const tiers = t.tiers.map((tier) => `${tier.points}pt: ${tier.effect}`).join(" | ");
          return `- ${t.name} [${t.category}]: ${t.summary} Tiers: ${tiers}`;
        }).join("\n"),
    },
    {
      id: "condicoes",
      title: "CONDIÇÕES",
      keywords: ["condicao", "condição", "condicoes", "condições", "desvantagem", "ki", "entropia-ki"],
      build: () =>
        CONDITIONS_CATALOG.map(
          (c) => `- ${c.name} (${c.min}–${c.max} pts): ${c.description}`,
        ).join("\n"),
    },
    {
      id: "competencias",
      title: "COMPETÊNCIAS",
      keywords: ["competencia", "competência", "competencias", "proficiencia", "proficiência", "area", "área"],
      build: () =>
        COMPETENCES.map(
          (c) => `- ${c.name} [${c.group}]: ${c.description}`,
        ).join("\n"),
    },
    {
      id: "entropia",
      title: "FONTES DE ENTROPIA",
      keywords: ["entropia", "fonte", "fontes", "mana", "espectro", "mente", "corpo", "alma", "magia"],
      build: () =>
        ENTROPY_SOURCES.map(
          (f) => `- ${f.label} (${f.spectrumLabel}): ${f.passive} ${f.description}`,
        ).join("\n"),
    },
    {
      id: "skills",
      title: "EFEITOS DE SKILL (Grimório)",
      keywords: ["skill", "skills", "grimorio", "grimório", "efeito", "dano", "cura", "custo", "potencia", "potência"],
      build: () =>
        SKILL_EFFECTS.map(
          (e) => `- ${e.label}: ${e.proportion} (${e.action})`,
        ).join("\n"),
    },
  ];
  return sectionsCache;
}

/** Remove acentos e baixa a caixa para casar palavras-chave. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Monta um contexto FOCADO na pergunta: regras nucleares (sempre) + apenas as
 * seções do manual cujas palavras-chave aparecem na pergunta. Se nada casar
 * (pergunta genérica), devolve o manual completo como rede de segurança.
 */
export function buildFocusedContext(question: string): string {
  const q = normalize(question);
  const matched = getSections().filter((s) =>
    s.keywords.some((k) => q.includes(normalize(k))),
  );

  if (matched.length === 0) return buildManualContext();

  const blocks = matched.map((s) => `\n== ${s.title} ==\n${s.build()}`);
  return [coreRules(), ...blocks].join("\n");
}
