# 🗡️ PROJECT SOLANDO — HANDOFF / ONBOARDING DO AGENTE

> Documento de passagem de bastão. Leia **inteiro** antes de tocar em qualquer coisa.
> Última atualização: 2026-07-09.
> Autor da passagem: agente anterior (GitHub Copilot).

---

## 0. TL;DR (leia isto primeiro)

- **Solando** é um app web (Next.js + TypeScript + Tailwind) para o RPG de mesa "Sistema Solando 4.0": criação de fichas, mesas, manual, consultor de regras com IA, comunidade e um mural de feedbacks.
- **Repositório:** GitHub `Rafapizzas/Solando-Project`. Branches: `main` (produção) e `dev`.
- **Deploy:** AUTOMÁTICO na **Vercel** a cada push na `main`. Não há passo manual.
- **Git roda DENTRO de `solando/`** (subpasta), não na raiz "Project SL".
- **Caminho atual do projeto (mudou!):**
  `C:\Users\RAUGUS40\OneDrive - azureford\👤 Pessoal\Rafael Private\Project SL\solando`
- **REGRAS INVIOLÁVEIS:**
  1. **NUNCA** fazer merge para `main` sem autorização **explícita** do usuário (merge = deploy em produção).
  2. **NUNCA** alterar/remover nada de autoria de **cborge14**.
  3. Sempre responder em **pt-br** e começar CADA resposta com um **"Resumo Executivo"** curto.
- **Estado atual:** tudo estável e em produção até o commit `67b815f`. Há um lote grande de melhorias na **ficha** já especificado e decidido pelo usuário, **ainda NÃO implementado** (ver seção 6).

---

## 1. O QUE É O PROJETO (contexto de domínio)

Solando 4.0 é um sistema de RPG autoral. Conceitos centrais que aparecem no código:

- **Atributos:** `forca`, `destreza`, `constituicao`, `aspecto`, `mente`, `poder`, `sorte`.
  (Obs.: quando os jogadores falam "inteligência", referem-se a **Mente**.)
- **Fórmulas derivadas (em `src/lib/solando/knowledge.ts` → `coreRules()`):**
  - Vida = Constituição × 10
  - Sanidade = Aspecto × 10
  - Entropia (mana máxima) = (maior entre Aspecto e Constituição) × 5 + (maior entre Poder e Força) × 2
  - Multiplicador de dano, XP, etc.
- **Raças** dão bônus fixos de atributo (ex.: Deuses +4 Aspecto/Força/Destreza). Algumas têm progressão por nível (ex.: Draconato — hoje só em texto, ver bug C2).
- **Classes** têm bônus no nível 0 e progressão por nível (hoje só em texto).
- **Talentos:** 5 pontos base no nível 0, +1 por nível. Alguns talentos concedem bônus de atributo (ex.: "Arrojado" +Aspecto; poderes de lobisomem). **Isso ainda NÃO é aplicado no cálculo** (bug, ver seção 6).
- **Skills:** habilidades criadas (limite baseado em Mente/Destreza). Têm custo.
- **Competências:** proficiências com níveis.
- **Condições/Desvantagens:** geram **Entropia-KI** (moeda: +2 por ponto, teto de 5) que se gasta em talentos/competências/menos custo de skill/mais potência.
- **Entropia-KI ≠ mana.** É uma moeda de criação.

---

## 2. STACK, REPO E FLUXO DE TRABALHO

### Stack
- **Next.js (App Router) + React + TypeScript + Tailwind CSS**
- **Supabase** (auth Google + Postgres) — persistência de contas, perfis, fichas, feedback.
- **Resend** — envio de e-mails (feedback + notificações).
- **Google Gemini** — IA (consultor de regras "Arquimago"; em breve análise de skills).
- **framer-motion** — animações.

### Repositório & deploy
- Remoto: `https://github.com/Rafapizzas/Solando-Project.git`
- `main` → produção (deploy automático Vercel). `dev` → desenvolvimento.
- **Git é executado dentro de `solando/`.** Sempre `Set-Location` para a pasta do projeto antes.

### ⚠️ Peculiaridade do PowerShell + git
`git push` imprime no stderr um `RemoteException` que **parece erro mas NÃO é**. Confirme o sucesso pela linha `-> dev` / `-> main` na saída. Sempre use `2>&1 | Out-String` nos comandos git.

### Padrão de terminal (Windows PowerShell)
```powershell
Set-Location -LiteralPath "C:\Users\RAUGUS40\OneDrive - azureford\👤 Pessoal\Rafael Private\Project SL\solando"
# encadear com ';' (NUNCA '&&')
```

