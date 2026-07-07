/**
 * rules.ts — Constantes e tabelas oficiais do Sistema Solando 4.0.
 * Fonte: SISTEMA SOLANDO 4.0.docx + atualizações do mestre (2026).
 *
 * Este arquivo concentra os "números mágicos" do sistema para que qualquer
 * ajuste de regra do mestre seja feito em um único lugar (o sistema é
 * declaradamente variável e sujeito a alterações).
 */

export type AttributeKey =
  | "forca"
  | "mente"
  | "constituicao"
  | "aspecto"
  | "destreza"
  | "poder"
  | "sorte";

export type Rank = "F" | "E" | "D" | "C" | "B" | "A" | "S";

export interface AttributeDef {
  key: AttributeKey;
  label: string;
  short: string;
  /** Espectro/tema visual associado. */
  spectrum: "mente" | "corpo" | "alma" | "sol";
  description: string;
}

/** Ordem canônica de exibição dos atributos na ficha. */
export const ATTRIBUTES: AttributeDef[] = [
  {
    key: "forca",
    label: "Força",
    short: "FOR",
    spectrum: "corpo",
    description:
      "Dano de golpes físicos e capacidade de carregar peso. Define o espaço de inventário.",
  },
  {
    key: "mente",
    label: "Mente",
    short: "MEN",
    spectrum: "mente",
    description:
      "Inteligência, investigação e aptidão. A cada 10 pontos concede +1 skill e +1 competência.",
  },
  {
    key: "constituicao",
    label: "Constituição",
    short: "CON",
    spectrum: "corpo",
    description: "Defesa e resistência. Define a Vida (Constituição × 10).",
  },
  {
    key: "aspecto",
    label: "Aspecto",
    short: "ASP",
    spectrum: "alma",
    description:
      "Carisma, sanidade e força de vontade. Define a Sanidade (Aspecto × 10).",
  },
  {
    key: "destreza",
    label: "Destreza",
    short: "DES",
    spectrum: "corpo",
    description:
      "Velocidade e reflexos. A cada 10 pontos concede +1 skill e +1 competência.",
  },
  {
    key: "poder",
    label: "Poder",
    short: "POD",
    spectrum: "mente",
    description: "Dano de golpes místicos e potência da alma.",
  },
  {
    key: "sorte",
    label: "Sorte",
    short: "SOR",
    spectrum: "sol",
    description:
      "Rolada com 1d20 inicial. Dados de sorte são recorrentes — não subestime.",
  },
];

export const ATTRIBUTE_KEYS: AttributeKey[] = ATTRIBUTES.map((a) => a.key);

/** Pontos iniciais para distribuir entre atributos na criação. */
export const BASE_ATTRIBUTE_POINTS = 20;

/** Ganhos por nível: +4 atributos, +1 up de skill, +1 talento. */
export const PER_LEVEL_ATTRIBUTE_POINTS = 4;
export const PER_LEVEL_SKILL_UPS = 1;
export const PER_LEVEL_TALENT_POINTS = 1;

/** Máximo de pontos que um único atributo pode ter (Rank S). */
export const MAX_ATTRIBUTE = 100;

export interface RankDef {
  rank: Rank;
  label: string;
  /** Faixa de pontos [min, max] inclusiva. */
  min: number;
  max: number;
  /**
   * Dados de vantagem (positivo) ou desvantagem (negativo) no d100.
   * Ex.: +1 = rola 2 dados e pega o melhor; -1 = rola 2 e pega o pior.
   */
  diceMod: number;
  color: string; // classe de cor tailwind (texto)
  ring: string; // classe de cor tailwind (borda/ring)
  blurb: string;
}

/** Tabela de ranks por faixa de pontos (Seção 5 do sistema). */
export const RANKS: RankDef[] = [
  {
    rank: "F",
    label: "Falha Absoluta",
    min: 0,
    max: 0,
    diceMod: 0,
    color: "text-zinc-500",
    ring: "ring-zinc-600",
    blurb: "Atributo zerado: nem rola dados, é falha automática.",
  },
  {
    rank: "E",
    label: "Nível Esqueleto",
    min: 1,
    max: 4,
    diceMod: -1,
    color: "text-red-400",
    ring: "ring-red-500",
    blurb: "Desvantagem nos dados.",
  },
  {
    rank: "D",
    label: "Nível Humano",
    min: 5,
    max: 19,
    diceMod: 0,
    color: "text-zinc-200",
    ring: "ring-zinc-400",
    blurb: "Rola o dado normalmente.",
  },
  {
    rank: "C",
    label: "Super-Humano",
    min: 20,
    max: 39,
    diceMod: 1,
    color: "text-alma-soft",
    ring: "ring-alma",
    blurb: "+1 dado de vantagem.",
  },
  {
    rank: "B",
    label: "Nível Dragão",
    min: 40,
    max: 69,
    diceMod: 2,
    color: "text-mente-soft",
    ring: "ring-mente",
    blurb: "+2 dados de vantagem. Ganha talentos de Rank 5.",
  },
  {
    rank: "A",
    label: "Nível Divino",
    min: 70,
    max: 99,
    diceMod: 3,
    color: "text-sol-soft",
    ring: "ring-sol",
    blurb: "+3 dados de vantagem. Transcendência.",
  },
  {
    rank: "S",
    label: "Nível Máximo",
    min: 100,
    max: 100,
    diceMod: 4,
    color: "text-sol",
    ring: "ring-sol",
    blurb: "+4 dados de vantagem. O pináculo da existência.",
  },
];

