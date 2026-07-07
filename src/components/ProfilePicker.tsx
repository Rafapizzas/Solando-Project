"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AccountProfile,
  PROFILE_COLORS,
  PROFILE_EMOJIS,
  ProfileRole,
  useProfiles,
} from "@/lib/profiles";

/**
 * ProfilePicker — grade estilo "Netflix" para escolher, criar e editar perfis.
 * `manage` habilita editar/excluir; caso contrário, é só seleção (usado no gate).
 */
export function ProfilePicker({
  manage = false,
  onPicked,
}: {
  manage?: boolean;
  onPicked?: () => void;
}) {
  const { profiles, selectProfile, createProfile, updateProfile, removeProfile } =
    useProfiles();
  const [editing, setEditing] = useState<AccountProfile | null>(null);
  const [creating, setCreating] = useState(false);

  function pick(p: AccountProfile) {
    selectProfile(p.id);
    onPicked?.();
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-center gap-6">
        {profiles.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => pick(p)}
              className="grid h-24 w-24 place-items-center rounded-2xl text-4xl shadow-lg ring-2 ring-transparent transition hover:ring-white/60"
              style={{ background: p.color }}
              title={`Entrar como ${p.name}`}
            >
              <span className="drop-shadow">{p.emoji}</span>
            </motion.button>
            <div className="text-center">
              <div className="font-semibold text-zinc-100">{p.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                {p.role === "master" ? "👑 Mestre" : "🎭 Jogador"}
              </div>
            </div>
            {manage && (
              <div className="flex gap-2 text-[11px]">
                <button
                  onClick={() => setEditing(p)}
                  className="text-zinc-400 underline hover:text-zinc-200"
                >
                  editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir o perfil "${p.name}"?`)) removeProfile(p.id);
                  }}
                  className="text-red-400 underline hover:text-red-300"
                >
                  excluir
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Adicionar perfil */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-dashed border-white/20 text-4xl text-zinc-500 transition hover:border-white/50 hover:text-zinc-200"
            title="Adicionar perfil"
          >
            +
          </button>
          <div className="text-sm text-zinc-500">Adicionar</div>
        </div>
      </div>

      {(creating || editing) && (
        <ProfileForm
          initial={editing ?? undefined}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(data) => {
            if (editing) updateProfile(editing.id, data);
            else createProfile(data);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AccountProfile;
  onSave: (data: Omit<AccountProfile, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<ProfileRole>(initial?.role ?? "player");
  const [color, setColor] = useState(initial?.color ?? PROFILE_COLORS[0]);
  const [emoji, setEmoji] = useState(initial?.emoji ?? PROFILE_EMOJIS[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-void-900/90 p-5"
    >
      <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">
        {initial ? "Editar perfil" : "Novo perfil"}
      </h3>
      <label className="label">Nome</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex.: Rafa (Mestre)"
        className="input"
        maxLength={24}
      />

      <label className="label mt-3">Tipo de acesso</label>
      <div className="flex gap-2">
        <button
          onClick={() => setRole("player")}
          className={`btn flex-1 text-sm ${role === "player" ? "btn-primary" : "btn-ghost"}`}
        >
          🎭 Jogador
        </button>
        <button
          onClick={() => setRole("master")}
          className={`btn flex-1 text-sm ${role === "master" ? "btn-sol" : "btn-ghost"}`}
        >
          👑 Mestre
        </button>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">
        {role === "master"
          ? "Acesso de mestre: gerencia mesas e vê o painel do mestre."
          : "Acesso de jogador: cria fichas e joga nas mesas."}
      </p>

      <label className="label mt-3">Cor</label>
      <div className="flex flex-wrap gap-2">
        {PROFILE_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-8 w-8 rounded-full ring-2 ${color === c ? "ring-white" : "ring-transparent"}`}
            style={{ background: c }}
            aria-label={`Cor ${c}`}
          />
        ))}
      </div>

      <label className="label mt-3">Avatar</label>
      <div className="flex flex-wrap gap-2">
        {PROFILE_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`grid h-9 w-9 place-items-center rounded-lg text-xl ring-2 ${
              emoji === e ? "ring-white bg-white/10" : "ring-transparent bg-void-950/60"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1 text-sm">
          Cancelar
        </button>
        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), role, color, emoji })}
          disabled={!name.trim()}
          className="btn-primary flex-1 text-sm disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </motion.div>
  );
}
