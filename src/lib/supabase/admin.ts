import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * admin.ts — Cliente Supabase com a SERVICE ROLE KEY. USO EXCLUSIVO NO SERVIDOR
 * (rotas de API). NUNCA importe em componentes de cliente: a chave ignora as
 * políticas RLS e concede acesso total ao banco.
 */

let _admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (_admin) return _admin;
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/**
 * Lista de e-mails com poder de administrador (donos do site). Aceita vários
 * separados por vírgula em NEXT_PUBLIC_ADMIN_EMAIL (ex.: "a@x.com,b@y.com").
 */
export function adminEmails(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ??
    process.env.ADMIN_EMAIL ??
    process.env.FEEDBACK_EMAIL_TO ??
    "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Verifica se um e-mail está na lista de administradores. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/**
 * Valida o token de acesso (Bearer) do usuário e devolve seus dados. Retorna
 * null se não houver token válido. Usa a anon key só para verificar o JWT.
 */
export async function getUserFromRequest(
  request: Request,
): Promise<{ id: string; email: string | null; name: string; isAdmin: boolean } | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;

  try {
    const client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    const meta = data.user.user_metadata ?? {};
    const email = data.user.email ?? null;
    const name =
      (meta.full_name as string) ||
      (meta.name as string) ||
      (email ? email.split("@")[0] : "Aventureiro");
    const isAdmin = isAdminEmail(email);
    return { id: data.user.id, email, name, isAdmin };
  } catch {
    return null;
  }
}
