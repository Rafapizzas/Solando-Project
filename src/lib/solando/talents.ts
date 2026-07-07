/**
 * talents.ts — Catálogo oficial de Talentos do Sistema Solando 4.0.
 *
 * Jogadores começam com 5 pontos de Talento no nível 0, +1 por nível
 * (classes podem conceder pontos extras). Cada talento tem um ou mais níveis
 * (tiers), cada tier com um custo em pontos e o efeito prático.
 */

export interface TalentTier {
  points: number;
  effect: string;
}

export interface TalentDef {
  id: string;
  name: string;
  /** Categoria para filtro/organização. */
  category: "combate" | "místico" | "físico" | "social" | "utilidade" | "narrativo";
  summary: string;
  tiers: TalentTier[];
}

/** Pontos de talento base no nível 0. */
export const BASE_TALENT_POINTS = 5;
/** Pontos de talento ganhos por nível. */
export const PER_LEVEL_TALENT_POINTS = 1;

export const TALENTS: TalentDef[] = [
  {
    id: "absorcao-dano",
    name: "Absorção de Dano",
    category: "físico",
    summary: "Absorve dano físico ou místico instantaneamente (via condição narrativa).",
    tiers: [
      { points: 1, effect: "Absorve 4 de dano físico ou místico." },
      { points: 2, effect: "Absorve 8 de dano físico ou místico." },
      { points: 3, effect: "Absorve 12 de dano físico ou místico." },
      { points: 4, effect: "Absorve 16 de dano físico ou místico." },
      { points: 5, effect: "Absorve 20 de dano físico ou místico." },
    ],
  },
  {
    id: "adaptabilidade-cultural",
    name: "Adaptabilidade Cultural",
    category: "social",
    summary: "Adapta-se a culturas estranhas/alienígenas.",
    tiers: [{ points: 1, effect: "+20 em testes de Carisma em ambientes de cultura estranha." }],
  },
  {
    id: "aliados",
    name: "Aliados",
    category: "narrativo",
    summary: "NPCs à disposição ('conheço um cara').",
    tiers: [
      { points: 1, effect: "1 aliado." },
      { points: 2, effect: "2 aliados." },
      { points: 3, effect: "3 aliados." },
    ],
  },
  {
    id: "alimentacao-diferente",
    name: "Alimentação Diferente",
    category: "utilidade",
    summary: "Não precisa comer nem beber (se sustenta por outro meio).",
    tiers: [{ points: 1, effect: "Dispensa comida/bebida (luz solar, magia, tecnologia...)." }],
  },
  {
    id: "alma-fechada",
    name: "Alma Fechada",
    category: "místico",
    summary: "Imune a dano místico.",
    tiers: [
      {
        points: 5,
        effect:
          "Imune a dano místico; feitiços refletem. Só sofre dano físico/mental. Atacantes com 20+ no atributo de dano (ou 40 de dano) causam dano com -50%.",
      },
    ],
  },
  {
    id: "ambidestria",
    name: "Ambidestria",
    category: "combate",
    summary: "Luta com duas armas sem penalidade.",
    tiers: [{ points: 1, effect: "Usa 2 armas ao mesmo tempo sem o dado de desvantagem." }],
  },
  {
    id: "anfibio",
    name: "Anfíbio",
    category: "físico",
    summary: "Respira debaixo d'água.",
    tiers: [{ points: 1, effect: "Pode respirar debaixo d'água." }],
  },
  {
    id: "aparencia",
    name: "Aparência",
    category: "social",
    summary: "Beleza acima da média concede bônus social.",
    tiers: [
      { points: 1, effect: "Bela: +4 em testes sociais." },
      { points: 2, effect: "Belíssima: +8 em testes sociais." },
      { points: 3, effect: "Modelo internacional: +12 em testes sociais." },
      { points: 4, effect: "Modelo galáctico: +16 em testes sociais." },
      { points: 5, effect: "Modelo interestelar: +20 em testes sociais." },
    ],
  },
  {
    id: "arrojado",
    name: "Arrojado",
    category: "social",
    summary: "Pontos extras em Aspecto.",
    tiers: [
      { points: 1, effect: "+2 de Aspecto." },
      { points: 2, effect: "+4 de Aspecto." },
      { points: 3, effect: "+6 de Aspecto." },
      { points: 4, effect: "+8 de Aspecto." },
      { points: 5, effect: "+10 de Aspecto." },
    ],
  },
  {
    id: "ataque-especial",
    name: "Ataque Especial",
    category: "combate",
    summary: "Ataque que gasta Entropia e aumenta muito o dano (ação de movimento).",
    tiers: [
      { points: 1, effect: "12 de Entropia: +10 de dano e +5 no dado em um alvo." },
      { points: 2, effect: "16 de Entropia: +20 de dano e +10 no dado." },
      { points: 3, effect: "24 de Entropia: +30 de dano e +15 no dado." },
      { points: 4, effect: "32 de Entropia: +40 de dano e +20 no dado." },
      { points: 5, effect: "40 de Entropia: +50 de dano e +25 no dado." },
    ],
  },
  {
    id: "aumento-velocidade",
    name: "Aumento de Velocidade",
    category: "físico",
    summary: "Gasta Entropia para ganhar Destreza por 1 turno.",
    tiers: [
      { points: 1, effect: "4 de Entropia: +6 de Destreza por 1 turno." },
      { points: 2, effect: "8 de Entropia: +12 de Destreza por 1 turno." },
      { points: 3, effect: "12 de Entropia: +20 de Destreza por 1 turno." },
      { points: 4, effect: "16 de Entropia: +24 de Destreza por 1 turno." },
      { points: 5, effect: "20 de Entropia: +30 de Destreza por 1 turno." },
    ],
  },
  {
    id: "aumento-densidade",
    name: "Aumento da Densidade",
    category: "físico",
    summary: "Gasta Entropia para ganhar defesa por 1 turno.",
    tiers: [
      { points: 1, effect: "4 de Entropia: +10 de defesa física ou mística por 1 turno." },
      { points: 2, effect: "8 de Entropia: +20 de defesa por 1 turno." },
      { points: 3, effect: "12 de Entropia: +28 de defesa por 1 turno." },
      { points: 4, effect: "16 de Entropia: +36 de defesa por 1 turno." },
      { points: 5, effect: "20 de Entropia: +44 de defesa por 1 turno." },
    ],
  },
  {
    id: "carga-extra",
    name: "Carga Extra",
    category: "utilidade",
    summary: "Carrega itens 1 nível acima do seu rank.",
    tiers: [{ points: 2, effect: "Carrega itens/armas 1 nível acima do que a Força permite." }],
  },
  {
    id: "defesa-mental",
    name: "Defesa Mental",
    category: "místico",
    summary: "Resistência a ataques mentais e em Sanidade.",
    tiers: [
      { points: 1, effect: "+4 de resistência mental e em Sanidade." },
      { points: 2, effect: "+8 de resistência mental e em Sanidade." },
      { points: 3, effect: "+12 de resistência mental e em Sanidade." },
      { points: 4, effect: "+16 de resistência mental e em Sanidade." },
      { points: 5, effect: "+20 de resistência mental e em Sanidade." },
    ],
  },
  {
    id: "destino",
    name: "Destino",
    category: "narrativo",
    summary: "Invoca seu destino para virar a mesa.",
    tiers: [
      {
        points: 5,
        effect:
          "Em momentos dramáticos: +50 em uma rolagem ou altera a narrativa. 1× por sessão (ou a cada 4h de jogo).",
      },
    ],
  },
  {
    id: "duro-de-matar",
    name: "Duro de Matar",
    category: "físico",
    summary: "Pontos extras em Constituição.",
    tiers: [
      { points: 1, effect: "+2 de Constituição." },
      { points: 2, effect: "+4 de Constituição." },
      { points: 3, effect: "+6 de Constituição." },
      { points: 4, effect: "+8 de Constituição." },
      { points: 5, effect: "+10 de Constituição." },
    ],
  },
  {
    id: "energia-extra",
    name: "Energia Extra",
    category: "místico",
    summary: "Entropia máxima adicional.",
    tiers: [
      { points: 1, effect: "+15 de Entropia máxima." },
      { points: 2, effect: "+30 de Entropia máxima." },
      { points: 3, effect: "+45 de Entropia máxima." },
      { points: 4, effect: "+60 de Entropia máxima." },
      { points: 5, effect: "+75 de Entropia máxima." },
    ],
  },
  {
    id: "favor-divino",
    name: "Favor Divino",
    category: "narrativo",
    summary: "Invoca seu deus/fé para auxílio.",
    tiers: [
      {
        points: 5,
        effect: "Auxílio narrativo ou +50 em uma rolagem. 1× por sessão (ou a cada 4h).",
      },
    ],
  },
  {
    id: "garras",
    name: "Garras",
    category: "combate",
    summary: "Garras naturais/implantadas.",
    tiers: [{ points: 2, effect: "+8 de dano com garras (podem ser aprimoradas)." }],
  },
  {
    id: "invisibilidade",
    name: "Invisibilidade",
    category: "utilidade",
    summary: "Fica invisível gastando Entropia.",
    tiers: [
      {
        points: 1,
        effect:
          "16 de Entropia: fica invisível, +6 em Furtividade/Combate. Dura cena/combate. Sensores não-ópticos ainda detectam.",
      },
    ],
  },
  {
    id: "invulnerabilidade",
    name: "Invulnerabilidade",
    category: "físico",
    summary: "Imune a dano físico.",
    tiers: [
      {
        points: 5,
        effect:
          "Imune a dano físico; só sofre dano místico. Atacantes com 20+ no atributo de dano (ou 40 de dano) causam dano com -50%.",
      },
    ],
  },
  {
    id: "raio-eletrico",
    name: "Raio Elétrico",
    category: "místico",
    summary: "Controla eletricidade; imune a dano elétrico.",
    tiers: [
      { points: 1, effect: "6 de Entropia: raio de Poder +10 de dano." },
      { points: 2, effect: "8 de Entropia: raio de Poder +16 de dano." },
      { points: 3, effect: "10 de Entropia: raio de Poder +22 de dano." },
      { points: 4, effect: "12 de Entropia: raio de Poder +28 de dano." },
      { points: 5, effect: "14 de Entropia: raio de Poder +34 de dano." },
    ],
  },
  {
    id: "reflexos-combate",
    name: "Reflexos em Combate",
    category: "combate",
    summary: "Bônus de esquiva e percepção.",
    tiers: [{ points: 4, effect: "+4 na esquiva em combate e +4 em testes de Percepção." }],
  },
  {
    id: "sangue-curador",
    name: "Sangue Curador",
    category: "físico",
    summary: "Regeneração de Vida.",
    tiers: [{ points: 4, effect: "Regenera +6 de Vida por turno ou 3d20 na cena; pode doar sangue." }],
  },
  {
    id: "super-forca",
    name: "Super Força",
    category: "físico",
    summary: "Pontos extras em Força.",
    tiers: [
      { points: 1, effect: "+2 de Força." },
      { points: 2, effect: "+4 de Força." },
      { points: 3, effect: "+6 de Força." },
      { points: 4, effect: "+8 de Força." },
      { points: 5, effect: "+10 de Força." },
    ],
  },
  {
    id: "super-inteligencia",
    name: "Super Inteligência",
    category: "utilidade",
    summary: "Pontos extras em Mente.",
    tiers: [
      { points: 1, effect: "+2 de Mente." },
      { points: 2, effect: "+4 de Mente." },
      { points: 3, effect: "+6 de Mente." },
      { points: 4, effect: "+8 de Mente." },
      { points: 5, effect: "+10 de Mente." },
    ],
  },
  {
    id: "super-poder",
    name: "Super Poder",
    category: "místico",
    summary: "Pontos extras em Poder.",
    tiers: [
      { points: 1, effect: "+2 de Poder." },
      { points: 2, effect: "+4 de Poder." },
      { points: 3, effect: "+6 de Poder." },
      { points: 4, effect: "+8 de Poder." },
      { points: 5, effect: "+10 de Poder." },
    ],
  },
  {
    id: "super-velocidade",
    name: "Super Velocidade",
    category: "físico",
    summary: "Pontos extras em Destreza.",
    tiers: [
      { points: 1, effect: "+2 de Destreza." },
      { points: 2, effect: "+4 de Destreza." },
      { points: 3, effect: "+6 de Destreza." },
      { points: 4, effect: "+8 de Destreza." },
      { points: 5, effect: "+10 de Destreza." },
    ],
  },
  {
    id: "super-cura",
    name: "Super Cura",
    category: "físico",
    summary: "Regeneração de Vida por turno/cena.",
    tiers: [
      { points: 1, effect: "+2 Vida/turno e 1d20/cena." },
      { points: 2, effect: "+4 Vida/turno e 2d20/cena." },
      { points: 3, effect: "+6 Vida/turno e 3d20/cena." },
      { points: 4, effect: "+8 Vida/turno e 4d20/cena." },
      { points: 5, effect: "+10 Vida/turno e 5d20/cena." },
    ],
  },
  {
    id: "super-entropia",
    name: "Super Entropia",
    category: "místico",
    summary: "Regeneração da Fonte por turno/cena.",
    tiers: [
      { points: 1, effect: "+2 Entropia/turno e 1d20/cena." },
      { points: 2, effect: "+4 Entropia/turno e 2d20/cena." },
      { points: 3, effect: "+6 Entropia/turno e 3d20/cena." },
      { points: 4, effect: "+8 Entropia/turno e 4d20/cena." },
      { points: 5, effect: "+10 Entropia/turno e 5d20/cena." },
    ],
  },
  {
    id: "super-lucidez",
    name: "Super Lucidez",
    category: "místico",
    summary: "Regeneração de Sanidade por turno/cena.",
    tiers: [
      { points: 1, effect: "+2 Sanidade/turno e 1d20/cena." },
      { points: 2, effect: "+4 Sanidade/turno e 2d20/cena." },
      { points: 3, effect: "+6 Sanidade/turno e 3d20/cena." },
      { points: 4, effect: "+8 Sanidade/turno e 4d20/cena." },
      { points: 5, effect: "+10 Sanidade/turno e 5d20/cena." },
    ],
  },
  {
    id: "sorte-sobrenatural",
    name: "Sorte Sobrenatural",
    category: "narrativo",
    summary: "Testes de Sorte máxima por sessão.",
    tiers: [
      { points: 1, effect: "1× por sessão: rola 2d de sorte máxima para somar a uma rolagem." },
      { points: 2, effect: "2 testes de sorte por sessão." },
      { points: 3, effect: "3 testes de sorte por sessão." },
      { points: 4, effect: "4 testes de sorte por sessão." },
      { points: 5, effect: "5 testes de sorte por sessão." },
    ],
  },
  {
    id: "voo",
    name: "Voo",
    category: "utilidade",
    summary: "Pode voar.",
    tiers: [{ points: 1, effect: "Voa." }],
  },
  {
    id: "visao-noturna",
    name: "Visão Noturna",
    category: "utilidade",
    summary: "Enxerga no escuro.",
    tiers: [{ points: 1, effect: "Visão em ambientes com pouca ou nenhuma luz." }],
  },
  {
    id: "poderes-elementais",
    name: "Poderes Elementais (Água/Fogo/Ar/Terra/Luz/Trevas/Plantas)",
    category: "místico",
    summary: "Cria e manipula um elemento à sua escolha.",
    tiers: [
      { points: 1, effect: "Poder +10 de dano, área 5 m. Custo: 4 de Entropia." },
      { points: 2, effect: "Poder +16 de dano, área 5 m. Custo: 6 de Entropia." },
      { points: 3, effect: "Poder +20 de dano, área 10 m. Custo: 8 de Entropia." },
      { points: 4, effect: "Poder +24 de dano, área 10 m. Custo: 10 de Entropia." },
      { points: 5, effect: "Poder +28 de dano, área 10 m. Custo: 12 de Entropia." },
    ],
  },
  {
    id: "especialista-elemental",
    name: "Especialista Elemental (Água/Fogo/Terra/Vento)",
    category: "místico",
    summary: "Desconto no custo das Fontes ao usar um elemento (mín. 2).",
    tiers: [
      { points: 1, effect: "-2 no custo das Fontes." },
      { points: 2, effect: "-4 no custo das Fontes." },
      { points: 3, effect: "-6 no custo das Fontes." },
      { points: 4, effect: "-8 no custo das Fontes." },
      { points: 5, effect: "-10 no custo das Fontes." },
    ],
  },
  {
    id: "mestre-de-arma",
    name: "Mestre de Arma (Arcos/Espadas/Lanças/Martelos)",
    category: "combate",
    summary: "Desconto no custo das Fontes ao usar um tipo de arma (mín. 2).",
    tiers: [
      { points: 1, effect: "-2 no custo das Fontes." },
      { points: 2, effect: "-4 no custo das Fontes." },
      { points: 3, effect: "-6 no custo das Fontes." },
      { points: 4, effect: "-8 no custo das Fontes." },
      { points: 5, effect: "-10 no custo das Fontes." },
    ],
  },
  {
    id: "duplicacao",
    name: "Duplicação",
    category: "místico",
    summary: "Cria cópias idênticas de si (compartilham dano).",
    tiers: [
      { points: 1, effect: "20 de status: 1 cópia por cena/combate." },
      { points: 2, effect: "40 de status: 2 cópias." },
      { points: 3, effect: "60 de status: 3 cópias." },
    ],
  },
  {
    id: "transe",
    name: "Transe",
    category: "místico",
    summary: "Meditação que recupera status.",
    tiers: [
      { points: 3, effect: "Recupera +12 de Entropia/Sanidade/Vida por turno ou 1d100 por cena." },
    ],
  },
  {
    id: "membros-extras",
    name: "Membros Extras",
    category: "físico",
    summary: "Membros adicionais permitem mais ataques.",
    tiers: [
      { points: 3, effect: "1 membro extra: +1 ataque e -4 de Entropia em ação principal (atacar de novo dá 2 desvantagem)." },
      { points: 5, effect: "2 membros extras: +1 ataque e -4 de Entropia (atacar de novo dá 1 desvantagem)." },
    ],
  },
  {
    id: "poderes-vampiricos",
    name: "Poderes Vampíricos",
    category: "místico",
    summary: "Torna-se um vampiro (bônus e fraquezas clássicas).",
    tiers: [
      {
        points: 5,
        effect:
          "+4 Poder/Aspecto/Mente, regeneração, voo, hipnose. Fraqueza a sol/alho/sagrado (+100% dano) e estaca no coração.",
      },
    ],
  },
  {
    id: "poderes-lobisomem",
    name: "Poderes de Lobisomem",
    category: "físico",
    summary: "Transforma-se em lobisomem.",
    tiers: [
      {
        points: 5,
        effect:
          "+4 Força/Destreza/Constituição, +4 dano de garras, +4 defesa/regeneração. 3× dano de prata; fraqueza a Acônito.",
      },
    ],
  },
];

export function findTalent(id: string): TalentDef | undefined {
  return TALENTS.find((t) => t.id === id);
}

export const TALENT_CATEGORIES: Array<{ key: TalentDef["category"]; label: string }> = [
  { key: "combate", label: "Combate" },
  { key: "místico", label: "Místico" },
  { key: "físico", label: "Físico" },
  { key: "social", label: "Social" },
  { key: "utilidade", label: "Utilidade" },
  { key: "narrativo", label: "Narrativo" },
];
