"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Campaign, campaignRepo, characterRepo } from "@/lib/storage";
import { Character } from "@/lib/solando/character";
import { competencePoints, effectiveAttributes } from "@/lib/solando/character";
import { ATTRIBUTES, rankFor } from "@/lib/solando/rules";
import { RollResult, rollAttribute } from "@/lib/solando/dice";
import { DiceRoller } from "@/components/DiceRoller";
import { useAuth } from "@/lib/auth";

interface LogEntry {
  id: string;
  who: string;
  text: string;
  result: RollResult;
  time: number;
  secret?: boolean;
}

export default function MesaRoomPage({ params }: { params: { id: string } }) {
  const { profile } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [allChars, setAllChars] = useState<Character[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [secretMode, setSecretMode] = useState(false);
  // TODO(fase Supabase): derivar do dono da mesa. Por ora, controle local.
  const [iAmMaster, setIAmMaster] = useState(true);

  async function load() {
    const c = await campaignRepo.get(params.id);
    setCampaign(c ?? null);
    setAllChars(await characterRepo.list());
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const members = allChars.filter((c) => campaign?.characterIds.includes(c.id));
  const outsiders = allChars.filter((c) => !campaign?.characterIds.includes(c.id));

  async function addChar(id: string) {
    if (!campaign) return;
    const updated = {
      ...campaign,
      characterIds: [...campaign.characterIds, id],
    };
    await campaignRepo.save(updated);
    setCampaign(updated);
  }
  async function removeChar(id: string) {
    if (!campaign) return;
    const updated = {
      ...campaign,
      characterIds: campaign.characterIds.filter((x) => x !== id),
    };
    await campaignRepo.save(updated);
    setCampaign(updated);
  }

  function pushLog(who: string, text: string, result: RollResult, secret = false) {
    setLog((prev) =>
      [
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          who,
          text,
          result,
          time: Date.now(),
          secret,
        },
        ...prev,
      ].slice(0, 40),
    );
  }

  if (!campaign) {
    return (
      <div className="py-16 text-center text-zinc-500">
        Mesa não encontrada.{" "}
        <Link href="/mesa" className="text-mente-soft underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/mesa" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Mesas
          </Link>
          <h1 className="text-3xl font-black title-gradient">{campaign.name}</h1>
          {profile && (
            <p className="text-xs text-zinc-500">
              na mesa como {iAmMaster ? "👑 Mestre" : "🎭"} {profile.displayName}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIAmMaster((v) => !v)}
            className={`btn text-sm ${iAmMaster ? "btn-sol" : "btn-ghost"}`}
            title="Alterna entre a visão de mestre e a de jogador"
          >
            {iAmMaster ? "👑 Sou o mestre" : "🎭 Sou jogador"}
          </button>
          {iAmMaster && (
            <button
              onClick={() => setSecretMode((v) => !v)}
              className={`btn text-sm ${secretMode ? "btn-sol" : "btn-ghost"}`}
              title="Quando ativo, suas rolagens ficam ocultas para os jogadores"
            >
              {secretMode ? "👁️‍🗨️ Rolagem secreta: ON" : "👁️ Rolagem secreta: OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Jogadores + rolagens rápidas */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">
              Jogadores na mesa
            </h3>
            {members.length === 0 && (
              <p className="text-sm text-zinc-500">
                Nenhum personagem na mesa. Adicione abaixo.
              </p>
            )}
            <div className="space-y-3">
              {members.map((c) => (
                <PlayerRow
                  key={c.id}
                  character={c}
                  onRoll={pushLog}
                  onRemove={() => removeChar(c.id)}
                />
              ))}
            </div>

            {outsiders.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs text-zinc-500">Adicionar personagem:</p>
                <div className="flex flex-wrap gap-2">
                  {outsiders.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addChar(c.id)}
                      className="chip hover:border-sol/60 hover:text-sol-soft"
                    >
                      + {c.name || "Sem nome"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Log de rolagens */}
          <div className="card p-5">
            <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">
              📜 Histórico de rolagens
            </h3>
            <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {log.map((e) => {
                  const hidden = e.secret && !iAmMaster;
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        e.secret
                          ? "border-sol/30 bg-sol/5"
                          : "border-white/10 bg-void-950/40"
                      }`}
                    >
                      {hidden ? (
                        <div className="text-sm text-sol-soft">
                          🔮 O Mestre rolou em segredo...
                        </div>
                      ) : (
                        <>
                          <div className="text-sm">
                            <span className="font-semibold text-zinc-100">{e.who}</span>{" "}
                            <span className="text-zinc-400">{e.text}</span>
                            {e.secret && <span className="ml-1 text-[10px] text-sol-soft">(secreto)</span>}
                            {e.result.pool.length > 1 && (
                              <span className="ml-1 text-xs text-zinc-600">
                                [{e.result.pool.join(", ")}]
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xl font-black ${
                              e.result.crit === "critico"
                                ? "text-sol"
                                : e.result.crit === "falha-critica"
                                ? "text-red-500"
                                : "text-zinc-100"
                            }`}
                          >
                            {e.result.total}
                          </span>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {log.length === 0 && (
                <p className="text-sm text-zinc-500">
                  As rolagens da mesa aparecerão aqui.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rolador livre */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <DiceRoller
            onRoll={(r) =>
              pushLog(
                iAmMaster && secretMode ? "👑 Mestre" : profile?.displayName ?? "Mesa",
                "rolou " + (r.label ?? ""),
                r,
                iAmMaster && secretMode,
              )
            }
          />
        </aside>
      </div>
    </div>
  );
}

function PlayerRow({
  character,
  onRoll,
  onRemove,
}: {
  character: Character;
  onRoll: (who: string, text: string, result: RollResult) => void;
  onRemove: () => void;
}) {
  const comp = competencePoints(character);
  const eff = effectiveAttributes(character);

  function rollAttr(attrKey: (typeof ATTRIBUTES)[number]["key"], label: string) {
    const r = rollAttribute(eff[attrKey], 0, 0, label);
    if (r.falhaAbsoluta) {
      onRoll(character.name || "Jogador", `${label}: FALHA ABSOLUTA (Rank F)`, {
        ...r,
        total: 0,
      });
    } else {
      onRoll(character.name || "Jogador", `testou ${label}`, r);
    }
  }

  return (
    <div
      className="rounded-xl border border-white/10 bg-void-950/40 p-3"
      style={{ borderColor: `${character.accent}33` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-void-950"
            style={{ background: character.accent }}
          >
            {character.name.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="font-semibold text-zinc-100">
            {character.name || "Sem nome"}
          </span>
        </div>
        <button className="text-xs text-zinc-500 hover:text-red-400" onClick={onRemove}>
          remover
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ATTRIBUTES.map((a) => {
          const rank = rankFor(eff[a.key]);
          return (
            <button
              key={a.key}
              onClick={() => rollAttr(a.key, a.label)}
              className={`rounded-lg border px-2 py-1 text-xs font-medium transition hover:bg-white/10 ${rank.ring}/30 border-white/10`}
              title={`${a.label} (Rank ${rank.rank})`}
            >
              {a.short}
              <span className={`ml-1 ${rank.color}`}>{rank.rank}</span>
            </button>
          );
        })}
      </div>
      {comp > 0 && (
        <p className="mt-2 text-[10px] text-zinc-500">
          {comp} competência(s) disponível(is) — some +10/nível manualmente no modificador.
        </p>
      )}
    </div>
  );
}
