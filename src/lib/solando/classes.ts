/**
 * classes.ts — Catálogo de Classes do Sistema Solando 4.0.
 * Cada classe evolui nos níveis 0, 4, 8, 12, 16 e 20. Aqui resumimos o
 * benefício de nível 0 (relevante para a criação) e a progressão.
 */

export interface ClassDef {
  id: string;
  name: string;
  secret?: boolean;
  role: string;
  level0: string;
  progression: string;
  /** Bônus mecânico automatizável no nível 0 (opcional). */
  bonus?: {
    attributePoints?: number;
    talentPoints?: number;
    luckMin?: number;
    note?: string;
  };
}

export const CLASSES: ClassDef[] = [
  {
    id: "artifice",
    name: "Artífice",
    role: "Criação de itens mágicos/tecnológicos",
    level0: "Item inicial rank bronze que evolui com você. Custos de criação temporária reduzidos (50%). Competência em Manufatura ou Manusear equipamentos místicos.",
    progression: "Ganha 'Engenhoca' (trocar aprimoramentos) e reduções crescentes de criação; invoca o item sem custo no nível 8.",
    bonus: { note: "Item inicial bronze + competência" },
  },
  {
    id: "assassino",
    name: "Assassino",
    role: "Dano crítico e execução",
    level0: "+4 de crítico. Skill 'Executor' (marca alvos com ≤20% de vida; crítico neles = estado de morrendo). Competência em uma arte de combate.",
    progression: "Crítico crescente; no nível 8 a marca mata; no nível 16+ dano dobrado/triplicado em alvos com pouca vida.",
    bonus: { note: "+4 de crítico" },
  },
  {
    id: "atirador",
    name: "Atirador",
    role: "Ataques a longa distância",
    level0: "+5 na competência de armas de fogo/longa distância. Crítico via teste de Sorte (>100 = crítico de 3× dano).",
    progression: "'Tiro Certeiro' (penetração de armadura crescente) e muitos pontos de Sorte.",
    bonus: { note: "+5 competência de tiro" },
  },
  {
    id: "bastiao",
    name: "Bastião",
    role: "Tanque / defesa",
    level0: "+8 de redução de dano físico OU místico, ou +4 de ambos. Competência em combate/defesa.",
    progression: "'Retribuição' (devolve dano) e defesa crescente; crítico de bloqueio.",
    bonus: { note: "+8 redução de dano" },
  },
  {
    id: "berserker",
    name: "Berserker",
    role: "Dano crescente ao custo de Sanidade",
    level0: "+2 pontos de atributo. 'Ira Berserker' (+4 num atributo por ataque ao custo de 8 de Sanidade/turno). Competência de combate.",
    progression: "Ira e dano crescentes; imunidade a debuffs no estado.",
    bonus: { attributePoints: 2, note: "+2 pontos de atributo" },
  },
  {
    id: "combatente",
    name: "Combatente",
    role: "Versátil, muitos pontos de atributo",
    level0: "+6 pontos de atributo. Competência de combate/ambidestria.",
    progression: "Ganha muitos pontos de atributo extras a cada nível (+8, +12, +16...).",
    bonus: { attributePoints: 6, note: "+6 pontos de atributo" },
  },
  {
    id: "domador",
    name: "Domador",
    role: "Invocador de criaturas/pactos",
    level0: "Invocação inicial (ficha de nível 0 que evolui). Custos de conjuração reduzidos (50%). Competência em Domesticar.",
    progression: "Absorve características das evocações; invoca sem custo; pode se transformar nelas.",
    bonus: { note: "Invocação inicial + Domesticar" },
  },
  {
    id: "dominador",
    name: "Dominador",
    role: "Domínio elemental",
    level0: "-4 de Status para manipular um elemento. Competência em combate/Sóma/Magia/Epithymía.",
    progression: "Absorve elemento para recuperar atributo; ganha talentos elementais; +24/+48 de dano elemental.",
    bonus: { note: "-4 de custo elemental" },
  },
  {
    id: "mago",
    name: "Mago",
    role: "Conjurador flexível",
    level0: "+2 pontos de talento. Passiva 'segura legal aí dog' (regula potência x custo das skills). 2 competências místicas.",
    progression: "Regula skills plenamente; +pontos de talento; +20 Mente no nível 16; grimório integral no nível 20.",
    bonus: { talentPoints: 2, note: "+2 pontos de talento" },
  },
  {
    id: "monge",
    name: "Monge",
    role: "Combate corpo a corpo com regeneração",
    level0: "Regenera +4 de Entropia/Vida por turno (2d20/cena). Posturas de movimento como ação livre. Competência em combate/Sóma/Eusōmía.",
    progression: "'Selo' (bloqueia manipulação de Entropia do alvo); regeneração crescente.",
    bonus: { note: "+4 regeneração/turno" },
  },
  {
    id: "suporte",
    name: "Suporte",
    role: "Auxílio a aliados",
    level0: "+2 pontos de talento. Pode se meter na ação de outro para auxiliar (1×/rodada). Competência de suporte.",
    progression: "'Salvaguarda' (amplifica buffs/cura/escudos); mais ações de auxílio por rodada.",
    bonus: { talentPoints: 2, note: "+2 pontos de talento" },
  },
  {
    id: "pactuado",
    name: "Pactuado",
    role: "Poder via pacto com uma Fonte",
    level0: "+4 de Aspecto ou Constituição. 'Negociar com a Fonte' (vantagens ao agradar a entidade). Competência em Pactos.",
    progression: "Gasta Sanidade/Constituição para fortalecer skills; ganha Favor Divino; reduções de custo.",
    bonus: { note: "+4 Aspecto ou Constituição" },
  },
  // Secretas
  {
    id: "trapaceiro",
    name: "Trapaceiro",
    secret: true,
    role: "Sorte e metagame",
    level0: "Começa com Sorte em 20. Competência à escolha.",
    progression: "Aplica Sorte em dados de Aspecto; pode 'roubar' regras via metagame (usos limitados).",
    bonus: { luckMin: 20, note: "Sorte inicial 20" },
  },
  {
    id: "sabe-muito",
    name: "Sabe Muito",
    secret: true,
    role: "Conhecimento e informação",
    level0: "+10 em uma competência. 'Jeitinho Brasileiro' (conhecer alguém/informação 1×/sessão). 3 competências à escolha.",
    progression: "'Sabichão' e 'Poço de Conhecimento' (vantagem por competência/informação correta).",
    bonus: { note: "3 competências + Jeitinho Brasileiro" },
  },
  {
    id: "badass",
    name: "Badass",
    secret: true,
    role: "Cenas épicas e aura",
    level0: "+4 de bônus no XP. Críticos recuperam Sanidade de aliados. 1 competência à escolha.",
    progression: "'Aura Farmer' (multiplica um atributo); imunidade a falhas críticas.",
    bonus: { note: "+4 XP" },
  },
];

export function findClass(id: string): ClassDef | undefined {
  return CLASSES.find((c) => c.id === id);
}
