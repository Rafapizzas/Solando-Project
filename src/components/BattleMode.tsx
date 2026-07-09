"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Combatant,
  CombatSide,
  CombatState,
  Npc,
  TableCharacter,
  combatRepo,
  npcRepo,
  npcSheet,
} from "@/lib/storage";
import { derivedStats, effectiveAttributes } from "@/lib/solando/character";

/**
 * BattleMode — Modo Batalha (D13). O mestre inicia o combate, adiciona
 * combatentes (jogadores, NPCs com ficha ou inimigos avulsos), rola iniciativa,
 * avança turnos e edita HP/condições ao vivo. Todos acompanham via realtime.
 * A interface fica mais agressiva em combate — e ainda mais no modo Boss.
 */
export function BattleMode({
  tableId,
  isMaster,
  tableChars,
}: {
  tableId: string;
  isMaster: boolean;
  tableChars: TableCharacter[];
}) {
  const [state, setState] = useState<CombatState | null>(null);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [open, setOpen] = useState(false);
  const [enemyName, setEnemyName] = useState("");
  const [enemyHp, setEnemyHp] = useState("20");

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      combatRepo.getState(tableId),
      combatRepo.combatants(tableId),
    ]);
    setState(s);
    setCombatants(c);
  }, [tableId]);

  useEffect(() => {
    load();
    const unsub = combatRepo.subscribe(tableId, load);
    return unsub;
  }, [tableId, load]);

  useEffect(() => {
    if (!isMaster) return;
    npcRepo
      .list()
      .then(setNpcs)
      .catch(() => {});
  }, [isMaster]);

  // Abre automaticamente para todos quando o combate está ativo.
  useEffect(() => {
    if (state?.active) setOpen(true);
  }, [state?.active]);

  const active = !!state?.active;
  const boss = state?.mode === "boss";

  // Combatentes já vêm ordenados por iniciativa (desc). O turno aponta o índice.
  const ordered = combatants;
  const turnIndex = state ? state.turnIndex % Math.max(1, ordered.length) : 0;
  const currentId = ordered[turnIndex]?.id ?? null;

  const playersInCombat = useMemo(
    () => new Set(combatants.filter((c) => c.refKind === "player").map((c) => c.refId)),
    [combatants],
  );

  async function startCombat() {
    // Traz automaticamente todos os jogadores da mesa como combatentes.
    for (const tc of tableChars) {
      if (playersInCombat.has(tc.character.id)) continue;
      const der = derivedStats(tc.character);
      await combatRepo.addCombatant(tableId, {
        name: tc.character.name || "Herói",
        imageUrl: tc.character.avatarUrl ?? null,
        side: "aliado",
        initiative: 0,
        hpCurrent: der.vida,
        hpMax: der.vida,
        refKind: "player",
        refId: tc.character.id,
      });
    }
    await combatRepo.setState(tableId, { active: true, round: 1, turnIndex: 0 });
    await load();
  }

  async function endCombat() {
    if (!confirm("Encerrar o combate? Os combatentes serão removidos.")) return;
    await combatRepo.setState(tableId, { active: false, round: 1, turnIndex: 0 });
    await combatRepo.clear(tableId);
    await load();
  }

  async function toggleMode() {
    await combatRepo.setState(tableId, { mode: boss ? "battle" : "boss" });
    await load();
  }

  async function rollInitiative() {
    // Rola d20 para cada combatente (jogadores somam Destreza/10 de bônus).
    for (const c of combatants) {
      let bonus = 0;
      if (c.refKind === "player") {
        const tc = tableChars.find((t) => t.character.id === c.refId);
        if (tc) bonus = Math.floor(effectiveAttributes(tc.character).destreza / 10);
      }
      const roll = 1 + Math.floor(Math.random() * 20) + bonus;
      await combatRepo.updateCombatant(c.id, { initiative: roll });
    }
    await combatRepo.setState(tableId, { round: 1, turnIndex: 0 });
    await load();
  }

  async function nextTurn() {
    if (ordered.length === 0) return;
    let idx = turnIndex + 1;
    let round = state?.round ?? 1;
    if (idx >= ordered.length) {
      idx = 0;
      round += 1;
    }
    await combatRepo.setState(tableId, { turnIndex: idx, round });
    await load();
  }

  async function addNpc(npc: Npc) {
    const sheet = npcSheet(npc);
    await combatRepo.addCombatant(tableId, {
      name: npc.name || "NPC",
      imageUrl: npc.imageUrl ?? null,
      side: npc.hostile ? "inimigo" : "aliado",
      initiative: 0,
      hpCurrent: sheet?.hpMax ?? 20,
      hpMax: sheet?.hpMax ?? 20,
      refKind: "npc",
      refId: npc.id,
    });
    await load();
  }

  async function addEnemy() {
    const name = enemyName.trim();
    if (!name) return;
    const hp = Number(enemyHp) || 20;
    await combatRepo.addCombatant(tableId, {
      name,
      side: "inimigo",
      initiative: 0,
      hpCurrent: hp,
      hpMax: hp,
      refKind: "manual",
    });
    setEnemyName("");
    setEnemyHp("20");
    await load();
  }

  if (!active && !isMaster) return null;

  const shellClass = active
    ? boss
      ? "border-red-600/70 bg-gradient-to-b from-red-950/40 to-void-950/60 shadow-[0_0_40px_-10px_rgba(220,38,38,0.6)]"
      : "border-orange-500/50 bg-gradient-to-b from-orange-950/25 to-void-950/60"
    : "border-white/10";

  return (
    <motion.div
      layout
      className={`card space-y-4 p-5 transition-colors ${shellClass}`}
      animate={boss && active ? { boxShadow: ["0 0 24px -8px rgba(220,38,38,0.5)", "0 0 44px -6px rgba(220,38,38,0.85)", "0 0 24px -8px rgba(220,38,38,0.5)"] } : {}}
      transition={{ duration: 1.6, repeat: boss && active ? Infinity : 0 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-display text-lg font-bold text-zinc-100"
        >
          <span className={active ? (boss ? "animate-pulse text-red-400" : "text-orange-400") : "text-zinc-400"}>
            {boss ? "☠️" : "⚔️"}
          </span>
          {active ? (boss ? "BOSS BATTLE" : "Modo Batalha") : "Modo Batalha"}
          {active && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
              Rodada {state?.round}
            </span>
          )}
          <span className="text-xs text-zinc-500">{open ? "▲" : "▼"}</span>
        </button>

        {isMaster && (
          <div className="flex flex-wrap gap-1">
            {!active ? (
              <button onClick={startCombat} className="btn-primary text-xs">
                ▶️ Iniciar combate
              </button>
            ) : (
              <>
                <button onClick={toggleMode} className="btn-ghost text-xs">
                  {boss ? "⚔️ Batalha" : "☠️ Boss"}
                </button>
                <button onClick={rollInitiative} className="btn-ghost text-xs">
                  🎲 Iniciativa
                </button>
                <button onClick={nextTurn} className="btn-primary text-xs">
                  ⏭️ Próximo turno
                </button>
                <button onClick={endCombat} className="btn-ghost text-xs text-red-400">
                  ⏹️ Encerrar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {open && (
        <>
          {isMaster && active && (
            <div className="flex flex-wrap items-center gap-2 border-y border-white/10 py-2">
              <span className="text-xs text-zinc-500">Adicionar:</span>
              <input
                value={enemyName}
                onChange={(e) => setEnemyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEnemy()}
                placeholder="Nome do inimigo"
                className="h-8 w-36 rounded bg-void-950/60 px-2 text-xs text-zinc-100"
              />
              <input
                value={enemyHp}
                onChange={(e) => setEnemyHp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEnemy()}
                type="number"
                title="Vida (máx.)"
                className="h-8 w-16 rounded bg-void-950/60 px-2 text-xs text-zinc-100"
              />
              <button onClick={addEnemy} className="btn-ghost text-xs">
                + Inimigo
              </button>
              {npcs.length > 0 && (
                <select
                  className="input h-8 max-w-[200px] text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    const npc = npcs.find((n) => n.id === e.target.value);
                    if (npc) addNpc(npc);
                    e.target.value = "";
                  }}
                >
                  <option value="">+ NPC da galeria…</option>
                  {npcs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name || "NPC"} {npcSheet(n) ? "🎲" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {ordered.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {active
                ? "Nenhum combatente ainda. Adicione inimigos ou NPCs acima."
                : isMaster
                ? "Inicie o combate para trazer os jogadores e organizar a iniciativa."
                : ""}
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {ordered.map((c, i) => (
                  <CombatantRow
                    key={c.id}
                    combatant={c}
                    isCurrent={active && c.id === currentId}
                    order={i + 1}
                    isMaster={isMaster}
                    onChange={load}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function CombatantRow({
  combatant: c,
  isCurrent,
  order,
  isMaster,
  onChange,
}: {
  combatant: Combatant;
  isCurrent: boolean;
  order: number;
  isMaster: boolean;
  onChange: () => void | Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [cond, setCond] = useState(c.conditions);
  const enemy = c.side === "inimigo";
  const hpPct = c.hpMax > 0 ? Math.max(0, Math.min(100, (c.hpCurrent / c.hpMax) * 100)) : 0;
  const down = c.hpCurrent <= 0;

  async function applyHp(delta: number) {
    const next = Math.max(0, Math.min(c.hpMax || 9999, c.hpCurrent + delta));
    await combatRepo.updateCombatant(c.id, { hpCurrent: next });
    setAmount("");
    await onChange();
  }

  async function saveCond() {
    await combatRepo.updateCombatant(c.id, { conditions: cond });
    await onChange();
  }

  async function setInitiative(v: number) {
    await combatRepo.updateCombatant(c.id, { initiative: v });
    await onChange();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: down ? 0.55 : 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`rounded-xl border p-3 ${
        isCurrent
          ? "border-sol/70 bg-sol/10 ring-1 ring-sol/40"
          : enemy
          ? "border-red-500/25 bg-red-950/10"
          : "border-white/10 bg-void-950/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex w-8 shrink-0 flex-col items-center">
          <span className="text-[10px] text-zinc-500">#{order}</span>
          {isMaster ? (
            <input
              type="number"
              value={c.initiative}
              onChange={(e) => setInitiative(Number(e.target.value) || 0)}
              className="w-10 rounded bg-void-950/60 text-center text-sm font-bold text-zinc-100"
              title="Iniciativa"
            />
          ) : (
            <span className="text-sm font-bold text-zinc-200">{c.initiative}</span>
          )}
        </div>

        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-void-950">
          {c.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg">{enemy ? "👹" : "🎭"}</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate font-semibold ${enemy ? "text-red-300" : "text-zinc-100"}`}>
              {c.name}
            </span>
            {isCurrent && <span className="text-[10px] font-bold text-sol">◀ turno</span>}
            {down && <span className="text-[10px] font-bold text-red-500">✖ caído</span>}
          </div>
          {/* Barra de vida */}
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-void-950">
              <div
                className={`h-full transition-all ${
                  hpPct > 50 ? "bg-emerald-500" : hpPct > 20 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-zinc-400">
              {c.hpCurrent}/{c.hpMax}
            </span>
          </div>
        </div>

        {isMaster && (
          <button
            onClick={async () => {
              await combatRepo.removeCombatant(c.id);
              await onChange();
            }}
            className="shrink-0 text-xs text-zinc-600 hover:text-red-400"
            title="Remover"
          >
            ✕
          </button>
        )}
      </div>

      {isMaster && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-16 rounded bg-void-950/60 px-2 py-1 text-sm text-zinc-100"
          />
          <button
            onClick={() => applyHp(-(Number(amount) || 0))}
            className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30"
          >
            − Dano
          </button>
          <button
            onClick={() => applyHp(Number(amount) || 0)}
            className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
          >
            + Cura
          </button>
          <input
            value={cond}
            onChange={(e) => setCond(e.target.value)}
            onBlur={saveCond}
            placeholder="condições (ex.: atordoado, sangrando)"
            className="min-w-[140px] flex-1 rounded bg-void-950/60 px-2 py-1 text-xs text-zinc-200"
          />
        </div>
      )}

      {c.conditions && (
        <div className="mt-1 flex flex-wrap gap-1">
          {c.conditions
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((cd, i) => (
              <span
                key={i}
                className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-200"
              >
                {cd}
              </span>
            ))}
        </div>
      )}
    </motion.div>
  );
}
