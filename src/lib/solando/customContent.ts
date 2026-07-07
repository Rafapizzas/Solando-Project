/**
 * customContent.ts — Conteúdo criado pelo usuário (raças e classes) e resolução
 * de bônus de atributo de raça/classe (built-in + personalizados).
 *
 * O sistema Solando permite criar raças e classes livremente (com aval do
 * Mestre). Aqui armazenamos essas criações no localStorage e resolvemos os
 * bônus de atributo que raça/classe concedem, conforme o manual.
 */

import { AttributeKey } from "./rules";
import { RACES, RaceDef } from "./races";
import { CLASSES, ClassDef } from "./classes";

export type AttrBonus = Partial<Record<AttributeKey, number>>;

export interface CustomRace extends RaceDef {
  custom: true;
  attrBonus?: AttrBonus;
}
export interface CustomClass extends ClassDef {
  custom: true;
  attrBonus?: AttrBonus;
}

/**
 * Bônus de atributo FIXO das raças oficiais (conforme o manual). Bônus baseados
 * em escolha ("+4 de Força OU Poder") usam um padrão sensato; ajuste com o Mestre.
 */
export const RACE_ATTR_BONUS: Record<string, AttrBonus> = {
  anao: { forca: 4, aspecto: 4 },
  orc: { forca: 4, constituicao: 4 },
  demonio: { aspecto: 4, forca: 4, constituicao: 4, mente: 4 },
  deuses: { aspecto: 4, forca: 4, destreza: 4 },
  bestial: { forca: 4, destreza: 4, constituicao: 4 },
  anjos: { forca: 4, destreza: 4 },
  atlante: { forca: 4, destreza: 4 },
  halflings: { destreza: 4, aspecto: 4 },
  espectro: { aspecto: 4, mente: 4, poder: 4 },
  midragyanos: { constituicao: 4, forca: 4 },
  illumari: { forca: 4, destreza: 4 },
  caladis: { sorte: 4 },
};

/** Bônus de atributo FIXO de classes oficiais (a maioria dá pontos, não fixo). */
export const CLASS_ATTR_BONUS: Record<string, AttrBonus> = {
  pactuado: { aspecto: 4 },
};

// --- Armazenamento local ----------------------------------------------------

const KEY_RACES = "solando:customRaces";
const KEY_CLASSES = "solando:customClasses";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}
function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCustomRaces(): CustomRace[] {
  return read<CustomRace[]>(KEY_RACES, []);
}
export function getCustomClasses(): CustomClass[] {
  return read<CustomClass[]>(KEY_CLASSES, []);
}
export function saveCustomRace(race: CustomRace): void {
  const all = getCustomRaces();
  const idx = all.findIndex((r) => r.id === race.id);
  if (idx >= 0) all[idx] = race;
  else all.push(race);
  write(KEY_RACES, all);
}
export function saveCustomClass(klass: CustomClass): void {
  const all = getCustomClasses();
  const idx = all.findIndex((c) => c.id === klass.id);
  if (idx >= 0) all[idx] = klass;
  else all.push(klass);
  write(KEY_CLASSES, all);
}
export function removeCustomRace(id: string): void {
  write(KEY_RACES, getCustomRaces().filter((r) => r.id !== id));
}
export function removeCustomClass(id: string): void {
  write(KEY_CLASSES, getCustomClasses().filter((c) => c.id !== id));
}

// --- Resolução (built-in + custom) -----------------------------------------

export function allRaces(): Array<RaceDef & { custom?: boolean; attrBonus?: AttrBonus }> {
  return [...RACES, ...getCustomRaces()];
}
export function allClasses(): Array<ClassDef & { custom?: boolean; attrBonus?: AttrBonus }> {
  return [...CLASSES, ...getCustomClasses()];
}

export function resolveRace(id: string) {
  return allRaces().find((r) => r.id === id);
}
export function resolveClass(id: string) {
  return allClasses().find((c) => c.id === id);
}

/** Bônus de atributo da raça escolhida (custom tem prioridade sobre o mapa). */
export function raceAttrBonus(raceId: string): AttrBonus {
  const custom = getCustomRaces().find((r) => r.id === raceId);
  if (custom?.attrBonus) return custom.attrBonus;
  return RACE_ATTR_BONUS[raceId] ?? {};
}
export function classAttrBonus(classId: string): AttrBonus {
  const custom = getCustomClasses().find((c) => c.id === classId);
  if (custom?.attrBonus) return custom.attrBonus;
  return CLASS_ATTR_BONUS[classId] ?? {};
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `custom-${Date.now()}`
  );
}
