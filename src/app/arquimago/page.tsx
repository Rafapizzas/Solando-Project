import { RulesConsultant } from "@/components/RulesConsultant";

export const metadata = {
  title: "Arquimago Solador das Regras — Solando",
  description:
    "Consultor de regras com IA do universo Solando: tire dúvidas do manual em linguagem simples.",
};

export default function ArquimagoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="manga-title text-3xl font-black title-gradient">
          Arquimago Solador das Regras
        </h1>
        <p className="mt-2 text-zinc-400">
          O guardião do conhecimento de Solando. Pergunte qualquer regra e receba
          respostas baseadas no manual oficial — sem invenções.
        </p>
      </div>
      <RulesConsultant />
    </div>
  );
}
