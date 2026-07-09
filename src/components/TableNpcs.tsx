"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Npc,
  TableNpc,
  npcRepo,
  npcNoteRepo,
  tableNpcRepo,
} from "@/lib/storage";

/**
 * NPCs presentes na mesa. O mestre coloca NPCs da sua galeria (os jogadores
 * veem apenas nome + imagem — nunca história/objetivo/status). Cada jogador
 * pode anotar livremente no card (fraquezas, como se conheceram, etc.).
 */
export function TableNpcs({
  tableId,
  isMaster,
  npcs,
  onChange,
}: {
  tableId: string;
  isMaster: boolean;
  npcs: TableNpc[];
  onChange: () => void | Promise<void>;
}) {
  const [library, setLibrary] = useState<Npc[]>([]);
  const [picking, setPicking] = useState(false);

  const loadLibrary = useCallback(async () => {
    if (!isMaster) return;
    setLibrary(await npcRepo.list());
  }, [isMaster]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  async function place(npc: Npc) {
    await tableNpcRepo.add(tableId, npc);
    setPicking(false);
    await onChange();
  }

  async function removeCard(id: string) {
    if (!confirm("Remover este NPC da mesa? As anotações dos jogadores serão apagadas.")) return;
    await tableNpcRepo.remove(id);
    await onChange();
  }

  const placedIds = new Set(npcs.map((n) => n.npcId));

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-zinc-100">🗿 NPCs na mesa</h3>
        {isMaster && (
          <button
            onClick={() => {
              setPicking((v) => !v);
              loadLibrary();
            }}
            className="btn-ghost text-sm"
          >
            {picking ? "Fechar" : "+ Colocar NPC"}
          </button>
        )}
      </div>

      {isMaster && picking && (
        <div className="mb-4 rounded-xl border border-white/10 bg-void-950/40 p-3">
          {library.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Sua galeria está vazia.{" "}
              <a href="/npcs" className="text-mente-soft underline">
                Criar NPCs
              </a>
            </p>
          ) : (
            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {library.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => place(npc)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 p-2 text-left transition hover:border-mente/40"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-void-950/60 text-sm">
                    {npc.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={npc.imageUrl} alt={npc.name} className="h-full w-full object-cover" />
                    ) : (
                      "🗿"
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-200">
                      {npc.name || "Sem nome"}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {npc.hostile ? "⚔️ Hostil" : "🕊️ Aliado"}
                      {placedIds.has(npc.id) ? " · já na mesa" : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {npcs.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {isMaster
            ? "Nenhum NPC na mesa. Coloque personagens do mundo para os jogadores conhecerem."
            : "O mestre ainda não apresentou nenhum NPC."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {npcs.map((npc) => (
            <NpcMesaCard
              key={npc.id}
              npc={npc}
              isMaster={isMaster}
              onRemove={() => removeCard(npc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NpcMesaCard({
  npc,
  isMaster,
  onRemove,
}: {
  npc: TableNpc;
  isMaster: boolean;
  onRemove: () => void;
}) {
  const [openNotes, setOpenNotes] = useState(false);
  const [note, setNote] = useState("");
  const [loadedNote, setLoadedNote] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function openNoteEditor() {
    setOpenNotes((v) => !v);
    if (!loadedNote) {
      setNote(await npcNoteRepo.get(npc.id));
      setLoadedNote(true);
    }
  }

  function onNoteChange(value: string) {
    setNote(value);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await npcNoteRepo.save(npc.id, value);
      setSaved(true);
    }, 700);
  }

  return (
    <article
      className="ink-panel flex flex-col overflow-hidden rounded-xl border border-white/10"
      style={{ borderColor: npc.hostile ? "#ef444455" : undefined }}
    >
      <div className="relative aspect-square w-full bg-void-950/60">
        {npc.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={npc.imageUrl} alt={npc.displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🗿</div>
        )}
        {npc.hostile && (
          <span className="absolute right-2 top-2 chip text-[10px] text-red-300">⚔️</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h4 className="truncate font-display text-sm font-bold text-zinc-100">
          {npc.displayName || "???"}
        </h4>
        <div className="mt-auto flex gap-1">
          <button onClick={openNoteEditor} className="btn-ghost flex-1 text-xs">
            📝 Anotações
          </button>
          {isMaster && (
            <button onClick={onRemove} className="btn-ghost text-xs text-red-400">
              🗑️
            </button>
          )}
        </div>
        {openNotes && (
          <div className="space-y-1">
            <textarea
              className="input min-h-[80px] w-full text-xs"
              placeholder="Fraquezas, como se conheceram, suspeitas..."
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
            <p className="text-right text-[10px] text-zinc-600">
              {saved ? "salvo ✓" : "anotação privada sua"}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
