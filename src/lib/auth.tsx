"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseEnabled } from "./supabase/client";

/**
 * auth.tsx — Autenticação real via Supabase (Google OAuth + email/senha).
 *
 * Uma conta pode ser mestre E jogador ao mesmo tempo: não há papel global. O
 * papel de "mestre" é contextual (dono da mesa), resolvido por mesa. Aqui só
 * cuidamos de sessão e perfil.
 */

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email?: string | null;
}

interface AuthState {
  ready: boolean;
  /** Supabase está configurado (env presentes)? */
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<string | null>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function profileFromUser(user: User | null): Profile | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const displayName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    (user.email ? user.email.split("@")[0] : "Aventureiro");
  return {
    id: user.id,
    displayName,
    avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || undefined,
    email: user.email ?? null,
  };
}

const NOT_CONFIGURED = "Login indisponível: Supabase não configurado.";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/entrar" },
    });
    return error ? error.message : null;
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string): Promise<string | null> => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName.trim() || email.split("@")[0] },
          emailRedirectTo: window.location.origin + "/entrar",
        },
      });
      return error ? error.message : null;
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      configured: isSupabaseEnabled(),
      user,
      profile: profileFromUser(user),
      isAuthenticated: !!user,
      signInWithGoogle,
      signInWithPassword,
      signUp,
      signOut,
    }),
    [ready, user, signInWithGoogle, signInWithPassword, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
