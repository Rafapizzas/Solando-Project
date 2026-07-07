# Funcionalidades

Detalhe de cada recurso e onde ele vive no código.

## Fichas e regras

- **Criador de ficha** (`/ficha/nova`, `src/app/ficha`): 20 pontos, ranks F→S, Vida (CON×10),
  Sanidade (Aspecto×10), Entropia, inventário por Rank de Força, skills, talentos, condições.
  Abas em `src/components/tabs/`.
- **Motor** (`src/lib/solando/`): `character.ts` (modelo + status derivados), `dice.ts` (d100 com
  vantagem/desvantagem, Sorte 1d20, expressões), `rules.ts` (atributos, ranks, fontes de entropia).
- **Oráculo da Entropia** (`balance.ts`): análise determinística e gratuita, score de equilíbrio e
  sugestão de distribuição.

## Mesa e mestre

- **Mesa** (`/mesa`): salas, rolagem ao vivo, histórico, rolagem rápida por atributo.
- **Efeitos de crítico** (`src/lib/rollFx.tsx`): som sintetizado (Web Audio) e overlay animado para
  acerto crítico (`CRÍTICO!` / 会心の一撃) e falha crítica (`FALHA CRÍTICA` / 大失敗). Respeita
  `prefers-reduced-motion` e um mute salvo em `localStorage`.
- **Painel do Mestre** (`/mestre`): visão consolidada das fichas dos jogadores.

## Suite de IA (Gemini)

Todas as rotas ficam em `src/app/api/`, usam `src/lib/ai/gemini.ts` e têm fallback + rate-limit.

| Recurso | Rota | Componente |
| --- | --- | --- |
| Arquimago (dúvidas de regras) | `/api/consultor` | `RulesConsultant.tsx` em `/arquimago` |
| Criar personagem | `/api/ia` (`personagem`) | `AICharacterForge.tsx` |
| Contramestre (cena/NPC/narrar) | `/api/ia` (`mestre`) | `MesaAssistant.tsx` |
| Nomes e lore | `/api/ia` (`nome`) | `NameLoreForge.tsx` |
| Explique minha ficha | `/api/ia` (`explicar`) | `ExplainSheet.tsx` |

O contexto do manual vem de `src/lib/solando/knowledge.ts` (`buildManualContext` memoizado e
`buildCreationContext`).

## Perfis (estilo Netflix)

- `src/lib/profiles.tsx`: contexto por conta em `localStorage`. Perfis de **Jogador** e **Mestre**.
- `components/ProfilePicker.tsx`, `components/ProfileGate.tsx`, `/perfis`.
- A NavBar mostra o perfil ativo (👑 Mestre / 🎭 Jogador) e restringe áreas de mestre por papel.

## Comunidade

- `/comunidade`: vitrine de raças e classes públicas (`is_public` no Supabase), com "Adotar".
- Origem dos dados: `src/lib/solando/customContent.ts` (`hydrateSharedContent`, `getCustomRaces`,
  `getCustomClasses`, `saveCustomRace/Class`).

## Exportar card de anime

- `components/AnimeCardExport.tsx`: gera um PNG estilizado (TCG) da ficha via `html-to-image`.
  Integrado em `/ficha/[id]/ver`.

## Visual e experiência

- Splash de abertura (`OpeningSplash.tsx`, uma vez por sessão), transições de página
  (`app/template.tsx`), loader global (`app/loading.tsx`).
- Utilitários mangá no `globals.css`: `.font-ink`, `.halftone`, `.ink-panel`, `.manga-title`.
- Assinatura sutil do desenvolvedor no rodapé (`DevSignature.tsx`).

## Guia

- `/guia`: passo a passo ilustrado com mockups em CSS, pensado para pessoas leigas.
