"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Npc,
  SceneEntity,
  SceneState,
  TableCharacter,
  npcRepo,
  sceneRepo,
} from "@/lib/storage";

/**
 * SceneStage — Palco/Cena da mesa (D11). O mestre define o cenário (imagem) e
 * controla QUEM está em cena agora (personagens, NPCs, objetos). Quem sai de
 * cena continua no "backlog" (já apareceu na sessão). Tudo ao vivo (realtime).
 */
export function SceneStage({
  tableId,
  isMaster,
  tableChars,
}: {
  tableId: string;
  isMaster: boolean;
  tableChars: TableCharacter[];
}) {
  const [scene, setScene] = useState<SceneState | null>(null);
  const [entities, setEntities] = useState<SceneEntity[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [title, setTitle] = useState("");
  const [bg, setBg] = useState("");
  const [editingScene, setEditingScene] = useState(false);

  const load = useCallback(async () => {
    const [s, e] = await Promise.all([sceneRepo.getState(tableId), sceneRepo.entities(tableId)]);
    setScene(s);
    setEntities(e);
    if (s) {
      setTitle(s.title);
      setBg(s.backgroundUrl ?? "");
    }
  }, [tableId]);

  useEffect(() => {
    load();
    const unsub = sceneRepo.subscribe(tableId, load);
    return unsub;
  }, [tableId, load]);

  useEffect(() => {
    if (!isMaster) return;
    npcRepo
      .list()
      .then(setNpcs)
      .catch(() => {});
  }, [isMaster]);

  const onStage = entities.filter((e) => e.onStage);
  const backlog = entities.filter((e) => !e.onStage);

  const entityRefs = new Set(entities.map((e) => e.refId).filter(Boolean));

  async function saveScene() {
    await sceneRepo.setState(tableId, { title: title.trim(), backgroundUrl: bg.trim() || null });
    setEditingScene(false);
    await load();
  }

  async function addPlayer(tc: TableCharacter) {
    if (entityRefs.has(tc.character.id)) return;
    await sceneRepo.addEntity(tableId, {
      kind: "personagem",
      name: tc.character.name || "Herói",
      imageUrl: tc.character.avatarUrl ?? null,
      refId: tc.character.id,
    });
    await load();
  }

  async function addNpc(npc: Npc) {
    await sceneRepo.addEntity(tableId, {
      kind: "npc",
      name: npc.name || "NPC",
      imageUrl: npc.imageUrl ?? null,
      refId: npc.id,
    });
    await load();
  }

  async function addObjeto() {
    const name = prompt("Nome do objeto/elemento em cena:");
    if (!name) return;
    await sceneRepo.addEntity(tableId, { kind: "objeto", name });
    await load();
  }

  // Sem palco definido e jogador comum não vê nada até o mestre montar a cena.
  if (!isMaster && !scene?.backgroundUrl && onStage.length === 0) return null;

  return (
    <div className="card overflow-hidden p-0">
      {/* Cenário */}
      <div className="relative min-h-[180px] w-full bg-void-950">
        {scene?.backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scene.backgroundUrl}
            alt={scene.title || "Cena"}
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-5xl opacity-30">🗺️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/40 to-transparent" />

        <div className="relative flex items-start justify-between gap-2 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-400">Cena atual</p>
            <h3 className="font-display text-xl font-black text-zinc-50 drop-shadow">
              {scene?.title || "Palco"}
            </h3>
          </div>
          {isMaster && (
            <button
              onClick={() => setEditingScene((v) => !v)}
              className="btn-ghost text-xs backdrop-blur"
            >
              🎬 Cenário
            </button>
          )}
        </div>

        {/* Quem está em cena agora */}
        <div className="relative flex flex-wrap gap-3 p-4 pt-0">
          <AnimatePresence initial={false}>
            {onStage.map((e) => (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-white/20 bg-void-950 shadow-lg">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.imageUrl} alt={e.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">
                      {e.kind === "personagem" ? "🎭" : e.kind === "npc" ? "🗿" : "📦"}
                    </div>
                  )}
                </div>
                <p className="mt-1 max-w-[64px] truncate text-center text-[10px] text-zinc-200">
                  {e.name}
                </p>
                {isMaster && (
                  <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
                    <button
                      onClick={() => sceneRepo.setOnStage(e.id, false).then(load)}
                      title="Tirar de cena (vai para o backlog)"
                      className="grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[10px] text-zinc-200"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => sceneRepo.removeEntity(e.id).then(load)}
                      title="Remover"
                      className="grid h-5 w-5 place-items-center rounded-full bg-red-600/80 text-[10px] text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {onStage.length === 0 && (
            <p className="text-sm text-zinc-400">
              {isMaster ? "Ninguém em cena. Traga personagens/NPCs abaixo." : "Aguardando a cena…"}
            </p>
          )}
        </div>
      </div>

      {/* Painel do mestre */}
      {isMaster && (
        <div className="space-y-3 border-t border-white/10 p-4">
          {editingScene && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-void-950/40 p-3">
              <input
                className="input w-full text-sm"
                placeholder="Título da cena (ex.: Taverna do Corvo)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="input w-full text-sm"
                placeholder="URL da imagem do cenário/mapa"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingScene(false)} className="btn-ghost text-xs">
                  Cancelar
                </button>
                <button onClick={saveScene} className="btn-primary text-xs">
                  Salvar cena
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Trazer para cena:</span>
            {tableChars.map((tc) => (
              <button
                key={tc.id}
                onClick={() => addPlayer(tc)}
                disabled={entityRefs.has(tc.character.id)}
                className="btn-ghost text-xs disabled:opacity-40"
              >
                🎭 {tc.character.name || "Herói"}
              </button>
            ))}
            {npcs.length > 0 && (
              <select
                className="input h-8 max-w-[180px] text-xs"
                defaultValue=""
                onChange={(e) => {
                  const npc = npcs.find((n) => n.id === e.target.value);
                  if (npc) addNpc(npc);
                  e.target.value = "";
                }}
              >
                <option value="">🗿 NPC…</option>
                {npcs.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name || "NPC"}
                  </option>
                ))}
              </select>
            )}
            <button onClick={addObjeto} className="btn-ghost text-xs">
              📦 Objeto
            </button>
          </div>

          {/* Backlog: quem já apareceu na sessão */}
          {backlog.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-void-950/30 p-3">
              <p className="mb-2 text-xs font-semibold text-zinc-400">
                🕐 Já apareceram nesta sessão ({backlog.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {backlog.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-void-950/50 py-0.5 pl-1 pr-2"
                  >
                    <div className="h-6 w-6 overflow-hidden rounded-full bg-void-950">
                      {e.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.imageUrl} alt={e.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs">
                          {e.kind === "personagem" ? "🎭" : e.kind === "npc" ? "🗿" : "📦"}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-300">{e.name}</span>
                    <button
                      onClick={() => sceneRepo.setOnStage(e.id, true).then(load)}
                      title="Trazer de volta para a cena"
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => sceneRepo.removeEntity(e.id).then(load)}
                      title="Remover do backlog"
                      className="text-xs text-zinc-600 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
