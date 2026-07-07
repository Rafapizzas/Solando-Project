# Guia de Contas e Publicação — Projeto Solando

Este guia é para quem **nunca usou** GitHub, Vercel ou Supabase. Siga na ordem.
Tudo aqui usa **planos gratuitos**.

---

## Passo 1 — Criar conta no GitHub (guardar o código)

1. Acesse https://github.com/signup
2. Informe e-mail, senha e um nome de usuário.
3. Confirme o e-mail.

### Enviar o projeto para o GitHub

No terminal, dentro da pasta `solando`:

```powershell
cd solando
git init
git add .
git commit -m "Projeto Solando: MVP inicial"
```

Depois, no site do GitHub:

1. Clique em **New repository** (botão verde).
2. Nome: `projeto-solando`. Deixe **Private** se quiser que só a mesa veja.
3. **NÃO** marque "Add README" (o projeto já tem um).
4. Clique **Create repository**.
5. Copie os comandos que o GitHub mostra em "…or push an existing repository" e cole no terminal. Serão parecidos com:

```powershell
git remote add origin https://github.com/SEU_USUARIO/projeto-solando.git
git branch -M main
git push -u origin main
```

---

## Passo 2 — Publicar na Vercel (deixar o site no ar)

1. Acesse https://vercel.com/signup
2. Escolha **Continue with GitHub** (usa a conta que você acabou de criar).
3. Clique em **Add New… → Project**.
4. Selecione o repositório `projeto-solando`.
5. Em **Root Directory**, clique em *Edit* e selecione a pasta `solando`
   (o código do app está dentro dela).
6. Clique **Deploy**.

Em cerca de 1 minuto você recebe uma URL pública (ex.:
`https://projeto-solando.vercel.app`) para compartilhar com a mesa.

> A cada `git push` para a branch `main`, a Vercel republica automaticamente.

---

## Passo 3 — Supabase (fase 2: login + mesa compartilhada de verdade)

> **Opcional agora.** O MVP funciona com dados salvos no navegador (localStorage).
> O Supabase entra quando quiser que **vários jogadores** compartilhem as mesmas
> fichas/mesas e vejam as rolagens em tempo real.

1. Acesse https://supabase.com e clique em **Start your project** (login com GitHub).
2. **New project** → dê um nome, defina uma senha de banco e a região (escolha a mais próxima, ex.: São Paulo).
3. Quando o projeto subir, vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public key`
4. Na pasta `solando`, crie um arquivo `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=coloque_a_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=coloque_a_anon_key_aqui
```

5. Na Vercel, vá em **Project → Settings → Environment Variables** e adicione as
   mesmas duas variáveis (para o site publicado também funcionar).

> A implementação do cliente Supabase (`src/lib/storage.ts` já está preparado para
> ser trocado) será feita na fase 2. Me avise quando tiver as chaves.

---

## Resumo rápido

| Serviço | Para quê | Custo |
| --- | --- | --- |
| GitHub | Guardar o código | Grátis |
| Vercel | Site no ar (URL pública) | Grátis |
| Supabase | Login + mesa compartilhada em tempo real (fase 2) | Grátis |
