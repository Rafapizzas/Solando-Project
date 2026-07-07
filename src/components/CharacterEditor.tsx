"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Character, newCharacter } from "@/lib/solando/character";
import { Attributes } from "@/lib/solando/character";
import { characterRepo, uploadCharacterAvatar } from "@/lib/storage";
import { isSupabaseEnabled } from "@/lib/supabase/client";
import { hydrateSharedContent } from "@/lib/solando/customContent";
import { AttributeAllocator } from "./AttributeAllocator";
import { BalanceAdvisor } from "./BalanceAdvisor";
import { DerivedStatsPanel } from "./DerivedStatsPanel";
import { ManualDrawer } from "./ManualDrawer";
import { analyzeCharacter } from "@/lib/solando/balance";
import { IdentityTab } from "./tabs/IdentityTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { TalentsTab } from "./tabs/TalentsTab";
import { CompetencesTab } from "./tabs/CompetencesTab";
import { InventoryTab } from "./tabs/InventoryTab";
import { ConditionsTab } from "./tabs/ConditionsTab";

type Tab =
  | "identidade"
  | "atributos"
  | "skills"
  | "talentos"
  | "competencias"
  | "inventario"
  | "condicoes";

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "identidade", label: "Identidade", icon: "🪪" },
  { key: "atributos", label: "Atributos", icon: "💪" },
  { key: "skills", label: "Skills", icon: "✨" },
  { key: "talentos", label: "Talentos", icon: "⭐" },
  { key: "competencias", label: "Competências", icon: "📚" },
  { key: "inventario", label: "Inventário", icon: "🎒" },
  { key: "condicoes", label: "Condições", icon: "⚖️" },
];

const ACCENTS = ["#a855f7", "#22d3ee", "#f59e0b", "#facc15", "#ef4444", "#22c55e", "#ec4899"];

export function CharacterEditor({ characterId }: { characterId?: string }) {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [tab, setTab] = useState<Tab>("identidade");
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [, bumpContent] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (characterId) {
        const c = await characterRepo.get(characterId);
        if (active) setCharacter(c ?? newCharacter());
      } else {
        setCharacter(newCharacter());
      }
      await hydrateSharedContent();
      if (active) bumpContent((n) => n + 1);
    })();
    return () => {
      active = false;
    };
  }, [characterId]);

  const report = useMemo(
    () => (character ? analyzeCharacter(character) : null),
    [character],
  );

  if (!character) {
    return (
      <div className="grid place-items-center py-24 text-zinc-500">Invocando ficha...</div>
    );
  }

  function patch(p: Partial<Character>) {
    setCharacter((prev) => (prev ? { ...prev, ...p } : prev));
    setSaved(false);
  }

  async function onPickAvatar(file: File | undefined) {
    if (!file || !character) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const url = await uploadCharacterAvatar(character.id, file);
      patch({ avatarUrl: url });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Falha ao enviar imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function onAttrs(attrs: Attributes, luckRoll?: number) {
    setCharacter((prev) =>
      prev ? { ...prev, attributes: attrs, luckRoll: luckRoll ?? prev.luckRoll } : prev,
    );
    setSaved(false);
  }

  async function save() {
    if (!character) return;
    const stored = await characterRepo.save(character);
    setCharacter(stored);
    setSaved(true);
    if (!characterId) router.replace(`/ficha/${stored.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div
        className="card flex flex-wrap items-center justify-between gap-4 p-5"
        style={{ borderColor: `${character.accent}44` }}
      >
        <div className="flex items-center gap-4">
          <label
            className="group relative grid h-14 w-14 cursor-pointer place-items-center overflow-hidden rounded-2xl text-2xl font-black text-void-950"
            style={{ background: character.accent }}
            title={isSupabaseEnabled() ? "Enviar foto do personagem" : "Entre para enviar foto"}
          >
            {character.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={character.avatarUrl}
                alt={character.name || "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{character.name.trim().charAt(0).toUpperCase() || "?"}</span>
            )}
            <span className="absolute inset-0 hidden place-items-center bg-black/50 text-[10px] font-semibold text-white group-hover:grid">
              {uploadingAvatar ? "..." : "📷 Foto"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingAvatar || !isSupabaseEnabled()}
              onChange={(e) => onPickAvatar(e.target.files?.[0])}
            />
          </label>
          <div>
            <input
              className="w-full bg-transparent font-display text-2xl font-bold text-zinc-100 outline-none placeholder:text-zinc-600"
              placeholder="Nome do personagem"
              value={character.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Nível {character.level}</span>
              {report && (
                <span className={report.valid ? "text-emerald-400" : "text-red-400"}>
                  · {report.valid ? "válida" : "com pendências"}
                </span>
              )}
            </div>
            {avatarError && (
              <p className="mt-1 text-xs text-red-400">{avatarError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => patch({ accent: c })}
                className={`h-6 w-6 rounded-full ring-2 transition ${
                  character.accent === c ? "ring-white" : "ring-transparent"
                }`}
                style={{ background: c }}
                aria-label={`cor ${c}`}
              />
            ))}
          </div>
          <button className="btn-primary" onClick={save}>
            {saved ? "✓ Salvo" : "Salvar ficha"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn text-sm ${tab === t.key ? "btn-primary" : "btn-ghost"}`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "identidade" && <IdentityTab character={character} patch={patch} />}
              {tab === "atributos" && (
                <AttributeAllocator character={character} onChange={onAttrs} />
              )}
              {tab === "skills" && <SkillsTab character={character} patch={patch} />}
              {tab === "talentos" && <TalentsTab character={character} patch={patch} />}
              {tab === "competencias" && (
                <CompetencesTab character={character} patch={patch} />
              )}
              {tab === "inventario" && <InventoryTab character={character} patch={patch} />}
              {tab === "condicoes" && <ConditionsTab character={character} patch={patch} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <DerivedStatsPanel character={character} />
          <BalanceAdvisor character={character} />
        </aside>
      </div>

      <ManualDrawer />
    </div>
  );
}
