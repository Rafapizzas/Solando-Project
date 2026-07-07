# Como contribuir

Guia rápido para evoluir o Solando com segurança.

## Fluxo de branches

- `dev` — desenvolvimento. Todo trabalho vai primeiro para cá.
- `main` — produção. **Merge em `main` = deploy** (dev + prod via pipeline). Só faça merge com
  autorização explícita.

```powershell
git checkout dev
# ...edições...
git add -A
git commit -m "feat: descrição curta"
git push origin dev
```

## Validação obrigatória antes de commit

```powershell
npx tsc --noEmit      # sem erros de tipo
npm run lint          # sem warnings/erros
npm run build         # build de produção passa
```

Para testes end-to-end (opcional, exige navegadores):

```powershell
npm run test:install
npm run test:e2e
```

## Convenções

- **TypeScript strict.** Nada de `any` desnecessário; tipar as fronteiras.
- **IA server-only.** Nunca exponha `GEMINI_API_KEY` no cliente. Rotas de IA sempre com fallback.
- **Motor puro.** Lógica de regras em `src/lib/solando/` deve ser determinística e testável.
- **Componentes de cliente** marcados com `"use client"`; leitura de `localStorage` só em `useEffect`.
- **Estilo.** Use os utilitários do `globals.css` (`.card`, `.ink-panel`, `.manga-title`,
  `.btn-primary`, `.btn-ghost`) para manter a identidade visual.
- **Acessibilidade.** Respeite `prefers-reduced-motion` em animações.

## Estrutura

Veja [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para camadas e pastas, e
[`docs/FEATURES.md`](./docs/FEATURES.md) para onde cada recurso vive.

## Banco de dados

Alterações de schema vão em [`docs/supabase-schema.sql`](./docs/supabase-schema.sql) com RLS. Rode a
migração no projeto Supabase antes de usar recursos novos que dependam dela.
