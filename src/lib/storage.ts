/**
 * storage.ts — Repositório local (localStorage) para fichas, campanhas e mesas.
 *
 * A API é intencionalmente assíncrona (Promises) para que, na fase 2, a
 * implementação possa ser trocada por Supabase sem alterar os componentes.
 */

import { Character, normalizeCharacter } from "./solando/character";

const KEY_CHARACTERS = "solando:characters";
const KEY_CAMPAIGNS = "solando:campaigns";
const KEY_PROFILE = "solando:profile";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  masterName: string;
  /** IDs de fichas vinculadas a esta campanha/mesa. */
  characterIds: string[];
  accent: string;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  displayName: string;
  role: "jogador" | "mestre";
}

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

function uid(prefix: string): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

// --- Perfil -----------------------------------------------------------------

export const profileRepo = {
  async get(): Promise<Profile> {
    return read<Profile>(KEY_PROFILE, { displayName: "", role: "jogador" });
  },
  async set(profile: Profile): Promise<void> {
    write(KEY_PROFILE, profile);
  },
};

// --- Fichas -----------------------------------------------------------------

export const characterRepo = {
  async list(): Promise<Character[]> {
    return read<Character[]>(KEY_CHARACTERS, [])
      .map(normalizeCharacter)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async get(id: string): Promise<Character | undefined> {
    const found = read<Character[]>(KEY_CHARACTERS, []).find((c) => c.id === id);
    return found ? normalizeCharacter(found) : undefined;
  },
  async save(character: Character): Promise<Character> {
    const all = read<Character[]>(KEY_CHARACTERS, []);
    const idx = all.findIndex((c) => c.id === character.id);
    const updated = { ...character, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    write(KEY_CHARACTERS, all);
    return updated;
  },
  async remove(id: string): Promise<void> {
    write(
      KEY_CHARACTERS,
      read<Character[]>(KEY_CHARACTERS, []).filter((c) => c.id !== id),
    );
  },
};

// --- Campanhas / Mesas ------------------------------------------------------

export const campaignRepo = {
  async list(): Promise<Campaign[]> {
    return read<Campaign[]>(KEY_CAMPAIGNS, []).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  },
  async get(id: string): Promise<Campaign | undefined> {
    return read<Campaign[]>(KEY_CAMPAIGNS, []).find((c) => c.id === id);
  },
  async create(partial: Partial<Campaign>): Promise<Campaign> {
    const now = Date.now();
    const campaign: Campaign = {
      id: uid("camp"),
      name: partial.name ?? "Nova Campanha",
      description: partial.description ?? "",
      masterName: partial.masterName ?? "",
      characterIds: partial.characterIds ?? [],
      accent: partial.accent ?? "#facc15",
      createdAt: now,
      updatedAt: now,
    };
    const all = read<Campaign[]>(KEY_CAMPAIGNS, []);
    all.push(campaign);
    write(KEY_CAMPAIGNS, all);
    return campaign;
  },
  async save(campaign: Campaign): Promise<Campaign> {
    const all = read<Campaign[]>(KEY_CAMPAIGNS, []);
    const idx = all.findIndex((c) => c.id === campaign.id);
    const updated = { ...campaign, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    write(KEY_CAMPAIGNS, all);
    return updated;
  },
  async remove(id: string): Promise<void> {
    write(
      KEY_CAMPAIGNS,
      read<Campaign[]>(KEY_CAMPAIGNS, []).filter((c) => c.id !== id),
    );
  },
};

export { uid };
