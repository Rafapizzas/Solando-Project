# Arquitetura

Visão geral de como o Solando é construído, para quem quer entender ou evoluir o código.

## Camadas

```
┌────────────────────────────────────────────┐
│  UI (App Router)  src/app/**/page.tsx       │  Server + Client Components
├────────────────────────────────────────────┤
│  Componentes      src/components/**          │  UI reutilizável ("use client")
├────────────────────────────────────────────┤
│  Contextos        src/lib/*.tsx              │  auth, profiles, rollFx (React Context)
├────────────────────────────────────────────┤
│  Domínio/Regras   src/lib/solando/**         │  motor puro do sistema Solando 4.0
├────────────────────────────────────────────┤
│  IA (servidor)    src/lib/ai/**              │  Gemini + rate-limit (server-only)
├────────────────────────────────────────────┤
│  Rotas de API     src/app/api/**/route.ts    │  IA e integrações (server)
├────────────────────────────────────────────┤
│  Persistência     Supabase + localStorage    │  contas/dados + estado do cliente
└────────────────────────────────────────────┘
```

## Estrutura de pastas

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas (App Router). Cada pasta com `page.tsx` é uma tela. `layout.tsx` monta os providers; `template.tsx` faz a transição de página; `loading.tsx` é o loader global. |
| `src/app/api/` | Rotas de servidor. `ia/`, `consultor/`, `oraculo/` chamam a IA e sempre têm fallback. |
| `src/components/` | Componentes de UI. `tabs/` são as abas do criador de ficha. |
| `src/lib/` | Contextos e utilidades: `auth.tsx`, `profiles.tsx`, `rollFx.tsx`, `storage.ts`. |
| `src/lib/ai/` | `gemini.ts` (helper do modelo) e `rateLimit.ts` (limite por IP). |
| `src/lib/solando/` | Motor do sistema: `rules.ts`, `character.ts`, `dice.ts`, `balance.ts`, `races.ts`, `classes.ts`, `knowledge.ts`, `customContent.ts`, `skillBuilder.ts`. |
| `docs/` | Documentação. |
| `e2e/` | Testes Playwright. |

## Princípios

1. **Chave de IA só no servidor.** `GEMINI_API_KEY` nunca vai ao cliente. As rotas de API
   retornam `{ fallback: true }` quando a chave falta ou o modelo erra — a UI degrada sem quebrar.
2. **Motor de regras puro.** Tudo em `src/lib/solando/` é determinístico e testável, sem
   dependência de rede. O contexto do manual é memoizado (`buildManualContext`).
3. **Grounding + anti-injeção.** As rotas de IA injetam o manual como contexto e uma instrução
   anti-prompt-injection antes do conteúdo do usuário.
4. **Estado do cliente resiliente.** Perfis e preferências (mute de efeitos) usam `localStorage`
   por conta, funcionando mesmo sem migração de banco.
5. **Rate-limit best-effort.** `rateLimit.ts` usa janela deslizante em memória por IP para
   conter rajadas nas rotas de IA.

## Providers (ordem em `layout.tsx`)

```
AuthProvider → ProfileProvider → RollFxProvider
  └ AuroraBackground, OpeningSplash, ProfileGate, NavBar, <main>, DevSignature
```

## Banco de dados

Esquema completo com RLS em [`docs/supabase-schema.sql`](./supabase-schema.sql): `profiles`,
`characters`, `custom_races`/`custom_classes` (únicos por `owner_id` + `slug`, com `is_public`
para a comunidade), `campaigns`, `table_members`, `roll_logs` e bucket `avatars`.
