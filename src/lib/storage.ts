/**
 * storage.ts — Repositório de fichas, campanhas e mesas.
 *
 * A API é assíncrona (Promises). Quando o Supabase está configurado E há um
 * usuário autenticado, as fichas são lidas/gravadas no banco (compartilhadas
 * entre dispositivos e visíveis conforme as políticas RLS). Caso contrário, o
 * app cai automaticamente no modo local (localStorage), sem quebrar.
 */

import { Character, normalizeCharacter } from "./solando/character";
import { RollResult } from "./solando/dice";
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
  /** ID do dono/mestre da mesa (quando no Supabase). */
  ownerId?: string;
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

interface CampaignRow {
  id: string;
  name: string;
  description: string | null;
  accent: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

function rowToCampaign(row: CampaignRow, characterIds: string[] = []): Campaign {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    masterName: "",
    ownerId: row.owner_id,
    characterIds,
    accent: row.accent ?? "#facc15",
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export const campaignRepo = {
  async list(): Promise<Campaign[]> {
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, description, accent, owner_id, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as CampaignRow[];
      if (rows.length === 0) return [];
      const { data: mems } = await supabase
        .from("table_members")
        .select("table_id, character_id")
        .in(
          "table_id",
          rows.map((r) => r.id),
        );
      const byTable = new Map<string, string[]>();
      for (const m of (mems ?? []) as { table_id: string; character_id: string | null }[]) {
        if (!m.character_id) continue;
        const arr = byTable.get(m.table_id) ?? [];
        arr.push(m.character_id);
        byTable.set(m.table_id, arr);
      }
      return rows.map((r) => rowToCampaign(r, byTable.get(r.id) ?? []));
    }
    return read<Campaign[]>(KEY_CAMPAIGNS, []).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  },
  async get(id: string): Promise<Campaign | undefined> {
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, description, accent, owner_id, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const { data: mems } = await supabase
        .from("table_members")
        .select("character_id")
        .eq("table_id", id);
      const ids = ((mems ?? []) as { character_id: string | null }[])
        .map((m) => m.character_id)
        .filter((x): x is string => !!x);
      return rowToCampaign(data as CampaignRow, ids);
    }
    return read<Campaign[]>(KEY_CAMPAIGNS, []).find((c) => c.id === id);
  },
  async create(partial: Partial<Campaign>): Promise<Campaign> {
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          owner_id: uidUser,
          name: partial.name ?? "Nova Mesa",
          description: partial.description ?? "",
          accent: partial.accent ?? "#facc15",
        })
        .select("id, name, description, accent, owner_id, created_at, updated_at")
        .single();
      if (error) throw error;
      const row = data as CampaignRow;
      // O criador entra como dono/mestre da mesa.
      await supabase
        .from("table_members")
        .upsert(
          { table_id: row.id, user_id: uidUser, role: "owner", can_manage: true },
          { onConflict: "table_id,user_id" },
        );
      return rowToCampaign(row, []);
    }
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
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { data, error } = await supabase
        .from("campaigns")
        .update({
          name: campaign.name,
          description: campaign.description,
          accent: campaign.accent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .select("id, name, description, accent, owner_id, created_at, updated_at")
        .single();
      if (error) throw error;
      return rowToCampaign(data as CampaignRow, campaign.characterIds);
    }
    const all = read<Campaign[]>(KEY_CAMPAIGNS, []);
    const idx = all.findIndex((c) => c.id === campaign.id);
    const updated = { ...campaign, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    write(KEY_CAMPAIGNS, all);
    return updated;
  },
  async remove(id: string): Promise<void> {
    const uidUser = await currentUserId();
    if (uidUser && supabase) {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      return;
    }
    write(
      KEY_CAMPAIGNS,
      read<Campaign[]>(KEY_CAMPAIGNS, []).filter((c) => c.id !== id),
    );
  },
};

// --- Mesa online: membros, rolagens em tempo real, reações ------------------

export interface TableMember {
  userId: string;
  characterId: string | null;
  characterName: string;
  displayName: string;
  role: "owner" | "player";
  canManage: boolean;
}

export interface RollLog {
  id: string;
  tableId: string;
  authorId: string;
  characterId: string | null;
  characterName: string;
  text: string;
  result: RollResult | null;
  secret: boolean;
  reactions: Record<string, string[]>;
  createdAt: number;
}

interface RollRow {
  id: string;
  table_id: string;
  author_id: string;
  character_id: string | null;
  character_name: string;
  text: string;
  result: string | null;
  secret: boolean;
  reactions: Record<string, string[]> | null;
  created_at: string;
}

