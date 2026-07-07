"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * client.ts — Cliente Supabase para o navegador (auth + banco + storage).
 *
 * A chave usada é a "publishable/anon key" (pública por design). A segurança
 * real vem das políticas RLS no banco (ver docs/supabase-schema.sql).
 *
 * Se as variáveis de ambiente não estiverem definidas, `supabase` é `null` e o
 * app cai no modo local (localStorage) sem quebrar.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

if (url && anonKey) {
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = _client;

/** True quando o Supabase está configurado (env presentes). */
export function isSupabaseEnabled(): boolean {
  return _client !== null;
}
