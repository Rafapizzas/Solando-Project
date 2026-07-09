"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./auth";
import { presenceRepo, type PresenceStatus } from "./storage";

/**
 * presence.tsx — Presença estilo Discord. Enquanto autenticado, publica um
 * "heartbeat" periódico com o status atual. Páginas (ex.: a mesa) podem definir
 * um contexto de presença (em sessão / mestrando) via `setContext` e limpá-lo ao
 * sair. Sem contexto, o status é "online".
 */

interface PresenceContextValue {
  /** Define o status atual e a mesa em foco (null = fora de mesa). */
  setContext: (status: PresenceStatus, tableId: string | null) => void;
  /** Volta ao status padrão (online, sem mesa). */
  clearContext: () => void;
}

const Ctx = createContext<PresenceContextValue | null>(null);

const HEARTBEAT_MS = 45_000;

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<PresenceStatus>("online");
  const [tableId, setTableId] = useState<string | null>(null);
  const stateRef = useRef({ status, tableId });
  stateRef.current = { status, tableId };

  const setContext = useCallback((s: PresenceStatus, t: string | null) => {
    setStatus(s);
    setTableId(t);
  }, []);

  const clearContext = useCallback(() => {
    setStatus("online");
    setTableId(null);
  }, []);

  // Heartbeat enquanto autenticado.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const beat = () => {
      if (cancelled) return;
      void presenceRepo.set(stateRef.current.status, stateRef.current.tableId);
    };
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onLeave = () => {
      void presenceRepo.set("offline", null);
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [isAuthenticated]);

  // Reage a mudanças de status/mesa imediatamente.
  useEffect(() => {
    if (!isAuthenticated) return;
    void presenceRepo.set(status, tableId);
  }, [isAuthenticated, status, tableId]);

  const value = useMemo<PresenceContextValue>(
    () => ({ setContext, clearContext }),
    [setContext, clearContext],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePresence(): PresenceContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePresence deve ser usado dentro de PresenceProvider");
  return ctx;
}
