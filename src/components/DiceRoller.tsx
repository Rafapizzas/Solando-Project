"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RollResult, roll, rollExpression } from "@/lib/solando/dice";

interface DiceRollerProps {
  compact?: boolean;
  onRoll?: (result: RollResult) => void;
}

export function DiceRoller({ compact, onRoll }: DiceRollerProps) {
  const [result, setResult] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [expr, setExpr] = useState("1d100");
  const [diceMod, setDiceMod] = useState(0);
  const [modifier, setModifier] = useState(0);

  function doRoll(r: RollResult | null) {
    if (!r) return;
    setRolling(true);
    setResult(r);
    onRoll?.(r);
    setTimeout(() => setRolling(false), 450);
  }

  function rollTest() {
    doRoll(roll(100, diceMod, modifier, "Teste d100"));
  }

  function rollExpr() {
    const r = rollExpression(expr);
    if (r) doRoll(r);
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-zinc-100">🎲 Rolar Dados</h3>
        {result && (
          <span className="text-xs text-zinc-500">último: {result.label}</span>
        )}
      </div>

      {/* Resultado */}
      <div className="mb-5 grid place-items-center rounded-2xl border border-white/10 bg-void-950/60 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={result ? `${result.total}-${result.pool.join(",")}` : "empty"}
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{
              scale: rolling ? [1, 1.15, 1] : 1,
              opacity: 1,
              rotate: rolling ? [0, 8, -6, 0] : 0,
            }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div
              className={`text-6xl font-black ${
                result?.crit === "critico"
                  ? "text-sol"
                  : result?.crit === "falha-critica"
                  ? "text-red-500"
                  : "text-zinc-100"
              }`}
            >
              {result ? result.total : "—"}
            </div>
            {result && (
              <div className="mt-2 text-sm text-zinc-400">
                {result.pool.length > 1 && (
                  <span>
                    pool [{result.pool.join(", ")}] →{" "}
                    <b className="text-zinc-200">{result.chosen}</b>
                  </span>
                )}
                {result.modifier !== 0 && (
                  <span>
                    {" "}
                    {result.modifier > 0 ? "+" : ""}
                    {result.modifier}
                  </span>
                )}
                {result.crit && (
                  <div
                    className={`mt-1 font-bold ${
                      result.crit === "critico" ? "text-sol" : "text-red-400"
                    }`}
                  >
                    {result.crit === "critico"
                      ? "✦ ACERTO CRÍTICO"
                      : "✕ FALHA CRÍTICA"}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Teste d100 com vantagem/desvantagem */}
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Vantagem / Desvantagem</label>
            <div className="flex items-center gap-2">
              <button
                className="btn-ghost !px-3 !py-1.5"
                onClick={() => setDiceMod((v) => v - 1)}
              >
                −
              </button>
              <span
                className={`w-12 text-center font-bold ${
                  diceMod > 0
                    ? "text-alma-soft"
                    : diceMod < 0
                    ? "text-red-400"
                    : "text-zinc-300"
                }`}
              >
                {diceMod > 0 ? `+${diceMod}` : diceMod}
              </span>
              <button
                className="btn-ghost !px-3 !py-1.5"
                onClick={() => setDiceMod((v) => v + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div className="flex-1">
            <label className="label">Modificador</label>
            <input
              type="number"
              className="input"
              value={modifier}
              onChange={(e) => setModifier(Number(e.target.value) || 0)}
            />
          </div>
          <button className="btn-primary" onClick={rollTest}>
            Rolar d100
          </button>
        </div>

        {!compact && (
          <div className="flex items-end gap-2 border-t border-white/5 pt-3">
            <div className="flex-1">
              <label className="label">Expressão livre (ex.: 3d20+5)</label>
              <input
                className="input"
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rollExpr()}
              />
            </div>
            <button className="btn-sol" onClick={rollExpr}>
              Rolar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
