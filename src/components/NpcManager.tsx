"use client";

import { useEffect, useRef, useState } from "react";
import { Npc, NpcInput, npcRepo, uploadNpcImage } from "@/lib/storage";

const EMPTY: NpcInput = {
  name: "",
  lore: "",
  objective: "",
  location: "",
  hostile: false,
  isGeneric: false,
};

/**
 * Biblioteca de NPCs do mestre: criar, editar, enviar imagem, classificar como
 * genérico/hostil, tornar público e reutilizar entre mesas.
 */
export function NpcManager() {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Npc | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "aliados" | "hostis" | "genericos">("todos");

  async function load() {
    setNpcs(await npcRepo.list());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = npcs.filter((n) => {
    if (query && !n.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "aliados") return !n.hostile;
    if (filter === "hostis") return n.hostile;
    if (filter === "genericos") return n.isGeneric;
    return true;
  });

  if (editing || creating) {
    return (
      <NpcForm
        npc={editing}
        onCancel={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={async () => {
          setEditing(null);
          setCreating(false);
          await load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input max-w-[200px]"
            placeholder="Buscar NPC..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            {(["todos", "aliados", "hostis", "genericos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn text-xs ${filter === f ? "btn-primary" : "btn-ghost"}`}
              >
                {f === "todos"
                  ? "Todos"
                  : f === "aliados"
                  ? "Aliados"
                  : f === "hostis"
                  ? "Hostis"
                  : "Genéricos"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">
          + Novo NPC
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-zinc-500">Carregando NPCs...</p>
      ) : visible.length === 0 ? (
        <div className="card grid place-items-center gap-2 py-14 text-center">
          <span className="text-4xl">🗿</span>
          <p className="text-zinc-400">
            {npcs.length === 0
              ? "Nenhum NPC ainda. Crie o primeiro para sua galeria."
              : "Nenhum NPC corresponde ao filtro."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((npc) => (
            <NpcLibraryCard
              key={npc.id}
              npc={npc}
              onEdit={() => setEditing(npc)}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NpcLibraryCard({
  npc,
  onEdit,
  onChanged,
}: {
  npc: Npc;
  onEdit: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function togglePublic() {
    setBusy(true);
    try {
      await npcRepo.setPublic(npc.id, !npc.isPublic);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Excluir "${npc.name || "NPC"}" da sua galeria?`)) return;
    setBusy(true);
    try {
      await npcRepo.remove(npc.id);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="card-vibe ink-panel flex flex-col overflow-hidden p-0"
      style={{ borderColor: npc.hostile ? "#ef444455" : undefined }}
    >
      <div className="relative aspect-video w-full bg-void-950/60">
        {npc.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={npc.imageUrl} alt={npc.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🗿</div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <span className={`chip text-[10px] ${npc.hostile ? "text-red-300" : "text-emerald-300"}`}>
            {npc.hostile ? "⚔️ Hostil" : "🕊️ Aliado"}
          </span>
          {npc.isGeneric && <span className="chip text-[10px]">Genérico</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-bold text-zinc-100">{npc.name || "Sem nome"}</h3>
        {npc.location && <p className="text-xs text-mente-soft">📍 {npc.location}</p>}
        {npc.objective && (
          <p className="line-clamp-2 text-xs text-zinc-500">🎯 {npc.objective}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <button onClick={onEdit} className="btn-ghost text-xs">
            Editar
          </button>
          <button onClick={togglePublic} disabled={busy} className="btn-ghost text-xs">
            {npc.isPublic ? "🌐 Público" : "🔒 Privado"}
          </button>
          <button onClick={remove} disabled={busy} className="btn-ghost text-xs text-red-400">
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

function NpcForm({
  npc,
  onCancel,
  onSaved,
}: {
  npc: Npc | null;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<NpcInput>(
    npc
      ? {
          name: npc.name,
          lore: npc.lore,
          objective: npc.objective,
          location: npc.location,
          hostile: npc.hostile,
          isGeneric: npc.isGeneric,
        }
      : { ...EMPTY },
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(npc?.imageUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // ID garantido para nomear a imagem antes mesmo de salvar (NPC novo).
  const draftId = useRef(npc?.id ?? crypto.randomUUID());

  function set<K extends keyof NpcInput>(key: K, value: NpcInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadNpcImage(draftId.current, file);
      setImageUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const patch: NpcInput = { ...form, imageUrl };
      if (npc) await npcRepo.update(npc.id, patch);
      else await npcRepo.create(patch);
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-zinc-100">
          {npc ? "Editar NPC" : "Novo NPC"}
        </h3>
        <button onClick={onCancel} className="btn-ghost text-sm">
          ← Voltar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-void-950/60">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="NPC" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl">🗿</div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickImage(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-ghost w-full text-sm"
          >
            {uploading ? "Enviando..." : imageUrl ? "Trocar imagem" : "Enviar imagem"}
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">Nome</span>
            <input
              className="input w-full"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nome do NPC"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">Localização</span>
            <input
              className="input w-full"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Onde é encontrado"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-400">Objetivo</span>
            <input
              className="input w-full"
              value={form.objective ?? ""}
              onChange={(e) => set("objective", e.target.value)}
              placeholder="O que o NPC quer"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={!!form.hostile}
                onChange={(e) => set("hostile", e.target.checked)}
              />
              ⚔️ Hostil
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={!!form.isGeneric}
                onChange={(e) => set("isGeneric", e.target.checked)}
              />
              Genérico (figurante reutilizável)
            </label>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-zinc-400">História / background (privado do mestre)</span>
        <textarea
          className="input min-h-[120px] w-full"
          value={form.lore ?? ""}
          onChange={(e) => set("lore", e.target.value)}
          placeholder="A história do NPC — só você (mestre) vê isto."
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost text-sm">
          Cancelar
        </button>
        <button onClick={save} disabled={saving || uploading} className="btn-primary text-sm">
          {saving ? "Salvando..." : "Salvar NPC"}
        </button>
      </div>
    </div>
  );
}
