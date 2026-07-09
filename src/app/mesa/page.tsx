"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Campaign, campaignRepo, invitesRepo } from "@/lib/storage";

export default function MesasPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-zinc-500">Carregando…</div>}>
      <MesasView />
    </Suspense>
  );
}

function MesasView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setCampaigns(await campaignRepo.list());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const redeem = useCallback(
    async (raw: string) => {
      const clean = raw.trim();
      if (!clean) return;
      setJoining(true);
      setError(null);
      const result = await invitesRepo.redeem(clean);
      setJoining(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCode("");
      router.push(`/mesa/${result.tableId}`);
    },
    [router],
  );

  // Resgata convite vindo por link (?convite=CODE).
  useEffect(() => {
    const invite = searchParams.get("convite");
    if (invite) void redeem(invite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    if (!name.trim()) return;
    const c = await campaignRepo.create({ name: name.trim() });
    setName("");
    setFlash("Mesa criada! Convide seus jogadores dentro dela.");
    setTimeout(() => setFlash(null), 3000);
    load();
    router.push(`/mesa/${c.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta mesa?")) return;
    await campaignRepo.remove(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Mesas</h1>
        <p className="mt-1 text-zinc-400">
          Crie salas de campanha e role os dados com sua mesa.
        </p>
      </div>

      {flash && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {flash}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card flex flex-wrap items-end gap-3 p-5">
          <div className="flex-1">
            <label className="label">Nome da nova mesa</label>
            <input
              className="input"
              value={name}
              placeholder="Ex.: A Queda de Solando"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>
          <button className="btn-sol" onClick={create}>
            + Criar mesa
          </button>
        </div>

        <div className="card flex flex-wrap items-end gap-3 p-5">
          <div className="flex-1">
            <label className="label">Entrar por convite</label>
            <input
              className="input"
              value={code}
              placeholder="Código do convite"
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && redeem(code)}
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => redeem(code)}
            disabled={joining || !code.trim()}
          >
            {joining ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </div>

      {campaigns === null ? (
        <div className="py-16 text-center text-zinc-500">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center">
          <span className="text-5xl">🎲</span>
          <p className="text-zinc-400">Nenhuma mesa ainda. Crie uma ou entre por convite.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card-glow flex flex-col p-5">
              <h3 className="font-display text-lg font-bold text-zinc-100">
                {c.name}
              </h3>
              <p className="mt-1 flex-1 text-sm text-zinc-500">
                {c.characterIds.length} personagem(ns)
              </p>
              <div className="mt-4 flex gap-2">
                <Link href={`/mesa/${c.id}`} className="btn-primary flex-1 text-sm">
                  Entrar
                </Link>
                <button
                  className="btn-ghost !px-3 text-red-400"
                  onClick={() => remove(c.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
