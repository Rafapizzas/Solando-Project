"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { characterRepo } from "@/lib/storage";
import { newCharacter } from "@/lib/solando/character";
import {
  ImportedCharacter,
  mapImportedToCharacter,
} from "@/lib/solando/importCharacter";

type Mammoth = {
  extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) {
    // Extrai o texto do .docx no navegador (build de browser do mammoth).
    const mammoth = (await import("mammoth/mammoth.browser" as string)) as unknown as Mammoth;
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }
  // .txt / .md / qualquer texto simples.
  return file.text();
}

export default function ImportarFichaPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setInfo(null);
    try {
      const content = await fileToText(file);
      setText(content);
      setInfo(`Arquivo "${file.name}" carregado (${content.length} caracteres). Revise e importe.`);
    } catch {
      setError("Não consegui ler esse arquivo. Tente colar o texto manualmente.");
    }
  }

  async function importWithAI() {
    if (!text.trim()) {
      setError("Cole o texto da ficha ou envie um arquivo primeiro.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/import-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        character?: ImportedCharacter;
        fallback?: boolean;
        error?: string;
      };
      if (data.error) {
        setError(data.error);
        return;
      }
      if (data.ok && data.character) {
        const character = mapImportedToCharacter(data.character, text);
        const saved = await characterRepo.save(character);
        router.push(`/ficha/${saved.id}`);
        return;
      }
      // Fallback (IA indisponível): cria ficha em branco com o texto nas notas.
      await createBlankWithText();
    } catch {
      setError("Falha ao importar. Você pode criar em branco com o texto abaixo.");
    } finally {
      setBusy(false);
    }
  }

  async function createBlankWithText() {
    const character = newCharacter({
      name: "Personagem importado",
      notes: `— Importado (sem IA) —\n\n${text.slice(0, 4000)}`,
    });
    const saved = await characterRepo.save(character);
    router.push(`/ficha/${saved.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Importar Ficha</h1>
        <p className="mt-1 text-zinc-400">
          Cole a ficha do Obsidian, Discord, Notion, um .txt/.md ou envie um .docx. A IA
          interpreta e monta a ficha no formato do Solando — você revisa e ajusta antes de salvar.
        </p>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,.docx,text/plain"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            📎 Enviar arquivo (.txt / .md / .docx)
          </button>
          <span className="text-xs text-zinc-500">ou cole o texto abaixo ↓</span>
        </div>

        <textarea
          className="input min-h-[280px] font-mono text-sm"
          placeholder="Cole aqui a ficha do seu personagem (nome, raça, classe, atributos, talentos, skills, itens, história…)."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && (
          <p className="rounded-lg border border-red-400/30 bg-red-400/5 p-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-2 text-sm text-emerald-300">
            {info}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn-primary flex-1" onClick={importWithAI} disabled={busy}>
            {busy ? "🔮 Interpretando com a IA…" : "🔮 Interpretar com IA e criar ficha"}
          </button>
          <button
            className="btn-ghost"
            onClick={createBlankWithText}
            disabled={busy || !text.trim()}
          >
            Criar em branco com o texto
          </button>
          <Link href="/ficha/nova" className="btn-ghost">
            Começar do zero
          </Link>
        </div>
        <p className="text-[11px] text-zinc-500">
          A IA extrai só o que está no texto — não inventa números. O que ela não reconhecer (ex.:
          uma raça de outro sistema) fica guardado nas anotações da ficha para você ajustar.
        </p>
      </div>
    </div>
  );
}
