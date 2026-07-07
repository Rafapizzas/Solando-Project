-- ============================================================================
-- Solando 4.0 — Esquema do banco (Supabase / Postgres) + RLS
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- A segurança é garantida pelas políticas RLS abaixo — a publishable key é
-- pública, mas ninguém acessa dados alheios sem permissão.
-- ============================================================================

-- Extensões úteis
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PROFILES: 1:1 com auth.users (nome exibível, avatar)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Aventureiro',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Todos autenticados podem LER perfis (para mostrar nomes na mesa).
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

-- Cada um edita/insere o próprio perfil.
drop policy if exists profiles_upsert on public.profiles;
create policy profiles_upsert on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Cria automaticamente um profile ao registrar um usuário.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- CHARACTERS: fichas. `data` guarda o JSON completo da ficha.
-- ----------------------------------------------------------------------------
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  avatar_url text,
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default false, -- visível como referência a todos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

-- Dono tem acesso total.
drop policy if exists characters_owner_all on public.characters;
create policy characters_owner_all on public.characters
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Fichas públicas (referência) são legíveis por todos autenticados.
drop policy if exists characters_public_read on public.characters;
create policy characters_public_read on public.characters
  for select to authenticated using (is_public = true);

-- OBS.: a política characters_member_read é criada MAIS ABAIXO, depois que a
-- tabela public.table_members existir (ela depende dessa tabela).

