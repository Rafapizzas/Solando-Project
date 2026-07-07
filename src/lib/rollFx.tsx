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
import { AnimatePresence, motion } from "framer-motion";

/**
 * rollFx.tsx — Efeitos de crítico (som + animação) coerentes com o resultado.
 *
 * Crítico positivo: fanfarra ascendente e brilho dourado.
 * Falha crítica: acorde grave/dissonante e estilhaço vermelho.
 * O som é sintetizado via Web Audio (sem assets/licenças). Respeita a
 * preferência de "reduzir movimento" e pode ser desligado pelo usuário.
 */

type Crit = "critico" | "falha-critica" | null;

interface RollFxState {
  play: (crit: Crit) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
}

const RollFxContext = createContext<RollFxState | null>(null);

const MUTE_KEY = "solando:fx-muted:v1";

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensure = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (
      ac: AudioContext,
      freq: number,
      start: number,
      dur: number,
      type: OscillatorType,
      gain: number,
    ) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime + start);
      g.gain.setValueAtTime(0, ac.currentTime + start);
      g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(ac.currentTime + start);
      osc.stop(ac.currentTime + start + dur + 0.02);
    },
    [],
  );

  const playCrit = useCallback(() => {
    const ac = ensure();
    if (!ac) return;
    if (ac.state === "suspended") void ac.resume();
    // Fanfarra ascendente (dó-mi-sol-dó) brilhante.
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(ac, f, i * 0.09, 0.35, "triangle", 0.22),
    );
    tone(ac, 1567.98, 0.36, 0.5, "sine", 0.14);
  }, [ensure, tone]);

  const playFail = useCallback(() => {
    const ac = ensure();
    if (!ac) return;
    if (ac.state === "suspended") void ac.resume();
    // Acorde grave e dissonante descendente (trítono).
    [220, 233.08, 155.56].forEach((f, i) =>
      tone(ac, f, i * 0.12, 0.5, "sawtooth", 0.16),
    );
    tone(ac, 82.41, 0.24, 0.6, "square", 0.12);
  }, [ensure, tone]);

  return { playCrit, playFail };
}

export function RollFxProvider({ children }: { children: React.ReactNode }) {
  const [crit, setCrit] = useState<Crit>(null);
  const [muted, setMutedState] = useState(false);
  const { playCrit, playFail } = useAudio();

  useEffect(() => {
    try {
      setMutedState(localStorage.getItem(MUTE_KEY) === "1");
    } catch {
      /* ignora */
    }
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* ignora */
    }
  }, []);

  const play = useCallback(
    (c: Crit) => {
      if (!c) return;
      setCrit(c);
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!muted && !reduce) {
        if (c === "critico") playCrit();
        else playFail();
      }
      window.setTimeout(() => setCrit(null), 1500);
    },
    [muted, playCrit, playFail],
  );

  const value = useMemo<RollFxState>(
    () => ({ play, muted, setMuted }),
    [play, muted, setMuted],
  );

  const positive = crit === "critico";

  return (
    <RollFxContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {crit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[70] grid place-items-center overflow-hidden"
          >
            {/* Flash de cor */}
            <motion.div
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
              style={{
                background: positive
                  ? "radial-gradient(circle, rgba(250,204,21,0.35), transparent 60%)"
                  : "radial-gradient(circle, rgba(239,68,68,0.35), transparent 60%)",
              }}
            />
            {/* Linhas de velocidade (speed lines) */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-conic-gradient(from 0deg at 50% 50%, ${
                  positive ? "#facc15" : "#ef4444"
                } 0deg 1.5deg, transparent 1.5deg 6deg)`,
                maskImage:
                  "radial-gradient(circle, transparent 30%, black 60%)",
                WebkitMaskImage:
                  "radial-gradient(circle, transparent 30%, black 60%)",
              }}
            />
            <motion.div
              initial={{ scale: 0.4, rotate: positive ? -8 : 8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="relative text-center"
            >
              <div
                className="font-ink text-6xl font-black drop-shadow-[0_4px_0_rgba(0,0,0,0.6)] sm:text-8xl"
                style={{ color: positive ? "#facc15" : "#ef4444" }}
              >
                {positive ? "CRÍTICO!" : "FALHA CRÍTICA"}
              </div>
              <div className="mt-1 font-ink text-2xl text-white/80">
                {positive ? "会心の一撃" : "大失敗"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RollFxContext.Provider>
  );
}

export function useRollFx(): RollFxState {
  const ctx = useContext(RollFxContext);
  if (!ctx) throw new Error("useRollFx deve ser usado dentro de RollFxProvider");
  return ctx;
}