/** Retorna a definição de rank para um valor de atributo. */
export function rankFor(points: number): RankDef {
  const p = Math.max(0, points);
  // Percorre do maior para o menor para lidar com o teto de 100+.
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (p >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

/**
 * Espaço de inventário por Rank de Força (ATUALIZAÇÃO do mestre — substitui a
 * tabela antiga do documento).
 */
export type ItemWeight = "leve" | "medio" | "pesado";

export interface InventoryCapacity {
  /** Combinações válidas de carga. Cada combinação é um "loadout" possível. */
  options: Array<Partial<Record<ItemWeight, number>>>;
  /** Texto legível para exibição. */
  label: string;
}

export const INVENTORY_BY_FORCE_RANK: Record<Rank, InventoryCapacity> = {
  F: {
    options: [{ leve: 2 }],
    label: "2 itens leves",
  },
  E: {
    options: [{ leve: 5 }, { medio: 2, leve: 1 }, { pesado: 1, leve: 1 }],
    label: "5 leves | 2 médios e 1 leve | 1 pesado e 1 leve",
  },
  D: {
    options: [{ leve: 10 }, { medio: 5 }, { pesado: 2, medio: 1 }],
    label: "10 leves | 5 médios | 2 pesados e 1 médio",
  },
  C: {
    options: [{ leve: 20 }, { medio: 10 }, { pesado: 5 }],
    label: "20 leves | 10 médios | 5 pesados",
  },
  B: {
    options: [{ leve: 40 }, { medio: 20 }, { pesado: 10 }],
    label: "40 leves | 20 médios | 10 pesados",
  },
  A: {
    options: [{ leve: 60 }, { medio: 30 }, { pesado: 15 }],
    label: "60 leves | 30 médios | 15 pesados",
  },
  S: {
    options: [{ leve: 120 }, { medio: 60 }, { pesado: 30 }],
    label: "120 leves | 60 médios | 30 pesados",
  },
};

/** "Peso" de cada tipo de item em unidades leves, para checagem de carga. */
export const WEIGHT_UNITS: Record<ItemWeight, number> = {
  leve: 1,
  medio: 2,
  pesado: 4,
};

/**
 * Fontes de Entropia — os 3 espectros. Cada fonte concede uma passiva.
 * (Seção 6/7 do sistema.)
 */
export interface EntropySourceDef {
  key: string;
  label: string;
  spectrum: "mente" | "corpo" | "alma";
  spectrumLabel: string;
  passive: string;
  description: string;
}

export const ENTROPY_SOURCES: EntropySourceDef[] = [
  {
    key: "assygnata",
    label: "Assýgnata",
    spectrum: "mente",
    spectrumLabel: "Mente · Magia",
    passive: "+20% de Entropia máxima que acompanha a progressão.",
    description: "Seres nascidos com o dom da magia.",
  },
  {
    key: "desygnata",
    label: "Desýgnata",
    spectrum: "mente",
    spectrumLabel: "Mente · Antimagia",
    passive:
      "Barra de Sintropia no lugar de Entropia. Pode anular magias pagando o custo em Sintropia.",
    description: "Anula magia com a qual tiver contato.",
  },
  {
    key: "thaumofago",
    label: "Thaumófago",
    spectrum: "mente",
    spectrumLabel: "Mente · Thaumofagia",
    passive: "-4 (+1/nível) no custo das habilidades usando a magia do ambiente.",
    description: "Consome a magia do ambiente.",
  },
  {
    key: "anomalo",
    label: "Anômalo",
    spectrum: "corpo",
    spectrumLabel: "Corpo · Sóma",
    passive: "Recupera +4 (+1/nível) de Entropia (ou Vida) por turno, ou 1d20 por cena.",
    description: "Manipula a Entropia através do corpo.",
  },
  {
    key: "regulador",
    label: "Regulador",
    spectrum: "corpo",
    spectrumLabel: "Corpo · Eusōmía",
    passive:
      "Ao acertar 2 ataques num usuário de Sóma, ele fica 1 turno sem poder manipular Sóma.",
    description: "Regula a manipulação corporal alheia.",
  },
  {
    key: "atrofago",
    label: "Atrófago",
    spectrum: "corpo",
    spectrumLabel: "Corpo · Andróphia",
    passive:
      "Absorve objetos físicos para recuperar Entropia/Vida conforme o Rank (E:1, D:2, C:4, B:12, A:25, S:50).",
    description: "Devora matéria para se recuperar.",
  },
  {
    key: "etereo",
    label: "Etéreo",
    spectrum: "alma",
    spectrumLabel: "Alma · Epithymía",
    passive:
      "Teste de Aspecto para canalizar desejos: (rolagem ÷ 10) = bônus num atributo por 1 cena.",
    description: "Canaliza sentimentos em poder.",
  },
  {
    key: "nomo",
    label: "Nómo",
    spectrum: "alma",
    spectrumLabel: "Alma · Kanone",
    passive:
      "Joga 1 (+1 a cada 2 níveis) dado igual à quantidade de skills Etéreas do alvo, anulando-as.",
    description: "Anula habilidades da alma.",
  },
  {
    key: "vorare",
    label: "Vorāre",
    spectrum: "alma",
    spectrumLabel: "Alma · Anaki",
    passive:
      "Devora almas: a cada 5 níveis de almas devoradas recebe 1 up de skill (almas nível 0 não dão nada).",
    description: "Devora almas para crescer.",
  },
];
