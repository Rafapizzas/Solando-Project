/**
 * competences.ts — Competências (proficiências) do Sistema Solando 4.0.
 *
 * 3 pontos iniciais. Cada nível de proficiência soma +10 no dado da área.
 * Teto por nível do personagem: nv0 +20, nv5 +40, nv10 +60, nv15 +80, nv20 +100.
 */

export interface CompetenceDef {
  id: string;
  name: string;
  description: string;
  group: "combate" | "místico" | "conhecimento" | "físico" | "social" | "técnico";
}

export const INITIAL_COMPETENCE_POINTS = 3;
export const BONUS_PER_COMPETENCE_LEVEL = 10;

/** Teto de bônus por competência conforme o nível do personagem. */
export function competenceCap(characterLevel: number): number {
  if (characterLevel >= 20) return 100;
  if (characterLevel >= 15) return 80;
  if (characterLevel >= 10) return 60;
  if (characterLevel >= 5) return 40;
  return 20;
}

export const COMPETENCES: CompetenceDef[] = [
  { id: "combate-corpo", name: "Combate Corpo a Corpo", group: "combate", description: "Artes marciais; acertar e desviar no mano a mano." },
  { id: "combate-mistico", name: "Combate Místico", group: "combate", description: "Atacar e esquivar usando poder místico." },
  { id: "armas-brancas", name: "Manuseio de Armas Brancas", group: "combate", description: "Espadas e lâminas em geral." },
  { id: "armas-fogo", name: "Manuseio de Armas de Fogo", group: "combate", description: "Pistolas, fuzis e afins." },
  { id: "arcos", name: "Manuseio de Arcos", group: "combate", description: "Arcos, bestas e arremessos." },
  { id: "equip-misticos", name: "Manusear Equipamentos Místicos", group: "místico", description: "Artefatos místicos poderosos." },
  { id: "magia", name: "Magia", group: "místico", description: "Uso de magia (Mente)." },
  { id: "feiticaria", name: "Feitiçaria", group: "místico", description: "Conhecimentos profundos da magia." },
  { id: "antimagia", name: "Antimagia", group: "místico", description: "Anular habilidades mágicas/Thaumofagia." },
  { id: "epithymia", name: "Epithymía", group: "místico", description: "Poder da alma / desejo." },
  { id: "soma", name: "Sóma", group: "físico", description: "Manipulação da Entropia pelo corpo." },
  { id: "eusomia", name: "Eusōmía", group: "místico", description: "Sintropia que se opõe ao Sóma (paralisar, esgotar)." },
  { id: "kanone", name: "Kanóne", group: "místico", description: "Manipular a alma para incapacitar (ordem/equilíbrio)." },
  { id: "anaki", name: "Anáki", group: "místico", description: "Devorar almas/desejos (Atropia de Alma)." },
  { id: "atrofagia", name: "Atrofagia", group: "místico", description: "Absorver matéria física e convertê-la em energia." },
  { id: "thaumofagia", name: "Thaumofagia", group: "místico", description: "Usar a magia do ambiente sem gastar a própria." },
  { id: "pactos", name: "Pactos", group: "social", description: "Negociar com entidades e acessar contatos." },
  { id: "domesticar", name: "Domesticar", group: "físico", description: "Lidar com animais de qualquer porte/mundo." },
  { id: "atletismo", name: "Atletismo", group: "físico", description: "Corrida, acrobacia e proezas físicas." },
  { id: "fortitude-fisica", name: "Fortitude Física", group: "físico", description: "Aguentar no corpo." },
  { id: "fortitude-mental", name: "Fortitude Mental", group: "físico", description: "Aguentar na mente." },
  { id: "fortitude-mistica", name: "Fortitude Mística", group: "físico", description: "Aguentar na alma." },
  { id: "furtividade", name: "Furtividade", group: "físico", description: "Passar despercebido." },
  { id: "percepcao", name: "Percepção", group: "conhecimento", description: "Notar detalhes e perigos." },
  { id: "carisma", name: "Carisma", group: "social", description: "Bom papo, persuasão." },
  { id: "medicina", name: "Medicina", group: "conhecimento", description: "Primeiros socorros a cirurgias." },
  { id: "ciencias", name: "Ciências", group: "conhecimento", description: "Conhecimento científico (escolher a área)." },
  { id: "alquimia", name: "Alquimia", group: "conhecimento", description: "Química, transmutação e a troca equivalente." },
  { id: "programacao", name: "Programação", group: "técnico", description: "Hacking e sistemas." },
  { id: "mecanica", name: "Mecânica", group: "técnico", description: "Consertar e construir máquinas." },
  { id: "manufatura", name: "Manufatura", group: "técnico", description: "Trabalhos braçais e fabricação." },
  { id: "atualidades", name: "Atualidades", group: "conhecimento", description: "Estar por dentro das notícias e fofocas." },
];

export function findCompetence(id: string): CompetenceDef | undefined {
  return COMPETENCES.find((c) => c.id === id);
}