### Validação antes de commitar (SEMPRE)
```powershell
npx tsc --noEmit; Write-Output "TSC=$LASTEXITCODE"
npm run lint 2>&1 | Select-Object -Last 6; Write-Output "LINT=$LASTEXITCODE"
npm run build 2>&1 | Select-Object -Last 10
```

### Padrão de deploy (SÓ com autorização explícita para prod)
```powershell
git add -A
git commit -q -m "..."
git push origin dev 2>&1 | Out-String
# merge p/ prod SÓ com "ok" do usuário:
git checkout main 2>&1 | Out-String
git merge dev --no-edit 2>&1 | Out-String
git push origin main 2>&1 | Out-String
git checkout dev 2>&1 | Out-String
```

---

## 3. ⚠️ INCIDENTE OneDrive (importante para o próximo agente)

Em 2026-07-09 a pasta `solando` inteira "sumiu" do caminho antigo
`...\Rafael Private\Project SL\solando` porque o usuário **reorganizou os arquivos** e o OneDrive moveu tudo para dentro de **"👤 Pessoal"**. O código estava intacto (e também no GitHub).

**Lições:**
- O projeto vive dentro do **OneDrive**, sujeito a sync/movimentação. Se arquivos "sumirem", NÃO entre em pânico e NÃO faça nada destrutivo: procure a pasta com
  `Get-ChildItem "C:\Users\RAUGUS40" -Recurse -Directory -Filter "solando"`.
- **Recomendação forte:** mover o projeto para **fora do OneDrive** (ex.: `C:\Dev\Solando-Project`) para evitar recorrência. (Decisão do usuário; ainda não feito.)
- Se o VS Code estiver aberto no caminho antigo (vazio), as ferramentas de busca falham. Peça ao usuário para **reabrir a pasta** no caminho novo (Arquivo → Abrir Pasta).

---

## 4. VARIÁVEIS DE AMBIENTE (Vercel + `.env.local`)

O `.env.local` **não** está no Git (é ignorado). Os valores de produção estão na Vercel.

