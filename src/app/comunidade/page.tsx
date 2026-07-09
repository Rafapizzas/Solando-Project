"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CustomClass,
  CustomRace,
  getCustomClasses,
  getCustomRaces,
  hydrateSharedContent,
  saveCustomClass,
  saveCustomRace,
} from "@/lib/solando/customContent";
import {
  getSharedSkills,
  hydrateSharedSkills,
  type SharedSkill,
} from "@/lib/solando/sharedSkills";
import { Npc, npcRepo } from "@/lib/storage";

/**
 * Comunidade — vitrine do conteúdo compartilhado (raças e classes públicas
 * criadas por qualquer pessoa). Permite "adotar" uma criação para a sua conta.
 * O conteúdo público vem do Supabase (RLS: leitura pública de is_public).
 */
export default function ComunidadePage() {
  const [tab, setTab] = useState<"racas" | "classes" | "skills" | "npcs">("racas");
  const [races, setRaces] = useState<CustomRace[]>([]);
  const [classes, setClasses] = useState<CustomClass[]>([]);
  const [skills, setSkills] = useState<SharedSkill[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [adopted, setAdopted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const [, , publicNpcs] = await Promise.all([
        hydrateSharedContent(),
        hydrateSharedSkills(),
        npcRepo.publicList().catch(() => [] as Npc[]),
      ]);
      if (!alive) return;
      setRaces(getCustomRaces());
      setClasses(getCustomClasses());
      setSkills(getSharedSkills());
      setNpcs(publicNpcs);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function adoptNpc(n: Npc) {
    await npcRepo.importPublic(n);
    setAdopted((a) => ({ ...a, [`n-${n.id}`]: true }));
  }

  function adoptRace(r: CustomRace) {
    saveCustomRace(r);
    setAdopted((a) => ({ ...a, [`r-${r.id}`]: true }));
  }
  function adoptClass(c: CustomClass) {
    saveCustomClass(c);
    setAdopted((a) => ({ ...a, [`c-${c.id}`]: true }));
  }

  const count =
    tab === "racas"
      ? races.length
      : tab === "classes"
      ? classes.length
      : tab === "skills"
      ? skills.length
      : npcs.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="manga-title text-3xl font-black title-gradient">Comunidade</h1>
        <p className="mt-2 text-zinc-400">
          Explore raças e classes criadas pela comunidade — e adote as que gostar para
          usar nas suas fichas.
        </p>
        <Link href="/criar" className="btn-primary mt-4 inline-block text-sm">
          + Criar e compartilhar a sua
        </Link>
      </div>

      <div className="flex justify-center gap-2">
        <button
          className={`btn text-sm ${tab === "racas" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("racas")}
        >
          🧬 Raças
        </button>
        <button
          className={`btn text-sm ${tab === "classes" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("classes")}
        >
          ⚔️ Classes
        </button>
        <button
          className={`btn text-sm ${tab === "skills" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("skills")}
        >
          🔮 Habilidades
        </button>
        <button
          className={`btn text-sm ${tab === "npcs" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("npcs")}
        >
          🗿 NPCs
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500">Carregando criações…</div>
      ) : count === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-zinc-400">
            Nenhuma criação compartilhada ainda. Seja o primeiro!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tab === "racas"
            ? races.map((r) => (
                <article key={r.id} className="card-vibe ink-panel flex flex-col p-5">
                  <h3 className="font-display text-lg font-bold text-zinc-100">
                    🧬 {r.name}
                  </h3>
                  <p className="mt-2 line-clamp-4 text-sm text-zinc-400">{r.lore}</p>
                  {r.abilities && (
                    <p className="mt-2 text-xs">
                      <b className="text-emerald-400">Habilidades:</b>{" "}
                      <span className="text-zinc-300">{r.abilities}</span>
                    </p>
                  )}
                  <button
                    onClick={() => adoptRace(r)}
                    disabled={adopted[`r-${r.id}`]}
                    className="btn-ghost mt-auto pt-3 text-sm disabled:opacity-50"
                  >
                    {adopted[`r-${r.id}`] ? "✓ Adotada" : "Adotar"}
                  </button>
                </article>
              ))
            : tab === "classes"
            ? classes.map((c) => (
                <article key={c.id} className="card-vibe ink-panel flex flex-col p-5">
                  <h3 className="font-display text-lg font-bold text-zinc-100">
                    ⚔️ {c.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">{c.role}</p>
                  <p className="mt-2 line-clamp-4 text-sm text-zinc-400">{c.level0}</p>
                  <button
                    onClick={() => adoptClass(c)}
                    disabled={adopted[`c-${c.id}`]}
                    className="btn-ghost mt-auto pt-3 text-sm disabled:opacity-50"
                  >
                    {adopted[`c-${c.id}`] ? "✓ Adotada" : "Adotar"}
                  </button>
                </article>
              ))
            : tab === "skills"
            ? skills.map((s) => (
                <article key={s.slug} className="card-vibe ink-panel flex flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-zinc-100">
                      🔮 {s.name}
                    </h3>
                    <span className="chip text-xs">
                      {s.passive ? "Passiva" : `${s.cost} Entr.`}
                    </span>
                  </div>
                  {s.area && (
                    <p className="mt-1 text-xs text-mente-soft">Área: {s.area}</p>
                  )}
                  <p className="mt-2 line-clamp-4 text-sm text-zinc-400">
                    {s.description}
                  </p>
                  <p className="mt-auto pt-3 text-xs text-zinc-500">
                    {s.author ? `por ${s.author}` : "Comunidade"} · importe no criador de
                    habilidades da ficha (Grimório).
                  </p>
                </article>
              ))
            : npcs.map((n) => (
                <article key={n.id} className="card-vibe ink-panel flex flex-col overflow-hidden p-0">
                  <div className="relative aspect-video w-full bg-void-950/60">
                    {n.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.imageUrl} alt={n.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-4xl">🗿</div>
                    )}
                    <span
                      className={`absolute left-2 top-2 chip text-[10px] ${
                        n.hostile ? "text-red-300" : "text-emerald-300"
                      }`}
                    >
                      {n.hostile ? "⚔️ Hostil" : "🕊️ Aliado"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-display text-lg font-bold text-zinc-100">
                      🗿 {n.name || "Sem nome"}
                    </h3>
                    {n.location && <p className="text-xs text-mente-soft">📍 {n.location}</p>}
                    {n.lore && (
                      <p className="line-clamp-3 text-sm text-zinc-400">{n.lore}</p>
                    )}
                    <p className="text-[11px] text-zinc-600">
                      {n.authorName ? `por ${n.authorName}` : "Comunidade"}
                    </p>
                    <button
                      onClick={() => adoptNpc(n)}
                      disabled={adopted[`n-${n.id}`]}
                      className="btn-ghost mt-auto pt-3 text-sm disabled:opacity-50"
                    >
                      {adopted[`n-${n.id}`] ? "✓ Na sua galeria" : "Adotar NPC"}
                    </button>
                  </div>
                </article>
              ))}
        </div>
      )}

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-zinc-100">
            💬 Discussão da comunidade
          </h3>
          <p className="text-sm text-zinc-400">
            Debata balanceamento, sugira ajustes e comente as criações no mural.
          </p>
        </div>
        <Link href="/feedback" className="btn-primary text-sm">
          Ir ao mural
        </Link>
      </div>
    </div>
  );
}
