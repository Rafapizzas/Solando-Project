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
  /** Lê o flag "pública" da ficha (todos autenticados podem ver). */
  async isPublic(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { data } = await supabase
      .from("characters")
      .select("is_public")
      .eq("id", id)
      .maybeSingle();
    return data?.is_public === true;
  },
  /** Marca/desmarca a ficha como pública. */
  async setPublic(id: string, value: boolean): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("characters")
      .update({ is_public: value })
      .eq("id", id);
    if (error) throw error;
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
  avatarUrl?: string;
  role: "owner" | "player";
  canManage: boolean;
  status: "pending" | "accepted";
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
      .select("user_id, character_id, role, can_manage, status")
      .eq("table_id", tableId);
    if (error) throw error;
    const rows = (data ?? []) as {
      user_id: string;
      character_id: string | null;
      role: "owner" | "player";
      can_manage: boolean;
      status: "pending" | "accepted" | null;
    }[];
    if (rows.length === 0) return [];
    const userIds = rows.map((r) => r.user_id);
    const charIds = rows.map((r) => r.character_id).filter((x): x is string => !!x);
    const [{ data: profs }, { data: chars }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      charIds.length
        ? supabase.from("characters").select("id, name").in("id", charIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const profByUser = new Map(
      ((profs ?? []) as { id: string; display_name: string; avatar_url: string | null }[]).map(
        (p) => [p.id, p],
      ),
    );
    const charName = new Map(
      ((chars ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
    );
    return rows.map((r) => ({
      userId: r.user_id,
      characterId: r.character_id,
      characterName: r.character_id ? charName.get(r.character_id) ?? "" : "",
      displayName: profByUser.get(r.user_id)?.display_name ?? "Aventureiro",
      avatarUrl: profByUser.get(r.user_id)?.avatar_url ?? undefined,
      role: r.role,
      canManage: r.can_manage,
      status: r.status ?? "accepted",
    }));
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
        status: "accepted",
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_npcs", filter: `table_id=eq.${tableId}` },
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

/**
 * Envia a foto de perfil do usuário para o bucket `avatars`
 * (uid/profile.<ext>). Retorna a URL pública (com cache-busting).
 */
export async function uploadUserAvatar(file: File): Promise<string> {
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
  const path = `${uidUser}/profile.${ext || "png"}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// --- Conta (perfil no banco) ------------------------------------------------

export interface Account {
  id: string;
  displayName: string;
  avatarUrl?: string;
  friendCode: string;
}

export const accountRepo = {
  /** Perfil da conta autenticada (nome, avatar e código de amigo). */
  async get(): Promise<Account | null> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, friend_code")
      .eq("id", uidUser)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      displayName: data.display_name ?? "Aventureiro",
      avatarUrl: data.avatar_url ?? undefined,
      friendCode: data.friend_code ?? "",
    };
  },
  /** Atualiza nome e/ou avatar do perfil. */
  async update(patch: { displayName?: string; avatarUrl?: string }): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const row: Record<string, unknown> = { id: uidUser };
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
    const { error } = await supabase
      .from("profiles")
      .upsert(row, { onConflict: "id" });
    if (error) throw error;
  },
};

// --- Presença (online/offline/em sessão/mestrando) --------------------------

export type PresenceStatus = "online" | "offline" | "in_session" | "mastering";

export interface Presence {
  status: PresenceStatus;
  currentTableId: string | null;
  lastSeen: number;
}

export const presenceRepo = {
  /** Publica o status atual do usuário (heartbeat). */
  async set(status: PresenceStatus, currentTableId: string | null = null): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const { error } = await supabase.from("user_presence").upsert(
      {
        user_id: uidUser,
        status,
        current_table_id: currentTableId,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  },
};

/** Considera "offline" quem não dá sinal há mais de 2 minutos. */
function normalizePresence(
  row: { status: PresenceStatus; current_table_id: string | null; last_seen: string } | undefined,
): Presence {
  if (!row) return { status: "offline", currentTableId: null, lastSeen: 0 };
  const lastSeen = new Date(row.last_seen).getTime();
  const stale = Date.now() - lastSeen > 2 * 60 * 1000;
  return {
    status: stale ? "offline" : row.status,
    currentTableId: row.current_table_id,
    lastSeen,
  };
}

// --- Amigos -----------------------------------------------------------------

export interface Friend {
  friendshipId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  friendCode: string;
  presence: Presence;
}

export interface FriendRequest {
  friendshipId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  friendCode: string;
  direction: "incoming" | "outgoing";
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
}

async function hydrateUsers(
  ids: string[],
): Promise<Map<string, { displayName: string; avatarUrl?: string; friendCode: string }>> {
  const map = new Map<string, { displayName: string; avatarUrl?: string; friendCode: string }>();
  if (!supabase || ids.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, friend_code")
    .in("id", ids);
  for (const p of (data ?? []) as {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    friend_code: string | null;
  }[]) {
    map.set(p.id, {
      displayName: p.display_name ?? "Aventureiro",
      avatarUrl: p.avatar_url ?? undefined,
      friendCode: p.friend_code ?? "",
    });
  }
  return map;
}

export const friendsRepo = {
  /** Amigos aceitos, com presença. */
  async list(): Promise<Friend[]> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return [];
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .eq("status", "accepted");
    if (error) throw error;
    const rows = (data ?? []) as FriendshipRow[];
    const otherIds = rows.map((r) => (r.requester_id === uidUser ? r.addressee_id : r.requester_id));
    const [users, presByUser] = await Promise.all([
      hydrateUsers(otherIds),
      (async () => {
        const map = new Map<string, Presence>();
        if (otherIds.length === 0) return map;
        const { data: pres } = await supabase!
          .from("user_presence")
          .select("user_id, status, current_table_id, last_seen")
          .in("user_id", otherIds);
        for (const p of (pres ?? []) as {
          user_id: string;
          status: PresenceStatus;
          current_table_id: string | null;
          last_seen: string;
        }[]) {
          map.set(p.user_id, normalizePresence(p));
        }
        return map;
      })(),
    ]);
    return rows.map((r) => {
      const other = r.requester_id === uidUser ? r.addressee_id : r.requester_id;
      const u = users.get(other);
      return {
        friendshipId: r.id,
        userId: other,
        displayName: u?.displayName ?? "Aventureiro",
        avatarUrl: u?.avatarUrl,
        friendCode: u?.friendCode ?? "",
        presence: presByUser.get(other) ?? normalizePresence(undefined),
      };
    });
  },

  /** Pedidos de amizade pendentes (recebidos e enviados). */
  async requests(): Promise<FriendRequest[]> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return [];
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .eq("status", "pending");
    if (error) throw error;
    const rows = (data ?? []) as FriendshipRow[];
    const otherIds = rows.map((r) => (r.requester_id === uidUser ? r.addressee_id : r.requester_id));
    const users = await hydrateUsers(otherIds);
    return rows.map((r) => {
      const incoming = r.addressee_id === uidUser;
      const other = incoming ? r.requester_id : r.addressee_id;
      const u = users.get(other);
      return {
        friendshipId: r.id,
        userId: other,
        displayName: u?.displayName ?? "Aventureiro",
        avatarUrl: u?.avatarUrl,
        friendCode: u?.friendCode ?? "",
        direction: incoming ? "incoming" : "outgoing",
      };
    });
  },

  /** Envia pedido de amizade pelo código do outro usuário. */
  async addByCode(code: string): Promise<string | null> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return "Entre na sua conta para adicionar amigos.";
    const clean = code.trim().toUpperCase();
    if (!clean) return "Informe um código de amigo.";
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("friend_code", clean)
      .maybeSingle();
    if (!prof) return "Código de amigo não encontrado.";
    if (prof.id === uidUser) return "Esse é o seu próprio código.";
    const { error } = await supabase.from("friendships").insert({
      requester_id: uidUser,
      addressee_id: prof.id,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") return "Vocês já têm um pedido ou amizade.";
      return error.message;
    }
    return null;
  },

  /** Aceita um pedido recebido. */
  async accept(friendshipId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (error) throw error;
  },

  /** Recusa/cancela/remove uma amizade ou pedido. */
  async remove(friendshipId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
  },
};

// --- Convites de mesa -------------------------------------------------------

export interface TableInvite {
  id: string;
  tableId: string;
  code: string;
  invitedEmail: string | null;
  expiresAt: number | null;
  maxUses: number | null;
  uses: number;
  createdAt: number;
}

interface InviteRow {
  id: string;
  table_id: string;
  code: string;
  invited_email: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  created_at: string;
}

function rowToInvite(r: InviteRow): TableInvite {
  return {
    id: r.id,
    tableId: r.table_id,
    code: r.code,
    invitedEmail: r.invited_email,
    expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : null,
    maxUses: r.max_uses,
    uses: r.uses,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export const invitesRepo = {
  /** Cria um convite (código curto) para a mesa. */
  async create(
    tableId: string,
    opts: { email?: string; expiresAt?: number | null; maxUses?: number | null } = {},
  ): Promise<TableInvite> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) throw new Error("Indisponível offline.");
    const code = uid("inv").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
    const { data, error } = await supabase
      .from("table_invites")
      .insert({
        table_id: tableId,
        code,
        invited_email: opts.email?.trim() || null,
        created_by: uidUser,
        expires_at: opts.expiresAt ? new Date(opts.expiresAt).toISOString() : null,
        max_uses: opts.maxUses ?? null,
      })
      .select("id, table_id, code, invited_email, expires_at, max_uses, uses, created_at")
      .single();
    if (error) throw error;
    return rowToInvite(data as InviteRow);
  },

  /** Lista os convites ativos de uma mesa (para o mestre). */
  async list(tableId: string): Promise<TableInvite[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("table_invites")
      .select("id, table_id, code, invited_email, expires_at, max_uses, uses, created_at")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as InviteRow[]).map(rowToInvite);
  },

  async revoke(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("table_invites").delete().eq("id", id);
    if (error) throw error;
  },

  /** Convida um amigo direto para a mesa (entra como membro pendente). */
  async inviteFriend(tableId: string, userId: string): Promise<string | null> {
    if (!supabase) return "Indisponível offline.";
    const { error } = await supabase.from("table_members").upsert(
      {
        table_id: tableId,
        user_id: userId,
        role: "player",
        can_manage: false,
        status: "pending",
      },
      { onConflict: "table_id,user_id" },
    );
    return error ? error.message : null;
  },

  /** Entra numa mesa a partir de um código de convite. Retorna o tableId. */
  async redeem(code: string): Promise<{ tableId: string } | { error: string }> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return { error: "Entre na sua conta para aceitar convites." };
    const clean = code.trim();
    if (!clean) return { error: "Informe um código de convite." };
    const { data, error } = await supabase
      .from("table_invites")
      .select("id, table_id, expires_at, max_uses, uses")
      .eq("code", clean)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Convite não encontrado." };
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return { error: "Convite expirado." };
    }
    if (data.max_uses != null && data.uses >= data.max_uses) {
      return { error: "Convite esgotado." };
    }
    const { error: joinErr } = await supabase.from("table_members").upsert(
      {
        table_id: data.table_id,
        user_id: uidUser,
        role: "player",
        can_manage: false,
        status: "accepted",
      },
      { onConflict: "table_id,user_id" },
    );
    if (joinErr) return { error: joinErr.message };
    await supabase
      .from("table_invites")
      .update({ uses: (data.uses ?? 0) + 1 })
      .eq("id", data.id);
    return { tableId: data.table_id };
  },
};

// --- Fichas por mesa (cópias independentes) ---------------------------------

export interface TableCharacter {
  id: string;
  tableId: string;
  ownerId: string;
  baseCharacterId: string | null;
  character: Character;
  createdAt: number;
  updatedAt: number;
}

interface TableCharacterRow {
  id: string;
  table_id: string;
  owner_id: string;
  base_character_id: string | null;
  name: string | null;
  avatar_url: string | null;
  data: unknown;
  created_at: string;
  updated_at: string;
}

function rowToTableCharacter(row: TableCharacterRow): TableCharacter {
  const base = (row.data && typeof row.data === "object" ? row.data : {}) as Partial<Character>;
  return {
    id: row.id,
    tableId: row.table_id,
    ownerId: row.owner_id,
    baseCharacterId: row.base_character_id,
    character: normalizeCharacter({
      ...base,
      id: row.id,
      name: row.name ?? base.name ?? "",
      avatarUrl: row.avatar_url ?? base.avatarUrl,
    }),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export const tableCharacterRepo = {
  /**
   * Fichas da mesa visíveis para o usuário: o mestre vê todas; o jogador vê
   * apenas a sua (garantido pelas políticas RLS).
   */
  async list(tableId: string): Promise<TableCharacter[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("table_characters")
      .select(
        "id, table_id, owner_id, base_character_id, name, avatar_url, data, created_at, updated_at",
      )
      .eq("table_id", tableId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as TableCharacterRow[]).map(rowToTableCharacter);
  },

  /** A ficha do usuário nesta mesa (se existir). */
  async mine(tableId: string): Promise<TableCharacter | null> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return null;
    const { data, error } = await supabase
      .from("table_characters")
      .select(
        "id, table_id, owner_id, base_character_id, name, avatar_url, data, created_at, updated_at",
      )
      .eq("table_id", tableId)
      .eq("owner_id", uidUser)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToTableCharacter(data as TableCharacterRow) : null;
  },

  /** Cria a cópia da ficha na mesa a partir de uma ficha base do usuário. */
  async createFromBase(tableId: string, base: Character): Promise<TableCharacter> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) throw new Error("Indisponível offline.");
    const copy = normalizeCharacter({ ...base });
    const { data, error } = await supabase
      .from("table_characters")
      .insert({
        table_id: tableId,
        owner_id: uidUser,
        base_character_id: base.id,
        name: copy.name,
        avatar_url: copy.avatarUrl ?? null,
        data: copy,
      })
      .select(
        "id, table_id, owner_id, base_character_id, name, avatar_url, data, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return rowToTableCharacter(data as TableCharacterRow);
  },

  /** Salva alterações na cópia da mesa (não afeta a ficha base nem outras mesas). */
  async save(id: string, character: Character): Promise<TableCharacter> {
    if (!supabase) throw new Error("Indisponível offline.");
    const updated = normalizeCharacter({ ...character });
    const { data, error } = await supabase
      .from("table_characters")
      .update({
        name: updated.name,
        avatar_url: updated.avatarUrl ?? null,
        data: updated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, table_id, owner_id, base_character_id, name, avatar_url, data, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return rowToTableCharacter(data as TableCharacterRow);
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("table_characters").delete().eq("id", id);
    if (error) throw error;
  },
};

// --- Compartilhamento de fichas base (grants) -------------------------------

export type GrantPermission = "view" | "use" | "edit";

export interface CharacterGrant {
  id: string;
  characterId: string;
  granteeId: string;
  displayName: string;
  avatarUrl?: string;
  friendCode: string;
  permission: GrantPermission;
}

interface GrantRow {
  id: string;
  character_id: string;
  owner_id: string;
  grantee_id: string;
  permission: GrantPermission;
}

export const grantsRepo = {
  /** Pessoas com quem uma ficha base foi compartilhada. */
  async listForCharacter(characterId: string): Promise<CharacterGrant[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("character_grants")
      .select("id, character_id, owner_id, grantee_id, permission")
      .eq("character_id", characterId);
    if (error) throw error;
    const rows = (data ?? []) as GrantRow[];
    const users = await hydrateUsers(rows.map((r) => r.grantee_id));
    return rows.map((r) => {
      const u = users.get(r.grantee_id);
      return {
        id: r.id,
        characterId: r.character_id,
        granteeId: r.grantee_id,
        displayName: u?.displayName ?? "Aventureiro",
        avatarUrl: u?.avatarUrl,
        friendCode: u?.friendCode ?? "",
        permission: r.permission,
      };
    });
  },

  /** Compartilha uma ficha com alguém pelo código de amigo. */
  async addByCode(
    characterId: string,
    code: string,
    permission: GrantPermission,
  ): Promise<string | null> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return "Entre na sua conta para compartilhar.";
    const clean = code.trim().toUpperCase();
    if (!clean) return "Informe um código de amigo.";
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("friend_code", clean)
      .maybeSingle();
    if (!prof) return "Código de amigo não encontrado.";
    if (prof.id === uidUser) return "Você já é o dono desta ficha.";
    const { error } = await supabase.from("character_grants").upsert(
      {
        character_id: characterId,
        owner_id: uidUser,
        grantee_id: prof.id,
        permission,
      },
      { onConflict: "character_id,grantee_id" },
    );
    if (error) return error.message;
    return null;
  },

  async setPermission(id: string, permission: GrantPermission): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from("character_grants")
      .update({ permission })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("character_grants").delete().eq("id", id);
    if (error) throw error;
  },

  /** Fichas que outras pessoas compartilharam comigo. */
  async sharedWithMe(): Promise<Character[]> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return [];
    const { data, error } = await supabase
      .from("character_grants")
      .select("character_id")
      .eq("grantee_id", uidUser);
    if (error) throw error;
    const ids = ((data ?? []) as { character_id: string }[]).map((g) => g.character_id);
    if (ids.length === 0) return [];
    const { data: chars, error: cErr } = await supabase
      .from("characters")
      .select("id, name, avatar_url, data")
      .in("id", ids);
    if (cErr) throw cErr;
    return (chars ?? []).map(rowToCharacter);
  },
};

// --- NPCs (biblioteca do mestre) --------------------------------------------

/** Extrai o ID do vídeo de uma URL do YouTube (ou retorna null). */
export function youtubeVideoId(url: string): string | null {
  const s = url.trim();
  if (!s) return null;
  // ID puro (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {
    /* url inválida */
  }
  return null;
}

/** Extrai o ID de faixa/álbum/playlist do Spotify para o player embed. */
export function spotifyEmbed(url: string): { kind: string; id: string } | null {
  const s = url.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!u.hostname.replace(/^www\./, "").endsWith("spotify.com")) return null;
    const m = u.pathname.match(/\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (m) return { kind: m[1], id: m[2] };
  } catch {
    /* url inválida */
  }
  return null;
}

export interface Npc {
  id: string;
  ownerId: string;
  name: string;
  imageUrl?: string;
  lore: string;
  objective: string;
  location: string;
  hostile: boolean;
  isGeneric: boolean;
  isPublic: boolean;
  data: Record<string, unknown>;
  authorName?: string;
  createdAt: number;
  updatedAt: number;
}

interface NpcRow {
  id: string;
  owner_id: string;
  name: string | null;
  image_url: string | null;
  lore: string | null;
  objective: string | null;
  location: string | null;
  hostile: boolean;
  is_generic: boolean;
  is_public: boolean;
  data: unknown;
  created_at: string;
  updated_at: string;
}

function rowToNpc(row: NpcRow): Npc {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name ?? "",
    imageUrl: row.image_url ?? undefined,
    lore: row.lore ?? "",
    objective: row.objective ?? "",
    location: row.location ?? "",
    hostile: !!row.hostile,
    isGeneric: !!row.is_generic,
    isPublic: !!row.is_public,
    data: (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

const NPC_COLS =
  "id, owner_id, name, image_url, lore, objective, location, hostile, is_generic, is_public, data, created_at, updated_at";

export type NpcInput = Partial<
  Pick<
    Npc,
    | "name"
    | "imageUrl"
    | "lore"
    | "objective"
    | "location"
    | "hostile"
    | "isGeneric"
    | "isPublic"
    | "data"
  >
>;

function npcInputToRow(patch: NpcInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl ?? null;
  if (patch.lore !== undefined) row.lore = patch.lore;
  if (patch.objective !== undefined) row.objective = patch.objective;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.hostile !== undefined) row.hostile = patch.hostile;
  if (patch.isGeneric !== undefined) row.is_generic = patch.isGeneric;
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  if (patch.data !== undefined) row.data = patch.data;
  return row;
}

export const npcRepo = {
  /** Biblioteca de NPCs do mestre autenticado. */
  async list(): Promise<Npc[]> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return [];
    const { data, error } = await supabase
      .from("npcs")
      .select(NPC_COLS)
      .eq("owner_id", uidUser)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as NpcRow[]).map(rowToNpc);
  },

  async get(id: string): Promise<Npc | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from("npcs").select(NPC_COLS).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToNpc(data as NpcRow) : null;
  },

  async create(patch: NpcInput): Promise<Npc> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) throw new Error("Entre na sua conta para criar NPCs.");
    const { data, error } = await supabase
      .from("npcs")
      .insert({ owner_id: uidUser, ...npcInputToRow(patch) })
      .select(NPC_COLS)
      .single();
    if (error) throw error;
    return rowToNpc(data as NpcRow);
  },

  async update(id: string, patch: NpcInput): Promise<Npc> {
    if (!supabase) throw new Error("Indisponível offline.");
    const { data, error } = await supabase
      .from("npcs")
      .update({ ...npcInputToRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(NPC_COLS)
      .single();
    if (error) throw error;
    return rowToNpc(data as NpcRow);
  },

  async setPublic(id: string, value: boolean): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("npcs").update({ is_public: value }).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("npcs").delete().eq("id", id);
    if (error) throw error;
  },

  /** NPCs públicos da comunidade (exclui os do próprio usuário). */
  async publicList(): Promise<Npc[]> {
    if (!supabase) return [];
    const uidUser = await currentUserId();
    const { data, error } = await supabase
      .from("npcs")
      .select(NPC_COLS)
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    const rows = ((data ?? []) as NpcRow[]).filter((r) => r.owner_id !== uidUser);
    const authors = await hydrateUsers(rows.map((r) => r.owner_id));
    return rows.map((r) => ({ ...rowToNpc(r), authorName: authors.get(r.owner_id)?.displayName }));
  },

  /** Importa um NPC público para a biblioteca do usuário (cria uma cópia). */
  async importPublic(source: Npc): Promise<Npc> {
    return npcRepo.create({
      name: source.name,
      imageUrl: source.imageUrl,
      lore: source.lore,
      objective: source.objective,
      location: source.location,
      hostile: source.hostile,
      isGeneric: source.isGeneric,
      isPublic: false,
      data: source.data,
    });
  },
};

/** Envia a imagem de um NPC para o bucket `avatars` (uid/npc-<id>.<ext>). */
export async function uploadNpcImage(npcId: string, file: File): Promise<string> {
  const uidUser = await currentUserId();
  if (!uidUser || !supabase) throw new Error("Entre na sua conta para enviar imagens.");
  if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem muito grande (máx. 5 MB).");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${uidUser}/npc-${npcId}.${ext || "png"}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// --- NPCs na mesa (cards visíveis aos jogadores) ----------------------------

export interface TableNpc {
  id: string;
  tableId: string;
  npcId: string | null;
  displayName: string;
  imageUrl?: string;
  hostile: boolean;
  createdAt: number;
}

interface TableNpcRow {
  id: string;
  table_id: string;
  npc_id: string | null;
  display_name: string | null;
  image_url: string | null;
  hostile: boolean;
  created_at: string;
}

function rowToTableNpc(row: TableNpcRow): TableNpc {
  return {
    id: row.id,
    tableId: row.table_id,
    npcId: row.npc_id,
    displayName: row.display_name ?? "",
    imageUrl: row.image_url ?? undefined,
    hostile: !!row.hostile,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const tableNpcRepo = {
  /** Cards de NPC visíveis na mesa (snapshot: nome + imagem). */
  async list(tableId: string): Promise<TableNpc[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("table_npcs")
      .select("id, table_id, npc_id, display_name, image_url, hostile, created_at")
      .eq("table_id", tableId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as TableNpcRow[]).map(rowToTableNpc);
  },

  /** Coloca um NPC na mesa (só o snapshot público vai para a linha). */
  async add(tableId: string, npc: Npc): Promise<TableNpc> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) throw new Error("Indisponível offline.");
    const { data, error } = await supabase
      .from("table_npcs")
      .insert({
        table_id: tableId,
        npc_id: npc.id,
        added_by: uidUser,
        display_name: npc.name,
        image_url: npc.imageUrl ?? null,
        hostile: npc.hostile,
      })
      .select("id, table_id, npc_id, display_name, image_url, hostile, created_at")
      .single();
    if (error) throw error;
    return rowToTableNpc(data as TableNpcRow);
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("table_npcs").delete().eq("id", id);
    if (error) throw error;
  },
};

// --- Anotações do jogador sobre um NPC (privadas por jogador) ---------------

export const npcNoteRepo = {
  /** A anotação do usuário atual para um card de NPC. */
  async get(tableNpcId: string): Promise<string> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return "";
    const { data, error } = await supabase
      .from("npc_notes")
      .select("content")
      .eq("table_npc_id", tableNpcId)
      .eq("user_id", uidUser)
      .maybeSingle();
    if (error) throw error;
    return data?.content ?? "";
  },

  async save(tableNpcId: string, content: string): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const { error } = await supabase.from("npc_notes").upsert(
      {
        table_npc_id: tableNpcId,
        user_id: uidUser,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "table_npc_id,user_id" },
    );
    if (error) throw error;
  },
};

// --- Música da mesa (reprodução sincronizada) -------------------------------

export type MusicProvider = "youtube" | "spotify";

export interface MusicState {
  tableId: string;
  provider: MusicProvider;
  url: string | null;
  videoId: string | null;
  title: string;
  isPlaying: boolean;
  positionSeconds: number;
  updatedAt: number;
}

interface MusicRow {
  table_id: string;
  provider: MusicProvider;
  url: string | null;
  video_id: string | null;
  title: string | null;
  is_playing: boolean;
  position_seconds: number;
  updated_at: string;
}

function rowToMusic(row: MusicRow): MusicState {
  return {
    tableId: row.table_id,
    provider: row.provider,
    url: row.url,
    videoId: row.video_id,
    title: row.title ?? "",
    isPlaying: !!row.is_playing,
    positionSeconds: row.position_seconds ?? 0,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export interface MusicTrack {
  id: string;
  tableId: string;
  provider: MusicProvider;
  url: string;
  videoId: string | null;
  title: string;
  position: number;
}

interface MusicTrackRow {
  id: string;
  table_id: string;
  provider: MusicProvider;
  url: string;
  video_id: string | null;
  title: string | null;
  position: number;
}

function rowToTrack(row: MusicTrackRow): MusicTrack {
  return {
    id: row.id,
    tableId: row.table_id,
    provider: row.provider,
    url: row.url,
    videoId: row.video_id,
    title: row.title ?? "",
    position: row.position,
  };
}

export const musicRepo = {
  /** Estado atual de reprodução da mesa. */
  async get(tableId: string): Promise<MusicState | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("table_music")
      .select("table_id, provider, url, video_id, title, is_playing, position_seconds, updated_at")
      .eq("table_id", tableId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToMusic(data as MusicRow) : null;
  },

  /** Mestre define a faixa/estado (upsert). */
  async set(
    tableId: string,
    patch: {
      provider?: MusicProvider;
      url?: string | null;
      videoId?: string | null;
      title?: string;
      isPlaying?: boolean;
      positionSeconds?: number;
    },
  ): Promise<void> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return;
    const row: Record<string, unknown> = {
      table_id: tableId,
      updated_by: uidUser,
      updated_at: new Date().toISOString(),
    };
    if (patch.provider !== undefined) row.provider = patch.provider;
    if (patch.url !== undefined) row.url = patch.url;
    if (patch.videoId !== undefined) row.video_id = patch.videoId;
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.isPlaying !== undefined) row.is_playing = patch.isPlaying;
    if (patch.positionSeconds !== undefined) row.position_seconds = patch.positionSeconds;
    const { error } = await supabase.from("table_music").upsert(row, { onConflict: "table_id" });
    if (error) throw error;
  },

  /** Playlist da mesa. */
  async tracks(tableId: string): Promise<MusicTrack[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("music_tracks")
      .select("id, table_id, provider, url, video_id, title, position")
      .eq("table_id", tableId)
      .order("position", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as MusicTrackRow[]).map(rowToTrack);
  },

  async addTrack(
    tableId: string,
    track: { provider: MusicProvider; url: string; videoId: string | null; title: string },
  ): Promise<MusicTrack> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) throw new Error("Indisponível offline.");
    const existing = await musicRepo.tracks(tableId);
    const position = existing.length ? existing[existing.length - 1].position + 1 : 0;
    const { data, error } = await supabase
      .from("music_tracks")
      .insert({
        table_id: tableId,
        provider: track.provider,
        url: track.url,
        video_id: track.videoId,
        title: track.title,
        position,
        added_by: uidUser,
      })
      .select("id, table_id, provider, url, video_id, title, position")
      .single();
    if (error) throw error;
    return rowToTrack(data as MusicTrackRow);
  },

  async removeTrack(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("music_tracks").delete().eq("id", id);
    if (error) throw error;
  },

  /** Assina o estado de música da mesa (baixa latência para os jogadores). */
  subscribe(tableId: string, onChange: () => void): () => void {
    const client = supabase;
    if (!client) return () => {};
    const channel = client
      .channel(`musica:${tableId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_music", filter: `table_id=eq.${tableId}` },
        onChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "music_tracks", filter: `table_id=eq.${tableId}` },
        onChange,
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  },
};

// --- Biblioteca de trilhas do mestre (acervo reutilizável entre mesas) -------

export interface LibraryTrack {
  id: string;
  provider: MusicProvider;
  url: string;
  videoId: string | null;
  title: string;
  tag: string;
}

interface LibraryTrackRow {
  id: string;
  provider: MusicProvider;
  url: string;
  video_id: string | null;
  title: string | null;
  tag: string | null;
}

function rowToLibraryTrack(row: LibraryTrackRow): LibraryTrack {
  return {
    id: row.id,
    provider: row.provider,
    url: row.url,
    videoId: row.video_id,
    title: row.title ?? "",
    tag: row.tag ?? "",
  };
}

export const musicLibraryRepo = {
  /** Acervo de trilhas do mestre autenticado (todas as mesas). */
  async list(): Promise<LibraryTrack[]> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) return [];
    const { data, error } = await supabase
      .from("music_library")
      .select("id, provider, url, video_id, title, tag")
      .eq("owner_id", uidUser)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as LibraryTrackRow[]).map(rowToLibraryTrack);
  },

  async add(track: {
    provider: MusicProvider;
    url: string;
    videoId: string | null;
    title: string;
    tag?: string;
  }): Promise<LibraryTrack> {
    const uidUser = await currentUserId();
    if (!uidUser || !supabase) throw new Error("Entre na sua conta para salvar trilhas.");
    const { data, error } = await supabase
      .from("music_library")
      .insert({
        owner_id: uidUser,
        provider: track.provider,
        url: track.url,
        video_id: track.videoId,
        title: track.title,
        tag: track.tag ?? "",
      })
      .select("id, provider, url, video_id, title, tag")
      .single();
    if (error) throw error;
    return rowToLibraryTrack(data as LibraryTrackRow);
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("music_library").delete().eq("id", id);
    if (error) throw error;
  },
};

export { uid };
