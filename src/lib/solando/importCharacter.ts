/**
 * importCharacter.ts — Converte o JSON extraído pela IA (rota /api/import-character)
 * em uma ficha do Solando (`Character`), mapeando nomes de raça/classe/competência
 * para os ids reais do sistema. Nada é inventado: o que não casar vira texto nas
 * anotações e o jogador ajusta na hora de revisar.
 */

import { Character, newCharacter, Skill, Talent, Condition, InventoryItem } from "./character";
import { AttributeKey } from "./rules";
import { ItemWeight } from "./rules";
import { allRaces, allClasses } from "./customContent";
import { COMPETENCES } from "./competences";
import { uid } from "@/lib/storage";

export interface ImportedCharacter {
  name?: string;
  raceName?: string;
  className?: string;
  level?: number;
  sex?: string;
  age?: string;
  origin?: string;
  moral?: number;
  attributes?: Partial<Record<AttributeKey, number>>;
  talents?: Array<{ name?: string; description?: string }>;
  skills?: Array<{ name?: string; cost?: number; description?: string }>;
  competences?: Array<{ name?: string; level?: number }>;
  conditions?: Array<{ name?: string; points?: number }>;
  inventory?: Array<{ name?: string; weight?: string; qty?: number }>;
  notes?: string;
}

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function clampNum(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function matchRaceId(name?: string): string {
  if (!name) return "";
  const n = norm(name);
  const hit = allRaces().find((r) => norm(r.name) === n || norm(r.id) === n);
  return hit?.id ?? "";
}
function matchClassId(name?: string): string {
  if (!name) return "";
  const n = norm(name);
  const hit = allClasses().find((c) => norm(c.name) === n || norm(c.id) === n);
  return hit?.id ?? "";
}
function matchCompetenceId(name?: string): string | null {
  if (!name) return null;
  const n = norm(name);
  const hit =
    COMPETENCES.find((c) => norm(c.name) === n) ??
    COMPETENCES.find((c) => norm(c.name).includes(n) || n.includes(norm(c.name)));
  return hit?.id ?? null;
}
function matchWeight(w?: string): ItemWeight {
  const n = norm(w ?? "");
  if (n.startsWith("pes")) return "pesado";
  if (n.startsWith("med")) return "medio";
  return "leve";
}

/** Monta a ficha a partir do JSON da IA + o texto original (guardado nas notas). */
export function mapImportedToCharacter(data: ImportedCharacter, rawText: string): Character {
  const attributes = {
    forca: clampNum(data.attributes?.forca, 0, 100),
    destreza: clampNum(data.attributes?.destreza, 0, 100),
    constituicao: clampNum(data.attributes?.constituicao, 0, 100),
    aspecto: clampNum(data.attributes?.aspecto, 0, 100),
    mente: clampNum(data.attributes?.mente, 0, 100),
    poder: clampNum(data.attributes?.poder, 0, 100),
    sorte: clampNum(data.attributes?.sorte, 0, 100),
  };

  const talents: Talent[] = (data.talents ?? [])
    .filter((t) => t?.name?.trim())
    .map((t) => ({
      id: uid("tal"),
      name: t.name!.trim(),
      cost: 0,
      description: (t.description ?? "").trim(),
    }));

  const skills: Skill[] = (data.skills ?? [])
    .filter((s) => s?.name?.trim())
    .map((s) => ({
      id: uid("skill"),
      name: s.name!.trim(),
      cost: clampNum(s.cost, 0, 999),
      description: (s.description ?? "").trim(),
    }));

  const competences = (data.competences ?? [])
    .map((c) => ({ id: matchCompetenceId(c.name), level: clampNum(c.level, 1, 10) }))
    .filter((c): c is { id: string; level: number } => Boolean(c.id));

  const conditions: Condition[] = (data.conditions ?? [])
    .filter((c) => c?.name?.trim())
    .map((c) => ({
      id: uid("cond"),
      name: c.name!.trim(),
      points: clampNum(c.points, 1, 5),
    }));

  const inventory: InventoryItem[] = (data.inventory ?? [])
    .filter((i) => i?.name?.trim())
    .map((i) => ({
      id: uid("item"),
      name: i.name!.trim(),
      weight: matchWeight(i.weight),
      qty: clampNum(i.qty ?? 1, 1, 999),
    }));

  // Guarda nas notas o que não casou (raça/classe não reconhecidas) + o texto bruto.
  const unmatched: string[] = [];
  if (data.raceName && !matchRaceId(data.raceName)) unmatched.push(`Raça original: ${data.raceName}`);
  if (data.className && !matchClassId(data.className)) unmatched.push(`Classe original: ${data.className}`);

  const notes = [
    (data.notes ?? "").trim(),
    unmatched.join(" · "),
    "— Importado —",
    rawText.slice(0, 4000),
  ]
    .filter(Boolean)
    .join("\n\n");

  return newCharacter({
    name: (data.name ?? "").trim() || "Personagem importado",
    level: clampNum(data.level, 0, 20),
    sex: (data.sex ?? "").trim(),
    age: (data.age ?? "").trim(),
    origin: (data.origin ?? "").trim(),
    moral: clampNum(data.moral, -100, 100),
    race: matchRaceId(data.raceName),
    charClass: matchClassId(data.className),
    attributes,
    talents,
    skills,
    competences,
    conditions,
    inventory,
    notes,
  });
}