-- ----------------------------------------------------------------------------
-- CUSTOM RACES / CLASSES: registro compartilhado (referência para todos)
-- ----------------------------------------------------------------------------
create table if not exists public.custom_races (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.custom_classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.custom_races enable row level security;
alter table public.custom_classes enable row level security;

-- Unicidade por (dono, slug): permite "upsert" idempotente ao publicar/atualizar
-- uma raça/classe compartilhada. Idempotente (safe para rodar novamente).
do $$ begin
  alter table public.custom_races
    add constraint custom_races_owner_slug_key unique (owner_id, slug);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.custom_classes
    add constraint custom_classes_owner_slug_key unique (owner_id, slug);
exception when duplicate_object then null; end $$;

drop policy if exists races_owner_all on public.custom_races;
create policy races_owner_all on public.custom_races
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists races_public_read on public.custom_races;
create policy races_public_read on public.custom_races
  for select to authenticated using (is_public = true);

drop policy if exists classes_owner_all on public.custom_classes;
create policy classes_owner_all on public.custom_classes
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists classes_public_read on public.custom_classes;
create policy classes_public_read on public.custom_classes
  for select to authenticated using (is_public = true);

-- ----------------------------------------------------------------------------
-- CAMPAIGNS (mesas): dono é o mestre.
-- ----------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Nova Mesa',
  description text not null default '',
  accent text not null default '#facc15',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

-- ----------------------------------------------------------------------------
-- TABLE_MEMBERS: quem participa de cada mesa e com qual personagem.
-- role: 'owner' (mestre) | 'player'. can_manage: permissão delegada pelo dono.
-- ----------------------------------------------------------------------------
create table if not exists public.table_members (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  role text not null default 'player' check (role in ('owner', 'player')),
  can_manage boolean not null default false,
  created_at timestamptz not null default now(),
  unique (table_id, user_id)
);

alter table public.table_members enable row level security;

-- Função helper: o usuário é dono/gerente da mesa?
create or replace function public.can_manage_table(tid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.campaigns c where c.id = tid and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.table_members m
    where m.table_id = tid and m.user_id = auth.uid() and m.can_manage = true
  );
$$;

-- Função helper: o usuário participa da mesa?
create or replace function public.is_table_member(tid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.campaigns c where c.id = tid and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.table_members m
    where m.table_id = tid and m.user_id = auth.uid()
  );
$$;

-- Campaigns policies
drop policy if exists campaigns_owner_all on public.campaigns;
create policy campaigns_owner_all on public.campaigns
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists campaigns_member_read on public.campaigns;
create policy campaigns_member_read on public.campaigns
  for select to authenticated using (public.is_table_member(id));
drop policy if exists campaigns_manager_update on public.campaigns;
create policy campaigns_manager_update on public.campaigns
  for update to authenticated using (public.can_manage_table(id)) with check (public.can_manage_table(id));

-- Table_members policies
drop policy if exists members_read on public.table_members;
create policy members_read on public.table_members
  for select to authenticated using (public.is_table_member(table_id));
drop policy if exists members_manage on public.table_members;
create policy members_manage on public.table_members
  for all to authenticated using (public.can_manage_table(table_id)) with check (public.can_manage_table(table_id));
-- O próprio jogador pode entrar/atualizar seu vínculo (ex.: escolher personagem).
drop policy if exists members_self on public.table_members;
create policy members_self on public.table_members
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Agora que public.table_members existe, criamos a política de leitura de fichas
-- por membros da mesa (fichas vinculadas a uma mesa que o usuário participa).
drop policy if exists characters_member_read on public.characters;
create policy characters_member_read on public.characters
  for select to authenticated using (
    exists (
      select 1
      from public.table_members tm_self
      join public.table_members tm_char on tm_char.table_id = tm_self.table_id
      where tm_self.user_id = auth.uid()
        and tm_char.character_id = characters.id
    )
  );

-- ----------------------------------------------------------------------------
-- ROLL_LOGS: histórico de rolagens da mesa (com nome do personagem e reações).
-- ----------------------------------------------------------------------------
create table if not exists public.roll_logs (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.campaigns (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  character_name text not null default '',
  text text not null default '',
  result text,
  secret boolean not null default false,
  reactions jsonb not null default '{}'::jsonb, -- { "🔥": ["uid1","uid2"], ... }
  created_at timestamptz not null default now()
);

alter table public.roll_logs enable row level security;

-- Ler: membros da mesa. Rolagens SECRETAS só o gerente/mestre (ou o autor) vê.
drop policy if exists rolls_read on public.roll_logs;
create policy rolls_read on public.roll_logs
  for select to authenticated using (
    public.is_table_member(table_id)
    and (secret = false or author_id = auth.uid() or public.can_manage_table(table_id))
  );

-- Inserir: qualquer membro da mesa cria rolagens em seu nome.
drop policy if exists rolls_insert on public.roll_logs;
create policy rolls_insert on public.roll_logs
  for insert to authenticated with check (
    author_id = auth.uid() and public.is_table_member(table_id)
  );

-- ----------------------------------------------------------------------------
-- FEEDBACK: relatos de erro, sugestões e opiniões (aberto ao público).
-- Qualquer visitante (anon ou logado) pode ENVIAR; ninguém LÊ pelo app —
-- só o dono, pelo painel do Supabase (ou via service_role).
-- ----------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null check (category in ('bug', 'sugestao', 'opiniao', 'outro')),
  rating int check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 4000),
  contact_email text,
  page text,
  user_agent text,
  profile_name text,
  user_id uuid references auth.users (id) on delete set null
);

alter table public.feedback enable row level security;

-- Enviar: liberado para todos (anon e autenticados). Sem SELECT/UPDATE/DELETE
-- por política — a leitura é feita só pelo dono no painel do Supabase.
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback
  for insert to anon, authenticated with check (
    char_length(message) between 1 and 4000
    and category in ('bug', 'sugestao', 'opiniao', 'outro')
  );

create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- Atualizar (reações): membros da mesa podem atualizar o campo de reações.
drop policy if exists rolls_update on public.roll_logs;
create policy rolls_update on public.roll_logs
  for update to authenticated using (public.is_table_member(table_id))
  with check (public.is_table_member(table_id));

-- ----------------------------------------------------------------------------
-- STORAGE: bucket público para avatares de personagens.
-- (Também dá para criar pela UI: Storage > New bucket > "avatars" > public)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Qualquer um lê (bucket público); dono da pasta (uid) gerencia seus arquivos.
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists avatars_write on storage.objects;
create policy avatars_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime (para a mesa atualizar rolagens ao vivo)
alter publication supabase_realtime add table public.roll_logs;
alter publication supabase_realtime add table public.table_members;
