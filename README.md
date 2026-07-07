# ✦ Projeto Solando

Plataforma web completa para o RPG do **Sistema Solando 4.0**: criação de fichas com
balanceamento automático, mesa com rolagem de dados ao vivo e painel do mestre.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (tema animado do universo Solando)
- **Framer Motion** (animações)
- Persistência atual: **localStorage** (abstraída em `src/lib/storage.ts` para trocar por
  **Supabase** na fase 2 sem alterar as telas)

## Rodar localmente

```powershell
cd solando
npm install
npm run dev
```

Abra http://localhost:3000

## O que já funciona (MVP)

| Área | Descrição |
| --- | --- |
| **Criador de ficha** (`/ficha/nova`) | 20 pontos, ranks (F→S), Vida/Sanidade/Entropia, inventário por Rank de Força, skills, talentos, condições. |
| **Oráculo da Entropia** | Assistente de balanceamento **gratuito** (regras determinísticas, sem custo de API) que valida a ficha e dá insights + arquétipos sugeridos. |
| **Mesa** (`/mesa`) | Salas de campanha, rolagem d100 com vantagem/desvantagem por rank, histórico de rolagens, rolagem rápida por atributo de cada jogador. |
| **Painel do Mestre** (`/mestre`) | Visão consolidada das fichas dos jogadores de cada campanha. |

## Regras implementadas

Veja o motor em `src/lib/solando/`:

- `rules.ts` — atributos, tabela de ranks, inventário por Rank de Força (**atualização do mestre**), fontes de entropia.
- `character.ts` — modelo de ficha e status derivados (Vida = CON×10, Sanidade = ASP×10, Entropia).
- `dice.ts` — d100 com vantagem/desvantagem, Sorte (1d20), "Homem Apostador", expressões livres.
- `balance.ts` — Oráculo (análise + score de equilíbrio + sugestão de distribuição).

### Atualizações recentes do mestre já contempladas
1. Não existe mais imortalidade.
2. Dano além da vida → vida fica negativa (refletido nos avisos do Oráculo).
3. Sair de "morrendo" exige cura que exceda a vida negativa.
4. Nova tabela de inventário por Rank de Força.

## Próximos passos (fase 2)

- Integração com **Supabase** (login, banco compartilhado, realtime na mesa).
- Deploy na **Vercel**.

Consulte [`SETUP.md`](./SETUP.md) para o passo a passo de contas e deploy.
