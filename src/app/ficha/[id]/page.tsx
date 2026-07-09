import { CharacterEditor } from "@/components/CharacterEditor";
import { ShareCharacter } from "@/components/ShareCharacter";

export default function EditarFichaPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Editar Ficha</h1>
        <p className="mt-1 text-zinc-400">Ajuste seu personagem quando quiser.</p>
      </div>
      <CharacterEditor characterId={params.id} />
      <ShareCharacter characterId={params.id} />
    </div>
  );
}
