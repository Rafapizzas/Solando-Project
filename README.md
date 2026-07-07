# ✦ Projeto Solando

Plataforma web completa para o RPG do **Sistema Solando 4.0**: criação de fichas com
balanceamento automático, mesa com rolagem de dados ao vivo, painel do mestre, suite de
IA (Arquimago + forðas assistidas), comunidade de criações e visual inspirado em mangá.

> Documentação técnica completa em [`docs/`](./docs): [Arquitetura](./docs/ARCHITECTURE.md) ·
> [Funcionalidades](./docs/FEATURES.md) · [Roadmap](./docs/ROADMAP.md) · [Deploy](./docs/DEPLOY.md) ·
> [Como contribuir](./CONTRIBUTING.md)

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** (tema animado do universo Solando + utilitários mangá)
- **Framer Motion** (transições de página, splash e animações)
- **Supabase** (auth Google/senha, Postgres com RLS, storage de avatares)
- **Google Gemini** (suite de IA, chave apenas no servidor)
- **Web Audio API** (efeitos sonoros de crítico/falha, sintetizados sem assets)
- **html-to-image** (exportação da ficha como card de anime)
- **Playwright** (testes de fumaça end-to-end)

## Rodar localmente

```powershell
cd solando
npm install
npm run dev
```

Abra http://localhost:3000

Variáveis de ambiente (`.env.local`): veja [`docs/DEPLOY.md`](./docs/DEPLOY.md). A IA usa
`GEMINI_API_KEY` **somente no servidor**; sem ela, as telas caem em modo degradado sem quebrar.

## O que já funciona

| Área | Descrição |
| --- | --- |
| **Criador de ficha** (`/ficha/nova`) | 20 pontos, ranks (F→S), Vida/Sanidade/Entropia, inventário por Rank de Força, skills, talentos, condições. |
| **Oráculo da Entropia** | Assistente de balanceamento **gratuito** (regras determinísticas) que valida a ficha e dá insights + arquétipos. |
| **Mesa** (`/mesa`) | Salas de campanha, rolagem d100 com vantagem/desvantagem, histórico, rolagem rápida por atributo. Críticos com som e animação. |
| **Painel do Mestre** (`/mestre`) | Visão consolidada das fichas dos jogadores de cada campanha. |
| **Arquimago** (`/arquimago`) | Chat de IA que responde dúvidas de regras baseado no manual oficial (grounding, anti-injeção). |
| **Suite de IA** | Criação de personagem, contramestre de cena/NPC, gerador de nomes/lore e “explique minha ficha”. |
| **Perfis** (`/perfis`) | Sistema estilo Netflix: perfis de Jogador e Mestre na mesma conta, com troca rápida. |
| **Comunidade** (`/comunidade`) | Vitrine de raças e classes públicas criadas por qualquer pessoa, com botão “Adotar”. |
| **Guia** (`/guia`) | Passo a passo ilustrado para pessoas leigas. |
| **Card de anime** | Exportação da ficha como imagem PNG estilizada. |

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

## Testes

```powershell
npm run test:install   # baixa os navegadores (apenas na primeira vez)
npm run build
npm run test:e2e       # smoke tests das rotas públicas
```

## Documentação e próximos passos

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — estrutura de pastas, camadas e decisões.
- [`docs/FEATURES.md`](./docs/FEATURES.md) — detalhe de cada funcionalidade.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — histórico de fases e futuro.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — contas, variáveis e deploy na Vercel.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — fluxo de branches, validação e convenções.
