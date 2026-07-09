"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { accountRepo, uploadUserAvatar, type Account } from "@/lib/storage";

export default function ContaPage() {
  const { isAuthenticated, ready, profile } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const acc = await accountRepo.get();
      if (acc) {
        setAccount(acc);
        setName(acc.displayName);
        setAvatarUrl(acc.avatarUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar a conta.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && isAuthenticated) void load();
  }, [ready, isAuthenticated, load]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await accountRepo.update({ displayName: name.trim() || "Aventureiro", avatarUrl });
      setFlash("Conta atualizada!");
      setTimeout(() => setFlash(null), 2500);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadUserAvatar(file);
      setAvatarUrl(url);
      await accountRepo.update({ avatarUrl: url });
      setFlash("Foto atualizada!");
      setTimeout(() => setFlash(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function copyCode() {
    if (!account?.friendCode) return;
    void navigator.clipboard?.writeText(account.friendCode);
    setFlash("Código copiado!");
    setTimeout(() => setFlash(null), 2000);
  }

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-black title-gradient">Sua conta</h1>
        <p className="text-zinc-400">Entre na sua conta para gerenciá-la.</p>
        <Link href="/entrar" className="btn-primary inline-block">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="manga-title text-3xl font-black title-gradient">Sua conta</h1>
        <p className="mt-2 text-zinc-400">
          Ajuste seu nome, foto e compartilhe seu código de amigo.
        </p>
      </div>

      {flash && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-center text-sm text-emerald-300">
          {flash}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="card space-y-6 p-6">
        {/* Avatar */}
        <div className="flex flex-wrap items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Sua foto"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-mente/40"
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-mente/20 text-3xl">
              🧙
            </span>
          )}
          <div className="space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              {uploading ? "Enviando…" : "📷 Trocar foto"}
            </button>
            <p className="text-xs text-zinc-500">PNG/JPG até 5 MB.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-mente-soft">
            Nome de exibição
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Como querem te chamar na mesa"
            className="w-full rounded-lg border border-white/10 bg-void-950/60 px-3 py-2 text-zinc-100 outline-none focus:border-mente/50"
          />
        </div>

        {/* E-mail (somente leitura) */}
        {profile?.email && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              E-mail (login)
            </label>
            <p className="rounded-lg border border-white/10 bg-void-950/40 px-3 py-2 text-sm text-zinc-400">
              {profile.email}
            </p>
          </div>
        )}

        <button onClick={save} disabled={saving || loading} className="btn-primary">
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>

      {/* Código de amigo */}
      <div className="card space-y-3 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-sol-soft">
          Seu código de amigo
        </p>
        <p className="text-sm text-zinc-400">
          Compartilhe este código para as pessoas te adicionarem como amigo.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-sol/30 bg-sol/10 px-4 py-2 font-mono text-lg tracking-widest text-sol-soft">
            {loading ? "…" : account?.friendCode || "—"}
          </code>
          <button
            onClick={copyCode}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            Copiar
          </button>
        </div>
        <Link href="/amigos" className="inline-block text-sm text-mente-soft underline">
          Ir para Amigos →
        </Link>
      </div>
    </div>
  );
}
