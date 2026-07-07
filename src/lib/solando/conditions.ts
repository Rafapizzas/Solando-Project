/**
 * conditions.ts — Catálogo de Condições (desvantagens) do Sistema Solando 4.0.
 *
 * REGRA (corrigida): "O jogador pode impor condições a si mesmo para fortalecer
 * suas habilidades, talentos ou atributos em +2 de Entropia por ponto de
 * Condições." Limite máximo de pontos de condições = 5.
 *
 * Portanto condições NÃO dão pontos de atributo diretamente — elas geram um
 * bônus de Entropia (2 × pontos) que pode ser canalizado para fortalecer a ficha.
 */

/** Cada ponto de Condição concede este bônus de Entropia. */
export const ENTROPY_PER_CONDITION_POINT = 2;
/** Teto de pontos de Condição somados. */
export const MAX_CONDITION_POINTS = 5;

export interface ConditionDef {
  id: string;
  name: string;
  /** Faixa de pontos possível (min–max). */
  min: number;
  max: number;
  description: string;
}

export const CONDITIONS_CATALOG: ConditionDef[] = [
  { id: "alcoolismo", name: "Alcoolismo", min: 1, max: 1, description: "Penalidade em testes sociais e de inteligência. Precisa beber ou fica irritável / com abstinência." },
  { id: "alergia", name: "Alergia", min: 1, max: 3, description: "Alergia a uma substância; a gravidade acompanha os pontos." },
  { id: "amaldicoado", name: "Amaldiçoado", min: 1, max: 5, description: "Perseguido por entidade sobrenatural, má sorte impressionante ou marcado para morrer. Definido pelo Mestre." },
  { id: "amnesia", name: "Amnésia", min: 1, max: 1, description: "Não se recorda da verdadeira identidade ou perdeu a memória recente." },
  { id: "anacronico", name: "Anacrônico", min: 2, max: 2, description: "Não usa tecnologia moderna. 1 dado de desvantagem para usar tecnologia." },
  { id: "analfabetismo", name: "Analfabetismo", min: 1, max: 1, description: "Não sabe ler nem escrever." },
  { id: "aparencia-engracada", name: "Aparência Engraçada", min: 1, max: 3, description: "Aparência é motivo de piada: -4 a -12 em testes sociais." },
  { id: "aparencia-hedionda", name: "Aparência Hedionda", min: 2, max: 2, description: "Aparência monstruosa: -16 em testes sociais, +8 para ameaçar." },
  { id: "assombrado", name: "Assombrado", min: 1, max: 5, description: "Perseguido por um fantasma vingativo. Ameaça varia com os pontos." },
  { id: "avareza", name: "Avareza", min: 1, max: 1, description: "Jamais divide o que tem; motivação é acumular dinheiro." },
  { id: "cego", name: "Cego", min: 1, max: 5, description: "Penalidade em tarefas que exigem visão: -2 a -10 em Destreza." },
  { id: "claustrofobia", name: "Claustrofobia", min: 1, max: 1, description: "1 dado de desvantagem em locais apertados." },
  { id: "cleptomania", name: "Cleptomania", min: 1, max: 1, description: "Não resiste a roubar quando há oportunidade." },
  { id: "codigo-de-honra", name: "Código de Honra", min: 1, max: 5, description: "Segue um código; quebrá-lo gera penalidades negociadas com o Mestre." },
  { id: "corcunda", name: "Corcunda", min: 4, max: 4, description: "-8 em testes sociais e de Destreza." },
  { id: "daltonico", name: "Daltônico", min: 1, max: 1, description: "Dificuldade de diferenciar/enxergar cores." },
  { id: "deficiencia-auditiva", name: "Deficiência Auditiva", min: 1, max: 3, description: "Ouve mal ou é surdo: -4 a -12 em Percepção." },
  { id: "dependencia-vampirica", name: "Dependência Vampírica", min: 5, max: 5, description: "Precisa de sangue a cada 2 cenas ou perde Vida/Sanidade; ao zerar Sanidade entra em 'berserker'." },
  { id: "dependente", name: "Dependente", min: 1, max: 5, description: "Depende de alguém/algo para sobreviver. Valor conforme raridade/dificuldade." },
  { id: "destreza-reduzida", name: "Destreza Manual Reduzida", min: 1, max: 3, description: "Dificuldade com as mãos: -2 a -6 em Destreza." },
  { id: "dislexia", name: "Dislexia", min: 1, max: 1, description: "Dificuldade de associar símbolos gráficos e sons." },
  { id: "distraido", name: "Distraído", min: 1, max: 1, description: "-4 em Percepção; dificuldade de concentração." },
  { id: "doente-terminal", name: "Doente Terminal", min: 3, max: 3, description: "-2 em Força, Constituição e Destreza." },
  { id: "enxaqueca", name: "Enxaqueca", min: 3, max: 3, description: "Rola 1d6 nas ações; 1 ou 6 aplica -12 pela enxaqueca." },
  { id: "epilepsia", name: "Epilepsia", min: 5, max: 5, description: "Rola 1d6; se cair 1, falha automática na ação." },
  { id: "escravo", name: "Escravo", min: 1, max: 5, description: "É escravo de um mestre; pode ser vendido/sacrificado." },
  { id: "estigma-social", name: "Estigma Social", min: 2, max: 4, description: "Rejeitado socialmente: -8 a -16 em testes sociais." },
  { id: "fanatico", name: "Fanático", min: 1, max: 5, description: "Crença fanática; quebrar preceitos causa dano de Sanidade ou perseguição." },
  { id: "feio", name: "Feio", min: 1, max: 3, description: "Aparência desagradável: -4 a -12 em testes sociais." },
  { id: "fobia", name: "Fobia", min: 1, max: 5, description: "Medo irracional: -4 a -20 na presença do medo." },
  { id: "fraco-mistico", name: "Fraco frente a Poderes Místicos", min: 5, max: 5, description: "1 dado de desvantagem contra habilidades místicas e +12 de dano místico recebido." },
  { id: "fragil", name: "Frágil", min: 5, max: 5, description: "+12 de dano físico recebido e -4 de Constituição." },
  { id: "gagueira", name: "Gagueira", min: 1, max: 1, description: "-8 em testes sociais (sedução, diplomacia)." },
  { id: "habitos-odiosos", name: "Hábitos Pessoais Odiosos", min: 3, max: 3, description: "-40 em testes sociais com quem o vir cometendo o ato." },
  { id: "heroico", name: "Heroico", min: 3, max: 3, description: "Nunca recusa um pedido de ajuda, mesmo com risco de vida." },
  { id: "idoso", name: "Idoso", min: 3, max: 3, description: "-2 em todos os atributos físicos (Força, Destreza, Constituição)." },
  { id: "imbecil", name: "Imbecil", min: 4, max: 4, description: "1 dado de desvantagem em Mente e -4 no atributo." },
  { id: "inimigo-pessoal", name: "Inimigo Pessoal", min: 5, max: 5, description: "Um inimigo pessoal o persegue nas aventuras." },
  { id: "inimigos", name: "Inimigos", min: 1, max: 5, description: "Organizações/gangues/máfias no seu encalço. Valor conforme poder delas." },
  { id: "lento", name: "Lento", min: 1, max: 5, description: "-2 a -10 em Destreza." },
  { id: "loucura", name: "Loucura", min: 1, max: 3, description: "Distúrbio psiquiátrico (esquizofrenia, mania, paranoia...)." },
  { id: "ma-reputacao", name: "Má Reputação", min: 1, max: 5, description: "Passado sombrio o persegue." },
  { id: "ma-sorte", name: "Má Sorte", min: 5, max: 5, description: "Sorte fixa em 0 — falha automática em qualquer teste de Sorte (não pode upar Sorte)." },
  { id: "manco", name: "Manco", min: 1, max: 1, description: "-8 em deslocamento e testes de correr/andar." },
  { id: "medo-paralisante", name: "Medo Paralisante", min: 1, max: 5, description: "Paralisa diante do medo; teste de desejo para se mover." },
  { id: "medroso", name: "Medroso", min: 1, max: 1, description: "Evita combates e perigos." },
  { id: "mente-fraca", name: "Mente Fraca", min: 3, max: 3, description: "Facilmente convencido de qualquer coisa." },
  { id: "mudo", name: "Mudo", min: 2, max: 2, description: "Incapaz de se comunicar verbalmente." },
  { id: "obcecado", name: "Obcecado", min: 1, max: 3, description: "Obsessão severa que atrapalha a vida social." },
  { id: "obeso", name: "Obeso", min: 1, max: 3, description: "-2 a -6 de Destreza." },
  { id: "olhos-deficientes", name: "Olhos Deficientes", min: 3, max: 3, description: "-12 em Percepção (não corrigível por lentes)." },
  { id: "ossos-frageis", name: "Ossos Frágeis", min: 5, max: 5, description: "Dano dobrado de ataques de contusão (socos, chutes, marteladas)." },
  { id: "pacifista", name: "Pacifista Radical", min: 5, max: 5, description: "Jamais ataca; se entrar em combate, -8 de Sanidade/turno e -12 depois." },
  { id: "paranoico", name: "Paranoico", min: 1, max: 1, description: "Acha que é perseguido; não confia em ninguém." },
  { id: "passado-negro", name: "Passado Negro", min: 1, max: 5, description: "Segredo no passado afeta relacionamentos, Sanidade e vida pessoal." },
  { id: "pesadelos", name: "Pesadelos Constantes", min: 4, max: 4, description: "Testes noturnos; ao falhar recebe dano de Sanidade." },
  { id: "procurado", name: "Procurado pelas Autoridades", min: 1, max: 5, description: "Fugindo das autoridades." },
  { id: "reducao-vida", name: "Redução de Pontos de Vida", min: 1, max: 5, description: "-2 a -10 de Constituição (não pode ficar com vida negativa por isso)." },
  { id: "renegado", name: "Renegado", min: 2, max: 2, description: "1 dado de desvantagem em testes sociais." },
  { id: "sem-fe", name: "Sem Fé", min: 1, max: 1, description: "Não pode usar poderes baseados em fé/desejo (Epithymía)." },
  { id: "sensivel-luz", name: "Sensível à Luz", min: 1, max: 5, description: "-3 a -15 de Destreza sob luz." },
  { id: "traumatizado", name: "Traumatizado", min: 1, max: 5, description: "-4 a -20 em testes de Sanidade e sociais." },
  { id: "viciado", name: "Viciado", min: 1, max: 5, description: "Comportamento autodestrutivo; vício em substância." },
  { id: "timidez", name: "Timidez", min: 1, max: 3, description: "-4 a -12 em tratos sociais." },
  { id: "teimoso", name: "Teimoso", min: 1, max: 1, description: "Não muda de opinião facilmente." },
];

export function findCondition(id: string): ConditionDef | undefined {
  return CONDITIONS_CATALOG.find((c) => c.id === id);
}
