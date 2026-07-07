import { CharacterEditor } from "@/components/CharacterEditor";

export default function NovaFichaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Nova Ficha</h1>
        <p className="mt-1 text-zinc-400">
          Monte seu personagem — o Oráculo balanceia tudo em tempo real.
        </p>
      </div>
      <CharacterEditor />
    </div>
  );
}
