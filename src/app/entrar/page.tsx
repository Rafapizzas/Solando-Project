"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function EntrarPage() {
  const router = useRouter();
  const {
    profile,
    configured,
    isAuthenticated,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    signOut,
  } = useAuth();
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function withBusy(fn: () => Promise<string | null>, onOk?: () => void) {
    setError(null);
    setInfo(null);
    setBusy(true);
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    else onOk?.();
  }

  function submit() {
    if (mode === "entrar") {
      withBusy(() => signInWithPassword(email.trim(), password), () => router.push("/mestre"));
    } else {
      withBusy(
        () => signUp(email.trim(), password, name),
        () => setInfo("Conta criada! Confirme pelo e-mail (se exigido) e entre."),
      );
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card relative overflow-hidden p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mente/20 blur-3xl" />
        <h1 className="mb-1 font-display text-3xl font-black title-gradient">
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Uma conta só: você mestra suas mesas e joga nas dos outros.
        </p>

        {!configured && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
            ⚠ Supabase não configurado. Verifique o arquivo <code>.env.local</code>.
          </div>
        )}

        {isAuthenticated && profile ? (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-void-950/50 p-3 text-sm">
            <span className="flex items-center gap-2 text-zinc-300">
              {profile.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
              )}
              Conectado como <b>{profile.displayName}</b>
            </span>
            <button className="text-xs text-red-400 hover:underline" onClick={() => signOut()}>
              sair
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn-ghost mb-4 w-full"
              disabled={busy || !configured}
              onClick={() => withBusy(signInWithGoogle)}
            >
              <span className="mr-1 text-base">🟦</span> Continuar com Google
            </button>

            <div className="mb-4 flex items-center gap-3 text-xs text-zinc-600">
              <span className="h-px flex-1 bg-white/10" /> ou <span className="h-px flex-1 bg-white/10" />
            </div>

            {mode === "cadastrar" && (
              <>
                <label className="label">Seu nome</label>
                <input
                  className="input mb-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como te chamam na mesa?"
                />
              </>
            )}

            <label className="label">E-mail</label>
            <input
              className="input mb-3"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />

            <label className="label">Senha</label>
            <input
              className="input mb-4"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            {error && <p className="mb-3 text-sm text-red-400">⚠ {error}</p>}
            {info && <p className="mb-3 text-sm text-emerald-400">✓ {info}</p>}

            <button className="btn-primary w-full" disabled={busy || !configured} onClick={submit}>
              {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
            </button>

            <button
              className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
              onClick={() => {
                setMode(mode === "entrar" ? "cadastrar" : "entrar");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "entrar"
                ? "Não tem conta? Criar uma agora"
                : "Já tem conta? Entrar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
