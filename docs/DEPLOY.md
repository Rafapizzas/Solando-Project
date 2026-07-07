# 🚀 Publicar o Solando (Vercel + GitHub) — passo a passo

Este guia deixa o app **online** com dois ambientes:

- **Produção** → branch `main` → domínio principal (ex.: `solando.vercel.app`)
- **Desenvolvimento** → branch `dev` → cada push gera uma URL de *preview* automática

Você só precisa dar alguns cliques e colar 2 valores. Tudo que dá para automatizar já está pronto no repositório (git, CI, `.gitignore`, `.env.example`).

---

## Parte 1 — Subir o código para o GitHub

O repositório git local já está criado com as branches `main` e `dev` e o primeiro commit feito.

1. Acesse https://github.com/new
2. **Repository name:** `Solando-Project`
3. Visibilidade: **Public**
4. **NÃO** marque "Add a README / .gitignore / license" (o projeto já tem).
5. Clique em **Create repository**.
6. Copie a URL do repositório (algo como `https://github.com/Rafapizzas/Solando-Project.git`).
7. Volte ao VS Code e me avise a URL — eu conecto e faço o push das duas branches para você.

> Alternativa manual (se preferir você mesmo), rode dentro da pasta `solando`:
> ```powershell
> git remote add origin https://github.com/Rafapizzas/Solando-Project.git
> git push -u origin main
> git push -u origin dev
> ```

---

## Parte 2 — Conectar a Vercel (deploy automático)

1. Acesse https://vercel.com e entre com **"Continue with GitHub"**.
2. Clique em **Add New… → Project**.
3. Selecione o repositório **Solando-Project** → **Import**.
4. A Vercel detecta **Next.js** automaticamente. Não precisa mexer em build/output.
   - *Root Directory* deve ficar como `.` (o repositório já é a raiz do app).
5. Em **Environment Variables**, adicione as duas variáveis (valores no seu `.env.local`):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://pyleebllnqhesrkkabej.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(a publishable key `sb_publishable_...`)* |

   Marque as duas para **Production, Preview e Development**.
6. Clique em **Deploy**. Em ~1 minuto o app estará no ar. 🎉

A partir daí:
- Todo push na branch **`main`** publica em **produção**.
- Todo push na branch **`dev`** (ou qualquer PR) gera uma **URL de preview** isolada = seu ambiente de testes.

---

## Parte 3 — Configurar o Supabase (Auth)

No painel do seu projeto Supabase (https://supabase.com/dashboard):

1. **SQL Editor** → cole e rode o arquivo [`docs/supabase-schema.sql`](./supabase-schema.sql) (uma vez).
2. **Authentication → URL Configuration**:
   - *Site URL*: a URL de produção da Vercel (ex.: `https://solando-project.vercel.app`)
   - *Redirect URLs*: adicione também `http://localhost:3000/**` (dev local) e `https://*.vercel.app/**` (previews).
3. **Authentication → Sign In / Providers**:
   - **Email**: já vem ligado. Para testar rápido, pode desativar *Confirm email*.
   - **Google** (opcional agora): ligue e cole o *Client ID/Secret* do Google Cloud. Enquanto isso, login por email/senha já funciona.

---

## Fluxo de trabalho dev → prod (versionamento)

```
main   ──●───────────────●─────  (produção / público)
          \             /
dev        ●──●──●──●──●          (desenvolvimento / previews)
```

- Trabalhe sempre na branch **`dev`**.
- Quando estiver estável, abra um **Pull Request `dev → main`** no GitHub.
- O **CI** (GitHub Actions) roda `tsc --noEmit` + `lint` automaticamente no PR.
- Fazer *merge* na `main` = **publicar em produção**.

> ⚠️ Merge para `main` só com sua autorização explícita (é o que vai para produção).

---

## Separar dev e prod no banco (quando quiser)

Hoje usamos **1 projeto Supabase** para tudo. Quando quiser isolar:

1. Crie um segundo projeto Supabase (ex.: `solando-dev`) e rode o mesmo `supabase-schema.sql` nele.
2. Na Vercel, em **Settings → Environment Variables**, defina valores **diferentes** de `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` para o escopo **Preview/Development** (aponta para `solando-dev`) e **Production** (aponta para o projeto de prod).

Assim, previews usam o banco de testes e produção usa o banco real, sem trocar código.
