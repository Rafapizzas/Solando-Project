/**
 * races.ts — Catálogo de Raças do Sistema Solando 4.0.
 * As raças são um "norte": o jogador pode criar as suas com aval do Mestre.
 */

export interface RaceDef {
  id: string;
  name: string;
  lore: string;
  abilities: string;
  weaknesses: string;
}

export const RACES: RaceDef[] = [
  {
    id: "aasimar",
    name: "Aasimar",
    lore: "Descendentes de deuses/anjos, refugiados da guerra entre deuses e demônios. Deram origem a cleros e Assýgnatas.",
    abilities: "Compartilham habilidades de anjos/deuses (escolher com o Mestre).",
    weaknesses: "Fraquezas de anjos/deuses (escolher com o Mestre).",
  },
  {
    id: "agrios",
    name: "Ágrios",
    lore: "Humanoides com características de animais conhecidos.",
    abilities: "Atributos semelhantes aos do animal (força acima da média, super audição etc. — combinar com o Mestre).",
    weaknesses: "Adquirem também manias e defeitos do animal (combinar com o Mestre).",
  },
  {
    id: "anao",
    name: "Anão",
    lore: "Baixa estatura, exímios ferreiros e artesãos, inteligentes e persuasivos.",
    abilities: "+8 de resistência física, +4 de Força e Aspecto, +1 dado para criação de itens e vendas.",
    weaknesses: "Gananciosos: 1 dado de desvantagem para resistir a suborno e em Destreza para corrida/acrobacia.",
  },
  {
    id: "androide",
    name: "Androide",
    lore: "Seres artificiais que não evoluem por nível — aprimoram peças (módulos). Sem alma nem magia natural.",
    abilities: "Gerador Perpétuo (regenera 4 de Bateria/turno, sem barra de Entropia). Sem Alma (imune a mente/alma). Mente Sintética (+4 lógica, hackeia). Atualização Modular.",
    weaknesses: "Sem classe; atributos fixos em 50 pts e 1 competência inicial. Vulnerável a eletricidade/PEM (dano dobrado).",
  },
  {
    id: "anjos",
    name: "Anjos",
    lore: "Seres criados pelos deuses a partir de uma alma.",
    abilities: "+4 Força/Destreza e +4 Vida/turno, OU +4 Mente/Poder e regeneração de Entropia/turno.",
    weaknesses: "O corpo é projeção; o verdadeiro anjo está na 'aréola' (um artefato). Se atacada, não se regenera até um ferreiro mágico.",
  },
  {
    id: "atlante",
    name: "Atlante",
    lore: "Habitantes subaquáticos; físico Anômalo e manipulação de água Assýgnata.",
    abilities: "Respira na água; +4 (Força ou Poder), (Destreza ou Mente) e regeneração/desconto em água.",
    weaknesses: "Fora d'água perde bônus e precisa se hidratar; sem água por 2 dias pode morrer.",
  },
  {
    id: "bestial",
    name: "Bestial",
    lore: "Criados/corrompidos pela Epithymía negra que ganharam raciocínio.",
    abilities: "+4 Força, +4 Destreza, +4 Constituição e regeneração de 4 de Vida/turno.",
    weaknesses: "Durante o dia ou contra magia sagrada, ficam fragilizados (dano dobrado).",
  },
  {
    id: "caladis",
    name: "Caladis",
    lore: "Filhos do caos, nascidos da entropia. Raça rara e variável, presságio de má sorte.",
    abilities: "No início da campanha, rola dados por atributo (lados = 2× o atributo) definindo seu valor pela campanha. Máximo = +50% no atributo. +4 em Sorte.",
    weaknesses: "A cada início de cena rola 1d100 para medir os efeitos da sua sorte sobre os outros.",
  },
  {
    id: "constructo",
    name: "Constructo",
    lore: "Forma criada de material condensado, autônoma pela Entropia.",
    abilities: "Consome o material que o compõe para recuperar um Status escolhido (10 por nível de raridade, até 100).",
    weaknesses: "O Status escolhido não regenera naturalmente — só consumindo materiais (1×/cena).",
  },
  {
    id: "demonio",
    name: "Demônio",
    lore: "Vindos de outra dimensão, ligados à Epithymía negra. Só se torna demônio via pacto.",
    abilities: "+4 Aspecto, +4 (Força ou Poder), +4 Constituição e +4 (Mente ou Destreza).",
    weaknesses: "Durante o dia ou contra magia sagrada, ficam fragilizados (dano dobrado).",
  },
  {
    id: "deuses",
    name: "Deuses",
    lore: "Ligados à Epithymía; alimentam-se de desejos, fé e oferendas. Longevidade de ~1000 anos.",
    abilities: "+4 Aspecto, +4 (Força ou Poder) e +4 (Destreza ou Mente).",
    weaknesses: "Todo deus tem um ponto fraco (kriptonita/calcanhar de aquiles), definido com o Mestre.",
  },
  {
    id: "draconato",
    name: "Draconato",
    lore: "Meio reptilianos; podem virar dragão. 3 formas: humana, híbrida e dragão. Recebem Bênçãos do Dragão.",
    abilities: "Bênçãos (Olhos, Punhos +12 dano, Coração +8 defesa/asas, Estômago, Pernas +4 Destreza). No nível 10, ascensão total.",
    weaknesses: "Poder transbordante: gastam +2 de Entropia em suas façanhas.",
  },
  {
    id: "elementais",
    name: "Elementais",
    lore: "Corpo feito inteiramente de um elemento (escolher).",
    abilities: "Líquidos/gasosos: só sofrem golpes místicos/psíquicos/energia/elementais. Sólidos: +16 de resistência física.",
    weaknesses: "Não entram em estado de morrendo — se zerarem a Vida, morrem.",
  },
  {
    id: "elfos",
    name: "Elfos",
    lore: "De outro mundo, ligados à natureza e à magia.",
    abilities: "Nascem manipulando um tipo de magia; artefato mágico ligado à sua Entropia (evolui, +1 dado no manuseio).",
    weaknesses: "Limitados a um único tipo de magia. Se o artefato for destruído, a Sanidade cai a 0.",
  },
  {
    id: "espectro",
    name: "Espectro",
    lore: "Seres sem corpo físico (geralmente mortos que voltaram).",
    abilities: "+4 Aspecto/Mente/Poder. Intangível: não é atingido por ataques físicos.",
    weaknesses: "Não toca seres físicos diretamente, apenas por meios místicos.",
  },
  {
    id: "halflings",
    name: "Halflings",
    lore: "Pequeninos aventureiros, mistura de anões e elfos; amam doces.",
    abilities: "+4 Destreza e Aspecto, +1 dado para Furtividade e Carisma.",
    weaknesses: "Vício em doces: desvantagem para resistir ao doce favorito (manipulável).",
  },
  {
    id: "humano",
    name: "Humano",
    lore: "Raça caótica e abundante; imprevisível. Pode ser Anômalo, Assýgnata ou Etéreo.",
    abilities: "Caixinha de surpresas: recebe uma skill adicional e rola 1d6 para o nível dela.",
    weaknesses: "Nenhuma fixa — variabilidade é a marca.",
  },
  {
    id: "illumari",
    name: "Illumari",
    lore: "Tecnorgânicos de Nyx'Thera, simbiontes de um amuleto.",
    abilities: "+4 Força e Destreza; controla luz pela pele; cria armas temporárias (nível por grimório).",
    weaknesses: "Acerto no amuleto dobra o dano; remoção enfraquece; destruição mata.",
  },
  {
    id: "iporus",
    name: "Íporus",
    lore: "Seres em preto e branco, falam idiomas ao contrário. Etéreos por natureza.",
    abilities: "Pagando 4 de Entropia, adquire vantagens/desvantagens de outra raça por cena. Pode negativar 1 atributo (-10) para investir em outro.",
    weaknesses: "Falam ao contrário: -8 em Carisma com quem não os entende; origem desconhecida.",
  },
  {
    id: "metamorfos",
    name: "Metamorfos",
    lore: "Anômalos que mudam o corpo para se assemelhar a outros (sem pegar atributos físicos).",
    abilities: "4 de Entropia: muda aparência para alguém já visto (+24 Carisma para se passar por ele).",
    weaknesses: "Contato com bronze revela a face verdadeira e anula a transformação.",
  },
  {
    id: "midragyanos",
    name: "Midragyanos",
    lore: "Raça quase extinta com ligação ao fogo divino; chama eterna nas costas.",
    abilities: "Corpo de fogo, +4 Constituição e Força, imunidade a fogo/calor, voo.",
    weaknesses: "Ciclo da Chama: a cada 2 turnos fica vulnerável, recebendo dano dobrado.",
  },
  {
    id: "orc",
    name: "Orc",
    lore: "Guerreiros natos, fortíssimos, expectativa de vida baixa.",
    abilities: "+4 Força e Constituição, +2 de Força por turno em combate; resistência extrema.",
    weaknesses: "Impulsivos: teste de Aspecto para resistir a lutar e para sair de um combate.",
  },
  {
    id: "oryx",
    name: "Oryx",
    lore: "Biotecnológicos tecnopatas; viciados em evoluir sua tecnologia.",
    abilities: "Teste de Mente para analisar/controlar/modificar tecnologia (custo por grimório).",
    weaknesses: "Água e sobrecargas elétricas causam 1 dado de desvantagem enquanto afetado.",
  },
  {
    id: "sumaxianos",
    name: "Sumaxianos",
    lore: "Alienígenas de Saturno; a pele varia de cor, cada cor uma vantagem.",
    abilities: "Vermelho: +16 dano de queimadura. Roxo: passiva Desýgnata do Sóma. Verde: passiva Etéreo. Azul: +16 redução de dano.",
    weaknesses: "Vermelho: dano dobrado de água. Azul: desvantagem em atletismo. (varia por cor)",
  },
  {
    id: "tiefling",
    name: "Tiefling",
    lore: "Descendentes de deuses de família exilada e amaldiçoada; nômades raros.",
    abilities: "Compartilham habilidades de demônios ou bestiais (escolher com o Mestre).",
    weaknesses: "Fraquezas de demônios ou bestiais (escolher com o Mestre).",
  },
  {
    id: "tita",
    name: "Titã",
    lore: "Gerados diretamente pela Epithymía; cada um representa um conceito/aspecto. Muito raros.",
    abilities: "Habilidades conforme o conceito que representa (definir com o Mestre).",
    weaknesses: "Fraquezas conforme o conceito (definir com o Mestre).",
  },
];

export function findRace(id: string): RaceDef | undefined {
  return RACES.find((r) => r.id === id);
}
