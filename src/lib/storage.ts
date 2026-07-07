/**
 * storage.ts — Repositório de fichas, campanhas e mesas.
 *
 * A API é assíncrona (Promises). Quando o Supabase está configurado E há um
 * usuário autenticado, as fichas são lidas/gravadas no banco (compartilhadas
 * entre dispositivos e visíveis conforme as políticas RLS). Caso contrário, o
 * app cai automaticamente no modo local (localStorage), sem quebrar.
 */

import { Character, normalizeCharacter } from "./solando/character";
import { supabase, isSupabaseEnabled } from "./supabase/client";

const KEY_CHARACTERS = "solando:characters";
const KEY_CAMPAIGNS = "solando:campaigns";
const KEY_PROFILE = "solando:profile";

/** ID do usuário autenticado, ou null (modo local / não logado). */
async function currentUserId(): Promise<string | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Converte uma linha da tabela `characters` em um Character normalizado. */
function rowToCharacter(row: {
  id: string;
  name: string | null;
  avatar_url: string | null;
  data: unknown;
}): Character {
  const base = (row.data && typeof row.data === "object" ? row.data : {}) as Partial<Character>;
  return normalizeCharacter({
    ...base,
    id: row.id,
    name: row.name ?? base.name ?? "",
    avatarUrl: row.avatar_url ?? base.avatarUrl,
  });
}

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
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, avatar_url, data, updated_at")
        .eq("owner_id", uidUser)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToCharacter);
    }
    return read<Character[]>(KEY_CHARACTERS, [])
      .map(normalizeCharacter)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async get(id: string): Promise<Character | undefined> {
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, avatar_url, data")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToCharacter(data) : undefined;
    }
    const found = read<Character[]>(KEY_CHARACTERS, []).find((c) => c.id === id);
    return found ? normalizeCharacter(found) : undefined;
  },
  async save(character: Character): Promise<Character> {
    const uidUser = await currentUserId();
    const updated = { ...character, updatedAt: Date.now() };
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("characters")
        .upsert(
          {
            id: updated.id,
            owner_id: uidUser,
            name: updated.name,
            avatar_url: updated.avatarUrl ?? null,
            data: updated,
            updated_at: new Date(updated.updatedAt).toISOString(),
          },
          { onConflict: "id" },
        )
        .select("id, name, avatar_url, data")
        .single();
      if (error) throw error;
      return rowToCharacter(data);
    }
    const all = read<Character[]>(KEY_CHARACTERS, []);
    const idx = all.findIndex((c) => c.id === character.id);
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    write(KEY_CHARACTERS, all);
    return updated;
  },
  async remove(id: string): Promise<void> {
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { error } = await supabase.from("characters").delete().eq("id", id);
      if (error) throw error;
      return;
    }
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
