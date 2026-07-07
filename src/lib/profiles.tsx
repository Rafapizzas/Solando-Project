"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./auth";

/**
 * profiles.tsx — Perfis estilo "Netflix" dentro de UMA conta.
 *
 * Uma mesma conta (login) pode ter vários perfis: por ex. um perfil "Jogador"
 * (acesso de jogador) e um "Mestre" (gerencia mesas). O usuário escolhe/troca
 * de perfil livremente. Persistência local por conta (localStorage), então
 * funciona de imediato — sem depender de migração de banco.
 */

export type ProfileRole = "player" | "master";

export interface AccountProfile {
  id: string;
  name: string;
  role: ProfileRole;
  /** Cor de destaque (avatar). */
  color: string;
  /** Emoji de avatar. */
  emoji: string;
}

export const PROFILE_COLORS = [
  "#a855f7",
  "#22d3ee",
  "#facc15",
  "#f43f5e",
  "#34d399",
  "#fb923c",
];
export const PROFILE_EMOJIS = ["🧙", "🗡️", "🛡️", "🎭", "👑", "🐉", "🔮", "🏹"];

interface ProfilesState {
  ready: boolean;
  profiles: AccountProfile[];
  activeProfile: AccountProfile | null;
  /** É mestre no perfil ativo? (sem perfil ativo, assume-se acesso pleno). */
  canMaster: boolean;
  selectProfile: (id: string) => void;
  clearActive: () => void;
  createProfile: (data: Omit<AccountProfile, "id">) => AccountProfile;
  updateProfile: (id: string, patch: Partial<Omit<AccountProfile, "id">>) => void;
  removeProfile: (id: string) => void;
}

const ProfilesContext = createContext<ProfilesState | null>(null);

function keyFor(uid: string) {
  return `solando:profiles:v1:${uid}`;
}
function activeKeyFor(uid: string) {
  return `solando:active-profile:v1:${uid}`;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function readProfiles(uid: string): AccountProfile[] {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccountProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const uid = user?.id ?? null;

  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Carrega perfis quando a conta muda.
  useEffect(() => {
    if (!uid) {
      setProfiles([]);
      setActiveId(null);
      setReady(true);
      return;
    }
    const list = readProfiles(uid);
    setProfiles(list);
    try {
      setActiveId(localStorage.getItem(activeKeyFor(uid)));
    } catch {
      setActiveId(null);
    }
    setReady(true);
  }, [uid]);

  const persist = useCallback(
    (list: AccountProfile[]) => {
      if (!uid) return;
      setProfiles(list);
      try {
        localStorage.setItem(keyFor(uid), JSON.stringify(list));
      } catch {
        /* ignora cota */
      }
    },
    [uid],
  );

  const selectProfile = useCallback(
    (id: string) => {
      if (!uid) return;
      setActiveId(id);
      try {
        localStorage.setItem(activeKeyFor(uid), id);
      } catch {
        /* ignora */
      }
    },
    [uid],
  );

  const clearActive = useCallback(() => {
    if (!uid) return;
    setActiveId(null);
    try {
      localStorage.removeItem(activeKeyFor(uid));
    } catch {
      /* ignora */
    }
  }, [uid]);

  const createProfile = useCallback(
    (data: Omit<AccountProfile, "id">) => {
      const created: AccountProfile = { ...data, id: newId() };
      persist([...profiles, created]);
      return created;
    },
    [profiles, persist],
  );

  const updateProfile = useCallback(
    (id: string, patch: Partial<Omit<AccountProfile, "id">>) => {
      persist(profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [profiles, persist],
  );

  const removeProfile = useCallback(
    (id: string) => {
      persist(profiles.filter((p) => p.id !== id));
      if (activeId === id) clearActive();
    },
    [profiles, persist, activeId, clearActive],
  );

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId],
  );

  const value = useMemo<ProfilesState>(
    () => ({
      ready,
      profiles,
      activeProfile,
      canMaster: activeProfile ? activeProfile.role === "master" : true,
      selectProfile,
      clearActive,
      createProfile,
      updateProfile,
      removeProfile,
    }),
    [
      ready,
      profiles,
      activeProfile,
      selectProfile,
      clearActive,
      createProfile,
      updateProfile,
      removeProfile,
    ],
  );

  // Sugestão de nome para o primeiro perfil (baseado na conta).
  void profile;

  return (
    <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>
  );
}

export function useProfiles(): ProfilesState {
  const ctx = useContext(ProfilesContext);
  if (!ctx) throw new Error("useProfiles deve ser usado dentro de ProfileProvider");
  return ctx;
}