function rowToRoll(row: RollRow): RollLog {
  let result: RollResult | null = null;
  if (row.result) {
    try {
      result = JSON.parse(row.result) as RollResult;
    } catch {
      result = null;
    }
  }
  return {
    id: row.id,
    tableId: row.table_id,
    authorId: row.author_id,
    characterId: row.character_id,
    characterName: row.character_name,
    text: row.text,
    result,
    secret: row.secret,
    reactions: row.reactions ?? {},
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const tableRepo = {
  /** Retorna true se o Supabase está ativo e há usuário logado (mesa online). */
  async online(): Promise<boolean> {
    return (await currentUserId()) !== null;
  },

  async members(tableId: string): Promise<TableMember[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("table_members")
      .select("user_id, character_id, role, can_manage")
      .eq("table_id", tableId);
    if (error) throw error;
    const rows = (data ?? []) as {
      user_id: string;
      character_id: string | null;
      role: "owner" | "player";
      can_manage: boolean;
    }[];
    if (rows.length === 0) return [];
    const userIds = rows.map((r) => r.user_id);
    const charIds = rows.map((r) => r.character_id).filter((x): x is string => !!x);
    const [{ data: profs }, { data: chars }] = await Promise.all([
      supabase.from("profiles").select("id, display_name").in("id", userIds),
      charIds.length
        ? supabase.from("characters").select("id, name").in("id", charIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const nameByUser = new Map(
      ((profs ?? []) as { id: string; display_name: string }[]).map((p) => [
        p.id,
        p.display_name,
      ]),
    );
    const charName = new Map(
      ((chars ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
    );
    return rows.map((r) => ({
      userId: r.user_id,
      characterId: r.character_id,
      characterName: r.character_id ? charName.get(r.character_id) ?? "" : "",
      displayName: nameByUser.get(r.user_id) ?? "Aventureiro",
      role: r.role,
      canManage: r.can_manage,
    }));
  },

  /** Fichas vinculadas à mesa (visíveis conforme RLS). */
  async charactersInTable(tableId: string): Promise<Character[]> {
    if (!supabase) return [];
    const { data: mems, error } = await supabase
      .from("table_members")
      .select("character_id")
      .eq("table_id", tableId);
    if (error) throw error;
    const ids = ((mems ?? []) as { character_id: string | null }[])
      .map((m) => m.character_id)
      .filter((x): x is string => !!x);
    if (ids.length === 0) return [];
    const { data, error: cErr } = await supabase
      .from("characters")
      .select("id, name, avatar_url, data")
      .in("id", ids);
    if (cErr) throw cErr;
    return (data ?? []).map(rowToCharacter);
  },

  /** Entra na mesa (ou troca o personagem escolhido). */
  async join(tableId: string, characterId: string | null): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const campaign = await campaignRepo.get(tableId);
    const role = campaign?.ownerId === uidUser ? "owner" : "player";
    const { error } = await supabase.from("table_members").upsert(
      {
        table_id: tableId,
        user_id: uidUser,
        character_id: characterId,
        role,
        can_manage: role === "owner",
      },
      { onConflict: "table_id,user_id" },
    );
    if (error) throw error;
  },

  async leave(tableId: string): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    await supabase
      .from("table_members")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", uidUser);
  },

  async rolls(tableId: string): Promise<RollLog[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("roll_logs")
      .select(
        "id, table_id, author_id, character_id, character_name, text, result, secret, reactions, created_at",
      )
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return ((data ?? []) as RollRow[]).map(rowToRoll);
  },

  async addRoll(input: {
    tableId: string;
    characterId: string | null;
    characterName: string;
    text: string;
    result: RollResult | null;
    secret?: boolean;
  }): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const { error } = await supabase.from("roll_logs").insert({
      table_id: input.tableId,
      author_id: uidUser,
      character_id: input.characterId,
      character_name: input.characterName,
      text: input.text,
      result: input.result ? JSON.stringify(input.result) : null,
      secret: input.secret ?? false,
    });
    if (error) throw error;
  },

  /** Alterna a reação (emoji) do usuário atual em uma rolagem. */
  async toggleReaction(rollId: string, emoji: string): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const { data, error } = await supabase
      .from("roll_logs")
      .select("reactions")
      .eq("id", rollId)
      .single();
    if (error) throw error;
    const reactions = { ...((data?.reactions as Record<string, string[]>) ?? {}) };
    const list = new Set(reactions[emoji] ?? []);
    if (list.has(uidUser)) list.delete(uidUser);
    else list.add(uidUser);
    if (list.size === 0) delete reactions[emoji];
    else reactions[emoji] = [...list];
    const { error: uErr } = await supabase
      .from("roll_logs")
      .update({ reactions })
      .eq("id", rollId);
    if (uErr) throw uErr;
  },

  /** Assina mudanças (rolagens/membros) da mesa em tempo real. */
  subscribe(tableId: string, onChange: () => void): () => void {
    const client = supabase;
    if (!client) return () => {};
    const channel = client
      .channel(`mesa:${tableId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "roll_logs", filter: `table_id=eq.${tableId}` },
        onChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_members", filter: `table_id=eq.${tableId}` },
        onChange,
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  },
};

// --- Upload de imagem do personagem (bucket "avatars") ----------------------

/**
 * Envia a foto do personagem para o bucket público `avatars`, na pasta do
 * usuário (uid/<characterId>.<ext>) — exigido pelas políticas de Storage.
 * Retorna a URL pública (com cache-busting) para salvar em `avatarUrl`.
 */
export async function uploadCharacterAvatar(
  characterId: string,
  file: File,
): Promise<string> {
  const uidUser = await currentUserId();
  if (!uidUser || !supabase) {
    throw new Error("Entre na sua conta para enviar imagens.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Imagem muito grande (máx. 5 MB).");
  }
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${uidUser}/${characterId}.${ext || "png"}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export { uid };
