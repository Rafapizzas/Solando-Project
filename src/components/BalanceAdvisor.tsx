"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { analyzeCharacter, InsightLevel } from "@/lib/solando/balance";
import {
  Character,
  derivedStats,
  effectiveAttributes,
} from "@/lib/solando/character";
import { ATTRIBUTES } from "@/lib/solando/rules";
import { resolveRace, resolveClass } from "@/lib/solando/customContent";

const styles: Record<
  InsightLevel,
  { icon: string; ring: string; text: string }
> = {
  erro: { icon: "✕", ring: "border-red-500/40 bg-red-500/5", text: "text-red-400" },
  alerta: {
    icon: "!",
    ring: "border-sol/40 bg-sol/5",
    text: "text-sol-soft",
  },
  dica: {
    icon: "💡",
    ring: "border-alma/30 bg-alma/5",
    text: "text-alma-soft",
  },
  ok: {
    icon: "✓",
    ring: "border-emerald-500/40 bg-emerald-500/5",
    text: "text-emerald-400",
  },
};

export function BalanceAdvisor({ character }: { character: Character }) {
  const report = analyzeCharacter(character);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function askOracle() {
    setAiLoading(true);
    setAiText(null);
    setAiNote(null);
    try {
      const summary = buildSummary(character, report.score);
      const res = await fetch("/api/oraculo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      const data = (await res.json()) as {
        text?: string;
        fallback?: boolean;
        reason?: string;
        error?: string;
      };
      if (data.text) {
        setAiText(data.text);
      } else if (data.fallback) {
        setAiNote(
          "IA indisponível no momento — seguindo com o balanceamento determinístico acima.",
        );
      } else {
        setAiNote(data.error ?? "Não foi possível consultar o Oráculo.");
      }
    } catch {
      setAiNote("Falha de rede ao consultar o Oráculo.");
    } finally {
      setAiLoading(false);
    }
  }

  const scoreColor =
    report.score >= 80
      ? "text-emerald-400"
      : report.score >= 50
      ? "text-sol-soft"
      : "text-red-400";

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-zinc-100">
          🔮 Oráculo da Entropia
        </h3>
        <div className="text-right">
          <div className={`text-2xl font-black ${scoreColor}`}>{report.score}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            equilíbrio
          </div>
        </div>
      </div>

      {/* Barra de score */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-void-950">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-sol to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${report.score}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <ul className="space-y-2">
        {report.insights.length === 0 && (
          <li className="text-sm text-zinc-500">
            Comece a montar a ficha para receber insights.
          </li>
        )}
        {report.insights.map((ins, i) => {
          const s = styles[ins.level];
          return (
            <motion.li
              key={`${ins.title}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 rounded-xl border p-3 ${s.ring}`}
            >
              <span className={`mt-0.5 text-sm font-bold ${s.text}`}>{s.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${s.text}`}>{ins.title}</p>
                <p className="text-xs text-zinc-400">{ins.detail}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {/* Conselho por IA (opcional, gratuito). Cai no determinístico se indisponível. */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <button
          onClick={askOracle}
          disabled={aiLoading}
          className="btn-ghost w-full text-sm disabled:opacity-50"
        >
          {aiLoading ? "Consultando o Oráculo…" : "🔮 Pedir conselho ao Oráculo (IA)"}
        </button>
        {aiText && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-alma/30 bg-alma/5 p-3 text-sm italic text-alma-soft"
          >
            {aiText}
          </motion.p>
        )}
        {aiNote && <p className="mt-3 text-xs text-zinc-500">{aiNote}</p>}
      </div>
    </div>
  );
}

/** Resumo compacto do personagem para enviar ao Oráculo (IA). */
function buildSummary(character: Character, score: number): string {
  const attrs = effectiveAttributes(character);
  const d = derivedStats(character);
  const race = resolveRace(character.race)?.name ?? "raça indefinida";
  const klass = resolveClass(character.charClass)?.name ?? "classe indefinida";
  const attrLine = ATTRIBUTES.map((a) => `${a.short} ${attrs[a.key]}`).join(", ");
  const skills =
    character.skills.map((s) => s.name).filter(Boolean).join(", ") || "nenhuma";
  const conditions =
    character.conditions.map((c) => c.name).filter(Boolean).join(", ") || "nenhuma";
  return [
    `Nome: ${character.name || "sem nome"}`,
    `Raça: ${race} | Classe: ${klass} | Nível: ${character.level}`,
    `Atributos: ${attrLine}`,
    `Vida: ${d.vida} | Sanidade: ${d.sanidade} | Entropia: ${d.entropia}`,
    `Skills: ${skills}`,
    `Condições: ${conditions}`,
    `Índice de equilíbrio atual: ${score}/100`,
  ].join("\n");
}
