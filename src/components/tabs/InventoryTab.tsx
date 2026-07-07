"use client";

import { Character, InventoryItem } from "@/lib/solando/character";
import { uid } from "@/lib/storage";
import { ItemWeight } from "@/lib/solando/rules";

interface TabProps {
  character: Character;
  patch: (p: Partial<Character>) => void;
}

const weights: ItemWeight[] = ["leve", "medio", "pesado"];

export function InventoryTab({ character, patch }: TabProps) {
  function add() {
    const item: InventoryItem = { id: uid("item"), name: "Novo item", weight: "leve", qty: 1 };
    patch({ inventory: [...character.inventory, item] });
  }
  function update(id: string, p: Partial<InventoryItem>) {
    patch({ inventory: character.inventory.map((i) => (i.id === id ? { ...i, ...p } : i)) });
  }
  function remove(id: string) {
    patch({ inventory: character.inventory.filter((i) => i.id !== id) });
  }

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-display text-lg font-bold text-zinc-100">Inventário</h3>
      <p className="mb-3 text-xs text-zinc-500">
        A capacidade depende do seu Rank de Força (veja no painel de status).
      </p>
      <div className="space-y-2">
        {character.inventory.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-void-950/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input flex-1"
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
              />
              <select
                className="input w-28"
                value={item.weight}
                onChange={(e) => update(item.id, { weight: e.target.value as ItemWeight })}
              >
                {weights.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="input w-16 text-center"
                value={item.qty}
                onChange={(e) => update(item.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
              />
              <button
                className="btn-ghost !px-3 !py-2 text-red-400"
                onClick={() => remove(item.id)}
              >
                ✕
              </button>
            </div>
            <textarea
              className="input mt-2 min-h-[52px] text-sm"
              placeholder="Descrição / efeito do item (dano, bônus, usos...)"
              value={item.note ?? ""}
              onChange={(e) => update(item.id, { note: e.target.value })}
            />
          </div>
        ))}
        {character.inventory.length === 0 && (
          <p className="text-sm text-zinc-500">Nenhum item ainda.</p>
        )}
      </div>
      <button className="btn-ghost mt-3 w-full" onClick={add}>
        + Adicionar item
      </button>
    </div>
  );
}