| Variável | Escopo | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | Supabase (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | Supabase (browser, anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreto (server)** | Escritas server-side (comentários/status do feedback). Ignora RLS. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | público | Lista de e-mails admin separados por vírgula. Atual: `kirigayaklegal@gmail.com,rafapizzas3.141@gmail.com,rafaelraugusto1@gmail.com` |
| `GEMINI_API_KEY` | **secreto (server)** | IA (Arquimago / futura análise de skills) |
| `RESEND_API_KEY` | **secreto (server)** | Envio de e-mails |
| `FEEDBACK_EMAIL_TO` | server | Destino do e-mail de feedback + fallback de admin |
| `FEEDBACK_EMAIL_FROM` | server (opcional) | Remetente (default `Solando <onboarding@resend.dev>`) |

**IA:** o modelo é `gemini-flash-latest` (o `gemini-1.5-flash` foi **descontinuado**).
Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`.
Resposta em `data.candidates?.[0]?.content?.parts?.[0]?.text`.
Rotas de IA retornam `{ fallback: true, reason }` quando a chave falta ou dá erro; em 429/503 mostram mensagem divertida de "Arquimago descansando".

---

## 5. ARQUITETURA — ARQUIVOS-CHAVE

### Lógica do sistema (`src/lib/solando/`)
- `character.ts` — modelo `Character` + TODOS os cálculos (atributos efetivos, pontos de talento/skill/competência, condições, Entropia-KI). **Coração do sistema.**
- `rules.ts` — constantes: `ATTRIBUTE_KEYS`, `BASE_ATTRIBUTE_POINTS=20`, `PER_LEVEL_ATTRIBUTE_POINTS=4`, `PER_LEVEL_SKILL_UPS=1`, `MAX_ATTRIBUTE=100`.
- `races.ts` / `classes.ts` / `talents.ts` / `competences.ts` / `conditions.ts` — catálogos oficiais.
- `customContent.ts` — raças/classes criadas pelo usuário (localStorage + Supabase) + `RACE_ATTR_BONUS` / `CLASS_ATTR_BONUS` (mapas de bônus fixos) + `raceAttrBonus()` / `classAttrBonus()`.
- `skillBuilder.ts` — cálculo de custo de skills.
- `balance.ts` — analisador de ficha ("Oráculo"/BalanceAdvisor).
- `knowledge.ts` — base de regras para a IA (`coreRules()` sempre incluído; `buildFocusedContext(question)` envia só seções relevantes = IA mais rápida/barata).

### Componentes da ficha (`src/components/`)
- `CharacterEditor.tsx` — editor com abas: Identidade, Atributos, Skills, Talentos, Competências, Inventário, Condições.
- `AttributeAllocator.tsx` — distribuição de atributos (hoje **bloqueia** em `remaining<=0` — precisa virar dica, ver 6).
- `DerivedStatsPanel.tsx` — painel lateral de stats derivados.
- `BalanceAdvisor.tsx` — conselhos de balanceamento (base para o sistema de **dicas** pedido).
- `ManualDrawer.tsx` — gaveta do manual (`max-w-2xl`, pequena demais no PC — ver 6).
- `tabs/SkillsTab.tsx` — skills; já tem botão "+ Manual". Alvo da **IA de análise** e do **Grimório**.
- `tabs/TalentsTab.tsx`, `tabs/CompetencesTab.tsx`, `tabs/ConditionsTab.tsx` — catálogos (precisam de **busca + ordem alfabética**).

### Auth / perfis / storage
- `lib/auth.tsx` — `AuthProvider`/`useAuth`. `profile{ id, displayName, avatarUrl, email }`, `isAuthenticated`, `signInWithGoogle`, `signOut`.
- `lib/profiles.tsx` — `useProfiles`, `activeProfile{ id, name, role, color, emoji }`, `canMaster`.
- `lib/storage.ts` — persistência de fichas/mesas (Supabase ou localStorage), `uid()`.
- `lib/supabase/client.ts` — cliente browser (`"use client"`, anon). `supabase` (null se não configurado) + `isSupabaseEnabled()`.
- `lib/supabase/admin.ts` — cliente **service_role** (server-only): `getAdminClient()`, `adminEmails()`, `isAdminEmail()`, `getUserFromRequest()`.

### Rotas de API (`src/app/api/`)
- `consultor/route.ts` — Arquimago (IA). Prompt com few-shot; retry p/ 429/500/503; fallback com `resting`.
- `feedback/route.ts` — recebe feedback (insere no Supabase + e-mail Resend).
- `feedback/comment/route.ts` — cria comentário (login obrigatório) + notifica autor por e-mail.
- `feedback/status/route.ts` — admin altera status + notifica autor.

### Estilos (`src/app/globals.css` + `tailwind.config.ts`)
- Cores de marca: `mente` (roxo #a855f7, `mente-soft`), `corpo` (âmbar), `alma` (ciano), `sol` (dourado, `sol-soft`), `void` (fundos escuros 950–600).
- **NÃO existe** token `fail` — para vermelho use paleta padrão Tailwind (`rose-*`, `red-*`).
- Classes utilitárias: `.vn-box`, `.sig-shine`, `.halftone`, `.font-ink`, `.manga-title`, `.card`, `.btn-primary`, `.btn-ghost`, `.chip`, `.input`, `.title-gradient`.

---

## 6. FUTURO — LOTE DE MELHORIAS DA FICHA (DECIDIDO, NÃO IMPLEMENTADO)

> Origem: feedbacks de testers (Tiagueta, Alavaro) + o criador do sistema (Xande).
> O usuário **decidiu** o rumo; falta implementar **tudo de uma vez**.

> **STATUS (2026-07-09):** os itens A, B, C, D e E abaixo foram **IMPLEMENTADOS** na
> branch `dev` (ainda **não commitados**; validados com `tsc`/`lint`/`build`).
> Pendências que **dependem do Xande** (6.F) continuam abertas, e o **SQL da tabela
> `shared_skills`** (Grimório) precisa ser rodado no Supabase pelo usuário.
> Arquivos tocados: `character.ts` (talentAttrBonus/attributeBonus), `AttributeAllocator.tsx`,
> `tabs/TalentsTab.tsx`, `tabs/CompetencesTab.tsx`, `tabs/ConditionsTab.tsx`, `SkillsTab.tsx`,
> `ManualDrawer.tsx`, novo `api/skill-analyze/route.ts`, novo `lib/solando/sharedSkills.ts`,
> `docs/supabase-schema.sql` (tabela `shared_skills`).

### 6.1 Decisões do usuário (rumo geral)
1. **Talentos influenciam atributos** — sim, alguns (ex.: poderes de lobisomem, "Arrojado"). **Reler bem as regras/efeitos** dos talentos.
2. **SEM TRAVAS/bloqueios** em nada (atributos, talentos, competências, itens, skills). Em vez disso, dar **DICAS/sugestões** indicando se o jogador está **acima ou abaixo** do esperado (o esperado muda com raça/classe/talento — ex.: Deuses e lobisomem dão mais atributos, e isso é OK).
3. **IA que analisa a skill criada manualmente** — sugere custo, efeitos, etc., a partir do texto do usuário + base do sistema, **priorizando a escrita do usuário**.
4. **Grimório de Skills compartilhado** — criar/armazenar/usar skills como já é feito com raças/classes, mas **público (todos usam)**.

### 6.2 Trabalho técnico correspondente

**A) Talentos → atributos (reler regras):**
- Em `character.ts`, `effectiveAttributes()` hoje soma só raça+classe. Criar `talentAttrBonus(character)` que lê os talentos selecionados e seus tiers e extrai bônus de atributo.
- **Abordagem sugerida:** parser dos efeitos (texto tipo "+2 de Aspecto") mapeando nomes PT→chaves (`Força→forca`, `Destreza→destreza`, `Constituição→constituicao`, `Aspecto→aspecto`, `Mente→mente`, `Poder→poder`, `Sorte→sorte`). Isso cobre automaticamente qualquer talento que siga o padrão. Validar contra o catálogo em `talents.ts` (procurar lobisomem/licantropia, "Arrojado", etc.).
- Mostrar o bônus de talentos no breakdown do `AttributeAllocator.tsx` (hoje só mostra raça/classe).

**B) Dicas em vez de travas:**
- `AttributeAllocator.tsx`: remover o bloqueio `if (remaining <= 0) return;` — permitir passar do orçamento; o contador vira **dica** (fica vermelho/avisa "X acima do sugerido", mas não impede).
- Idem para skills/talentos/competências/itens: nunca bloquear; exibir aviso amigável.
- Ampliar `BalanceAdvisor.tsx`/`balance.ts` para explicar **por que** o esperado subiu (raça/classe/talento), no espírito "você tem mais atributos porque é da raça Deuses — isso é esperado".
- **Números de referência dos testers** (para as dicas ficarem certas — confirmar com Xande se virar regra dura):
  - Talentos: tester espera **15** no nível 5 (hoje a fórmula dá 10 = 5 base + 1/nível). Opções: base 10 + 1/nível, ou base 5 + 2/nível.
  - Skills: tester espera **~4** com 20 Des + 10 Mente + 1 natural (hoje a fórmula infla por causa do termo de nível). Regra provável: `1 (natural) + ⌊(Destreza + Mente)/10⌋`, **sem** escalar por nível.

**C) IA de análise de skill manual:**
- Nova rota `src/app/api/skill-analyze/route.ts` (server, padrão do `consultor/route.ts`): recebe `{ name, description, cost? }`, usa `GEMINI_API_KEY` + `gemini-flash-latest` + `coreRules()`/`buildFocusedContext`, retorna `{ suggestedCost, effects, notes, fallback? }`. **Prompt deve priorizar o texto do usuário** (não reescrever, só sugerir/ajustar). Rate-limit via `src/lib/ai/rateLimit.ts`.
- Em `tabs/SkillsTab.tsx`: botão "🔮 Analisar com IA" nas skills manuais que chama a rota e mostra a sugestão (aceitar/ignorar).

**D) Grimório de Skills compartilhado:**
- Espelhar o padrão de `customContent.ts` (raças/classes) para **skills**.
- Criar tabela Supabase pública (ex.: `shared_skills`) — schema em `docs/supabase-schema.sql`. Leitura pública (RLS select true); escrita por usuário logado (ou via rota server). Guardar: nome, descrição, custo, efeitos, autor, created_at.
- UI: em `SkillsTab.tsx`, botão "📖 Grimório" abre catálogo comunitário (com busca), permite **importar** skill para a ficha e **publicar** a sua no grimório.

**E) Melhorias de UI (testers):**
- **Busca (lupa) + ordem alfabética** nos catálogos de Talentos, Competências e Condições (`.sort((a,b)=>a.name.localeCompare(b.name))` + input de filtro).
- **Condições: input pulando 1→5** — trocar o `<input type="number">` por um **stepper `− valor +`** respeitando `def.min`/`def.max` (`ConditionsTab.tsx`, ~linha 100).
- **Condições: botão "+ Manual"** (igual às Skills) para condições custom (ex.: "Amaldiçoado 10"). ⚠️ Confirmar com o usuário se condição manual pode **furar o teto de 5 pontos de KI** ou é só cosmético.
- **Manual pequeno no PC:** aumentar `ManualDrawer.tsx` de `max-w-2xl` para `max-w-4xl`/`5xl` e melhorar leitura da área de Skills.

**F) Pendências que dependem do Xande (dados que faltam):**
- **C1 — mapa talento→atributo:** lista de quais talentos dão qual bônus (o parser cobre os que seguem o padrão de texto; confirmar casos especiais como lobisomem).
- **C2 — progressão por nível** de Draconato (raça) e das classes ("+8/+12/+16" hoje só em texto). Sem a tabela, só dá para tratar o nível 0. Bug relatado: Draconato vindo "no máximo" já no nível 0.

---

## 7. HISTÓRICO DESTA JORNADA (o que já foi entregue e está EM PRODUÇÃO)

Ordem cronológica aproximada (commits em `main`):

- `9f3926b` — "Round 3" de polimento.
- `85b6e46` — clareza do Arquimago + assinatura do dev.
- `f2518a9` — rodapé "Desenvolvido por".
- `4781d4c` — assinatura com kanji **卍解 (Bankai)** centralizado na home + easter egg nas outras páginas; anti-genérico; disclaimer de IA.
- `afcda53` — retry para 503 do Gemini + link para o Manual no fallback.
- `957bf42` — Arquimago com few-shot (respostas concretas, sem enrolação) + mensagem divertida de "Arquimago descansando" em 503/429. Modelo `gemini-flash-latest`.
- `985cb0b` — **FeedbackWidget** (botão flutuante 📨) + rota `/api/feedback` + tabela `feedback` no Supabase.
- `ab0d2e9` — **Mural de Feedbacks** (`/feedback`) em `dev`.
- `67b815f` — **Mural em PRODUÇÃO**: multi e-mail de admin, comentários, status, notificações por e-mail. (Merge autorizado pelo usuário.)

### Destaques de features vivas
- **Arquimago (consultor de regras IA):** `src/app/arquimago` + `RulesConsultant.tsx` (estilo visual novel, typewriter + blips de áudio). Easter egg: se não sabe, "consulta o Xande aí".
- **Mural de Feedbacks (`/feedback`):** leitura pública via view `feedback_public` (sem expor e-mail), comentários (thread), status editável por admin, notificações por e-mail (comentário/resolução). Link "Mural" na NavBar.
- **Assinatura/easter eggs:** `DevSignature.tsx` (卍解), `AuroraBackground.tsx` (kanjis temáticos, sem logos com copyright), `KonamiEasterEgg.tsx` (↑↑↓↓←→←→BA = chuva de kanji + "MODO SOLADOR ATIVADO").
- **Conta ≠ Perfil:** `AccountMenu.tsx` (trocar perfil, gerenciar, sair, entrar em outra conta), `NavBar.tsx` com indicador ativo animado.

### Estado do banco (Supabase) — schema em `docs/supabase-schema.sql`
- Tabelas: contas/perfis, fichas, mesas, `feedback` (+ coluna `status`), view `feedback_public`, `feedback_comments`.
- **Ao evoluir o schema, o usuário precisa rodar o SQL no Supabase (SQL Editor).** A tabela `feedback` base precisou ser criada manualmente (erro "relation public.feedback does not exist" já ocorreu).

---

## 8. REGRAS DE MEMÓRIA / CONVENÇÕES DO AGENTE

- Começar **toda** resposta com **"Resumo Executivo"** curto (pt-br).
- Em investigações: resumo curto e baseado em **evidência** (o que houve + como cheguei à conclusão). Sem suposições não verificadas.
- **NUNCA** merge para `main` sem "ok" explícito (é deploy de produção).
- **NUNCA** mexer no que é de **cborge14**.
- Usar as ferramentas nativas (grep/read/list) em vez de comandos de terminal quando possível.
- `create_file` **falha** se o arquivo já existe — use as ferramentas de edição.
- Consultar/atualizar a **memória de sessão** em `/memories/session/solando-roadmap.md` (tem o histórico detalhado).

---

## 9. PRÓXIMOS PASSOS SUGERIDOS (ordem recomendada)

1. **Confirmar o ambiente:** reabrir a pasta no caminho novo (seção 0); rodar `npm install` se necessário; `npm run dev` para validar.
2. (Opcional, recomendado) **Mover o projeto para fora do OneDrive.**
3. Implementar o **lote da ficha** (seção 6), preferencialmente nesta ordem por risco:
   - E) UI (busca/ordenação, stepper de condição, "+ Manual", manual maior) — baixo risco.
   - B) Dicas em vez de travas — médio.
   - A) Talentos → atributos — médio/alto (mexe no cálculo central).
   - C) IA de análise de skill — novo endpoint isolado.
   - D) Grimório de skills — novo schema + UI.
4. Colher do **Xande** os dados da seção 6.F (mapa talento→atributo e progressão por nível).
5. Validar (`tsc`/`lint`/`build`), commitar em `dev`, e **só com autorização** fazer merge para `main`.

---

*Fim do handoff. Bons dados e boas rolagens. — Agente anterior* ⚔️
