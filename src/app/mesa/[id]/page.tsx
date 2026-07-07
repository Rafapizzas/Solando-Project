"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Campaign,
  campaignRepo,
  characterRepo,
  tableRepo,
  TableMember,
  RollLog,
} from "@/lib/storage";
import { Character } from "@/lib/solando/character";
import { competencePoints, effectiveAttributes } from "@/lib/solando/character";
import { ATTRIBUTES, rankFor } from "@/lib/solando/rules";
import { RollResult, rollAttribute } from "@/lib/solando/dice";
import { DiceRoller } from "@/components/DiceRoller";
import { MesaAssistant } from "@/components/MesaAssistant";
import { useAuth } from "@/lib/auth";

const REACTIONS = ["🔥", "🎯", "😂", "💀", "❤️"];

export default function MesaRoomPage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth();
  const myId = user?.id ?? null;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<TableMember[]>([]);
  const [tableChars, setTableChars] = useState<Character[]>([]);
  const [myChars, setMyChars] = useState<Character[]>([]);
  const [rolls, setRolls] = useState<RollLog[]>([]);
  const [secretMode, setSecretMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const iAmMaster = !!myId && campaign?.ownerId === myId;
  const myMembership = members.find((m) => m.userId === myId) ?? null;
  const myCharacter =
    tableChars.find((c) => c.id === myMembership?.characterId) ?? null;

  const lastRoll = rolls[0]
    ? `${rolls[0].characterName} ${rolls[0].text}${
        rolls[0].result ? ` = ${rolls[0].result.total}` : ""
      }`
    : undefined;

  const loadRolls = useCallback(async () => {
    setRolls(await tableRepo.rolls(params.id));
  }, [params.id]);

  const loadTable = useCallback(async () => {
    const [c, mems, chars, mine] = await Promise.all([
      campaignRepo.get(params.id),
      tableRepo.members(params.id),
      tableRepo.charactersInTable(params.id),
      characterRepo.list(),
    ]);
    setCampaign(c ?? null);
    setMembers(mems);
    setTableChars(chars);
    setMyChars(mine);
  }, [params.id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadTable();
      await loadRolls();
      setLoading(false);
    })();
    const unsub = tableRepo.subscribe(params.id, () => {
      loadRolls();
      loadTable();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function chooseCharacter(charId: string) {
    await tableRepo.join(params.id, charId || null);
    await loadTable();
  }

  async function leaveTable() {
    if (!confirm("Sair desta mesa?")) return;
    await tableRepo.leave(params.id);
    await loadTable();
  }

  async function pushRoll(
    character: Character | null,
    text: string,
    result: RollResult,
    secret = false,
  ) {
    await tableRepo.addRoll({
      tableId: params.id,
      characterId: character?.id ?? null,
      characterName: character?.name || profile?.displayName || "Mesa",
      text,
      result,
      secret,
    });
    await loadRolls();
  }

  async function react(rollId: string, emoji: string) {
    await tableRepo.toggleReaction(rollId, emoji);
    await loadRolls();
  }

  if (loading) {
    return <div className="py-16 text-center text-zinc-500">Carregando mesa...</div>;
  }

  if (!campaign) {
    return (
      <div className="py-16 text-center text-zinc-500">
        Mesa não encontrada ou sem acesso.{" "}
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
          <p className="text-xs text-zinc-500">
            {iAmMaster ? "👑 Você é o mestre desta mesa" : "🎭 Você é jogador"}
            {myCharacter ? ` — jogando com ${myCharacter.name || "sem nome"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {iAmMaster && (
            <button
              onClick={() => setSecretMode((v) => !v)}
              className={`btn text-sm ${secretMode ? "btn-sol" : "btn-ghost"}`}
              title="Quando ativo, suas rolagens ficam ocultas para os jogadores"
            >
              {secretMode ? "👁️‍🗨️ Rolagem secreta: ON" : "👁️ Rolagem secreta: OFF"}
            </button>
          )}
          {myMembership && (
            <button onClick={leaveTable} className="btn-ghost text-sm text-red-400">
              Sair
            </button>
          )}
        </div>
      </div>

      {/* Entrar / escolher personagem */}
      <div className="card p-5">
        <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">
          {myMembership ? "Seu personagem nesta mesa" : "Entrar na mesa"}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input max-w-xs"
            value={myMembership?.characterId ?? ""}
            onChange={(e) => chooseCharacter(e.target.value)}
          >
            <option value="">
              {iAmMaster ? "— Mestrar sem personagem —" : "— Escolha um personagem —"}
            </option>
            {myChars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "Sem nome"}
              </option>
            ))}
          </select>
          {myChars.length === 0 && (
            <Link href="/ficha" className="text-sm text-mente-soft underline">
              Você ainda não tem fichas — criar uma
            </Link>
          )}
        </div>
        {members.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {members.map((m) => (
              <span
                key={m.userId}
                className="chip"
                title={m.role === "owner" ? "Mestre" : "Jogador"}
              >
                {m.role === "owner" ? "👑" : "🎭"} {m.displayName}
                {m.characterName ? ` · ${m.characterName}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">
              Personagens na mesa
            </h3>
            {tableChars.length === 0 && (
              <p className="text-sm text-zinc-500">
                Nenhum personagem escolhido ainda. Escolha o seu acima.
              </p>
            )}
            <div className="space-y-3">
              {tableChars.map((c) => (
                <PlayerRow
                  key={c.id}
                  character={c}
                  onRoll={(text, result) => pushRoll(c, text, result)}
                />
              ))}
            </div>
          </div>

          {/* Log de rolagens */}
          <div className="card p-5">
            <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">
              📜 Histórico de rolagens
            </h3>
            <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {rolls.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-3 ${
                      e.secret
                        ? "border-sol/30 bg-sol/5"
                        : "border-white/10 bg-void-950/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-semibold text-zinc-100">
                          {e.characterName}
                        </span>{" "}
                        <span className="text-zinc-400">{e.text}</span>
                        {e.secret && (
                          <span className="ml-1 text-[10px] text-sol-soft">
                            (secreto)
                          </span>
                        )}
                        {e.result && e.result.pool.length > 1 && (
                          <span className="ml-1 text-xs text-zinc-600">
                            [{e.result.pool.join(", ")}]
                          </span>
                        )}
                      </div>
                      {e.result && (
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
                      )}
                    </div>
                    {/* Reações */}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {REACTIONS.map((emoji) => {
                        const users = e.reactions[emoji] ?? [];
                        const mine = myId ? users.includes(myId) : false;
                        return (
                          <button
                            key={emoji}
                            onClick={() => react(e.id, emoji)}
                            className={`rounded-full border px-2 py-0.5 text-xs transition ${
                              mine
                                ? "border-sol/60 bg-sol/10 text-sol-soft"
                                : "border-white/10 text-zinc-500 hover:border-white/30"
                            }`}
                          >
                            {emoji}
                            {users.length > 0 && (
                              <span className="ml-1">{users.length}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {rolls.length === 0 && (
                <p className="text-sm text-zinc-500">
                  As rolagens da mesa aparecerão aqui em tempo real.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rolador livre */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <DiceRoller
            onRoll={(r) =>
              pushRoll(
                myCharacter,
                "rolou " + (r.label ?? ""),
                r,
                iAmMaster && secretMode,
              )
            }
          />
          <MesaAssistant lastRoll={lastRoll} />
        </aside>
      </div>
    </div>
  );
}

function PlayerRow({
  character,
  onRoll,
}: {
  character: Character;
  onRoll: (text: string, result: RollResult) => void;
}) {
  const comp = competencePoints(character);
  const eff = effectiveAttributes(character);

  function rollAttr(attrKey: (typeof ATTRIBUTES)[number]["key"], label: string) {
    const r = rollAttribute(eff[attrKey], 0, 0, label);
    if (r.falhaAbsoluta) {
      onRoll(`${label}: FALHA ABSOLUTA (Rank F)`, { ...r, total: 0 });
    } else {
      onRoll(`testou ${label}`, r);
    }
  }

  return (
    <div
      className="rounded-xl border border-white/10 bg-void-950/40 p-3"
      style={{ borderColor: `${character.accent}33` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg text-sm font-black text-void-950"
          style={{ background: character.accent }}
        >
          {character.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.avatarUrl}
              alt={character.name || "Avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            character.name.charAt(0).toUpperCase() || "?"
          )}
        </div>
        <span className="font-semibold text-zinc-100">
          {character.name || "Sem nome"}
        </span>
        <Link
          href={`/ficha/${character.id}/ver`}
          className="ml-auto text-xs text-mente-soft underline"
        >
          Ver ficha
        </Link>
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
