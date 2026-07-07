import { Compendium } from "@/components/Compendium";
import { RulesConsultant } from "@/components/RulesConsultant";

export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black title-gradient">Manual de Solando</h1>
        <p className="mt-1 text-zinc-400">
          Tudo que você precisa para jogar — raças, classes, talentos, condições,
          competências e como criar suas skills.
        </p>
      </div>
      <RulesConsultant />
      <Compendium />
    </div>
  );
}
