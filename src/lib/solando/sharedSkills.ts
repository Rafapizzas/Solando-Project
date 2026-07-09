/**
 * sharedSkills.ts — Grimório de Skills compartilhado.
 *
 * Espelha o padrão de `customContent.ts` (raças/classes): skills criadas pelos
 * jogadores ficam guardadas no localStorage (as suas) e podem ser publicadas no
 * Supabase (tabela `shared_skills`, pública) para que todos possam importá-las.
 *
 * Os getters são SÍNCRONOS (usados na UI). O conteúdo público vem de um cache em
 * memória hidratado por `hydrateSharedSkills()`. Sem Supabase configurado, tudo
 * funciona só com o armazenamento local.
 */

import type { Skill } from "./character";
import { supabase, isSupabaseEnabled } from "../supabase/client";
import { slugify } from "./customContent";

export interface SharedSkill {
  /** slug único (por dono) — também usado como id do card do grimório. */
  slug: string;
  name: string;
  cost: number;
  description: string;
  effects?: Skill["effects"];
  area?: string;
  passive?: boolean;
  /** Nome de exibição do autor (perfil/conta). */
  author?: string;
  createdAt: number;
}

const KEY_LOCAL = "solando:sharedSkills";

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

let sharedCache: SharedSkill[] = [];

function localSkills(): SharedSkill[] {
  return read<SharedSkill[]>(KEY_LOCAL, []);
}

function mergeBySlug(primary: SharedSkill[], extra: SharedSkill[]): SharedSkill[] {
  const seen = new Set(primary.map((x) => x.slug));
  return [...primary, ...extra.filter((x) => !seen.has(x.slug))];
}

async function currentUid(): Promise<string | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Carrega as skills públicas do Supabase para o cache em memória. Idempotente. */
export async function hydrateSharedSkills(): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  const { data, error } = await supabase
    .from("shared_skills")
    .select("data")
    .eq("is_public", true);
  if (!error && data) {
    sharedCache = data
      .map((r) => r.data as SharedSkill)
      .filter((s) => s && s.slug && s.name);
  }
}

/** Grimório completo: skills locais (suas) + públicas (de todos). */
export function getSharedSkills(): SharedSkill[] {
  return mergeBySlug(localSkills(), sharedCache);
}

/**
 * Publica uma skill no grimório. Guarda localmente e faz upsert no Supabase
 * (público) quando o usuário está logado.
 */
export async function publishSkill(skill: Skill, author?: string): Promise<SharedSkill> {
  const shared: SharedSkill = {
    slug: slugify(skill.name || "skill"),
    name: skill.name || "Skill sem nome",
    cost: skill.cost,
    description: skill.description,
    effects: skill.effects,
    area: skill.area,
    passive: skill.passive,
    author,
    createdAt: Date.now(),
  };

  const all = localSkills();
  const idx = all.findIndex((s) => s.slug === shared.slug);
  if (idx >= 0) all[idx] = shared;
  else all.push(shared);
  write(KEY_LOCAL, all);

  const uid = await currentUid();
  if (uid && supabase) {
    await supabase
      .from("shared_skills")
      .upsert(
        { owner_id: uid, slug: shared.slug, data: shared, is_public: true },
        { onConflict: "owner_id,slug" },
      );
    // Reflete imediatamente no cache público.
    sharedCache = mergeBySlug(
      sharedCache.filter((s) => s.slug !== shared.slug),
      [shared],
    );
  }
  return shared;
}

/** Remove uma skill publicada por você (local + Supabase). */
export async function unpublishSkill(slug: string): Promise<void> {
  write(
    KEY_LOCAL,
    localSkills().filter((s) => s.slug !== slug),
  );
  const uid = await currentUid();
  if (uid && supabase) {
    await supabase.from("shared_skills").delete().eq("owner_id", uid).eq("slug", slug);
    sharedCache = sharedCache.filter((s) => s.slug !== slug);
  }
}
