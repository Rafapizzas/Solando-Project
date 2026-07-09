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
-- SHARED SKILLS (Grimório): skills criadas por jogadores, compartilhadas com
-- todos (mesmo padrão de custom_races/classes).
-- ----------------------------------------------------------------------------
create table if not exists public.shared_skills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.shared_skills enable row level security;

do $$ begin
  alter table public.shared_skills
    add constraint shared_skills_owner_slug_key unique (owner_id, slug);
exception when duplicate_object then null; end $$;

drop policy if exists shared_skills_owner_all on public.shared_skills;
create policy shared_skills_owner_all on public.shared_skills
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists shared_skills_public_read on public.shared_skills;
create policy shared_skills_public_read on public.shared_skills
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

-- Status do feedback (para marcar erros como resolvidos etc.).
alter table public.feedback
  add column if not exists status text not null default 'aberto'
  check (status in ('aberto', 'em_analise', 'resolvido', 'fechado'));

-- VIEW pública: expõe só colunas seguras (NUNCA o e-mail de contato). O mural
-- lê daqui; o e-mail fica privado (só o servidor via service_role o acessa).
create or replace view public.feedback_public as
  select id, created_at, category, rating, message, status, profile_name
  from public.feedback;

grant select on public.feedback_public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- FEEDBACK_COMMENTS: conversa pública sobre cada feedback.
-- Leitura pública; inserção só pelo servidor (service_role), que valida o
-- usuário logado e define is_admin — impede falsificar o selo de admin.
-- ----------------------------------------------------------------------------
create table if not exists public.feedback_comments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  created_at timestamptz not null default now(),
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null default 'Aventureiro',
  body text not null check (char_length(body) between 1 and 2000),
  is_admin boolean not null default false
);

alter table public.feedback_comments enable row level security;

-- Qualquer um LÊ os comentários (mural público).
drop policy if exists fc_read on public.feedback_comments;
create policy fc_read on public.feedback_comments
  for select to anon, authenticated using (true);

-- Sem policy de insert: só o service_role (rota /api/feedback/comment) escreve.

create index if not exists fc_feedback_idx on public.feedback_comments (feedback_id, created_at);

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

-- ============================================================================
-- BIG UPDATE 2026-07 — Mesa no centro, amigos+presença, convites, cópias de
-- ficha por mesa, compartilhamento de fichas e correção de privacidade.
-- Papel passa a ser POR MESA (mestre = dono; jogador = membro). Perfis globais
-- deixam de controlar acesso. Idempotente: seguro rodar novamente.
-- ============================================================================

-- 1) PROFILES: código de amigo -----------------------------------------------
alter table public.profiles add column if not exists friend_code text;
update public.profiles
  set friend_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  where friend_code is null;
do $$ begin
  alter table public.profiles add constraint profiles_friend_code_key unique (friend_code);
exception when duplicate_object then null; end $$;

-- 2) AMIZADES (pedido/aceito/bloqueado) --------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships
  for insert to authenticated with check (requester_id = auth.uid());
drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships
  for select to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships
  for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships
  for delete to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

-- 3) PRESENÇA (online/offline/em sessão/mestrando) ---------------------------
create table if not exists public.user_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'offline'
    check (status in ('online', 'offline', 'in_session', 'mastering')),
  current_table_id uuid references public.campaigns (id) on delete set null,
  last_seen timestamptz not null default now()
);
alter table public.user_presence enable row level security;

drop policy if exists presence_self on public.user_presence;
create policy presence_self on public.user_presence
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists presence_friends_read on public.user_presence;
create policy presence_friends_read on public.user_presence
  for select to authenticated
  using (user_id = auth.uid() or public.are_friends(user_id, auth.uid()));

alter publication supabase_realtime add table public.user_presence;

-- 4) TABLE_MEMBERS: status do convite (pendente/aceito) ----------------------
alter table public.table_members
  add column if not exists status text not null default 'accepted'
  check (status in ('pending', 'accepted'));

-- 5) CONVITES DE MESA (código/link + e-mail) ---------------------------------
create table if not exists public.table_invites (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.campaigns (id) on delete cascade,
  code text not null unique,
  invited_email text,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz,
  max_uses int,
  uses int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.table_invites enable row level security;

drop policy if exists invites_manage on public.table_invites;
create policy invites_manage on public.table_invites
  for all to authenticated
  using (public.can_manage_table(table_id)) with check (public.can_manage_table(table_id));
-- Leitura liberada para autenticados: valida o código ao entrar (códigos são aleatórios).
drop policy if exists invites_read on public.table_invites;
create policy invites_read on public.table_invites
  for select to authenticated using (true);

-- 6) TABLE_CHARACTERS: cópia INDEPENDENTE da ficha por mesa ------------------
-- Cada mesa tem sua própria cópia; feitos/progresso de uma mesa não afetam a
-- outra. owner_id = quem controla a ficha nesta mesa.
create table if not exists public.table_characters (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.campaigns (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  base_character_id uuid references public.characters (id) on delete set null,
  name text not null default '',
  avatar_url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.table_characters enable row level security;

-- O controlador tem acesso total à sua instância.
drop policy if exists tchar_owner_all on public.table_characters;
create policy tchar_owner_all on public.table_characters
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- O mestre/gerente da mesa lê e ajusta as instâncias da mesa dele.
drop policy if exists tchar_master_all on public.table_characters;
create policy tchar_master_all on public.table_characters
  for all to authenticated
  using (public.can_manage_table(table_id)) with check (public.can_manage_table(table_id));
-- Jogadores NÃO veem as instâncias uns dos outros (sem política de leitura ampla).

create index if not exists tchar_table_idx on public.table_characters (table_id);

-- 7) CHARACTER_GRANTS: dono compartilha o controle de uma ficha base ---------
create table if not exists public.character_grants (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  grantee_id uuid not null references auth.users (id) on delete cascade,
  permission text not null default 'use' check (permission in ('view', 'use', 'edit')),
  created_at timestamptz not null default now(),
  unique (character_id, grantee_id)
);
alter table public.character_grants enable row level security;

create or replace function public.has_character_grant(cid uuid, uid uuid, minperm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.character_grants g
    where g.character_id = cid and g.grantee_id = uid
      and (
        minperm = 'view'
        or (minperm = 'use' and g.permission in ('use', 'edit'))
        or (minperm = 'edit' and g.permission = 'edit')
      )
  );
$$;

drop policy if exists grants_owner on public.character_grants;
create policy grants_owner on public.character_grants
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists grants_grantee_read on public.character_grants;
create policy grants_grantee_read on public.character_grants
  for select to authenticated using (grantee_id = auth.uid());

-- 8) PRIVACIDADE: fichas base deixam de vazar entre jogadores -----------------
-- ANTES: qualquer membro da mesa lia a ficha base de qualquer outro. AGORA a
-- ficha base é privada: dono + pública + quem recebeu permissão explícita.
-- O mestre vê as fichas dos jogadores da mesa via public.table_characters.
drop policy if exists characters_member_read on public.characters;
drop policy if exists characters_granted_read on public.characters;
create policy characters_granted_read on public.characters
  for select to authenticated using (public.has_character_grant(id, auth.uid(), 'view'));

-- ============================================================================
-- BIG UPDATE 2026-07 (parte 2) — Menu do Mestre (NPCs) + Player de Música.
-- NPCs: biblioteca privada do mestre (reutilizável entre mesas), com opção de
-- tornar público. Ao colocar um NPC na mesa, os jogadores veem apenas um CARD
-- (nome + imagem) — NUNCA a história/objetivo/status. Cada jogador tem suas
-- próprias anotações no card. Música: estado de reprodução sincronizado por
-- mesa (YouTube), controlado pelo mestre. Idempotente.
-- ============================================================================

-- 9) NPCS: biblioteca do mestre (reutilizável entre mesas) --------------------
create table if not exists public.npcs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  image_url text,
  lore text not null default '',        -- história / background (privado do mestre)
  objective text not null default '',   -- objetivo do NPC (privado)
  location text not null default '',    -- localização (privado)
  hostile boolean not null default false,
  is_generic boolean not null default false, -- capanga/figurante reutilizável
  is_public boolean not null default false,  -- compartilhado com a comunidade
  data jsonb not null default '{}'::jsonb,   -- atributos/status opcionais (privado)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.npcs enable row level security;

-- O dono (mestre) gerencia seus NPCs por completo.
drop policy if exists npcs_owner on public.npcs;
create policy npcs_owner on public.npcs
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- NPCs públicos são visíveis (como referência) a todos os autenticados.
drop policy if exists npcs_public_read on public.npcs;
create policy npcs_public_read on public.npcs
  for select to authenticated using (is_public = true);

create index if not exists npcs_owner_idx on public.npcs (owner_id);
create index if not exists npcs_public_idx on public.npcs (is_public) where is_public = true;

-- 10) TABLE_NPCS: NPC colocado numa mesa (card visível aos jogadores) ---------
-- Guarda um SNAPSHOT só do que os jogadores podem ver (nome + imagem). Assim a
-- história/objetivo/status ficam na tabela `npcs` (privada do dono) e nunca
-- vazam para os jogadores, mesmo que a linha da mesa seja legível a todos.
create table if not exists public.table_npcs (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.campaigns (id) on delete cascade,
  npc_id uuid references public.npcs (id) on delete set null,
  added_by uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  image_url text,
  hostile boolean not null default false, -- só indica cor do card; não revela status
  created_at timestamptz not null default now()
);
alter table public.table_npcs enable row level security;

-- O mestre/gerente da mesa coloca e remove NPCs.
drop policy if exists tnpc_manage on public.table_npcs;
create policy tnpc_manage on public.table_npcs
  for all to authenticated
  using (public.can_manage_table(table_id)) with check (public.can_manage_table(table_id));
-- Membros da mesa leem os cards (só o snapshot: nome + imagem).
drop policy if exists tnpc_member_read on public.table_npcs;
create policy tnpc_member_read on public.table_npcs
  for select to authenticated using (public.is_table_member(table_id));

create index if not exists tnpc_table_idx on public.table_npcs (table_id);

-- 11) NPC_NOTES: anotações do jogador sobre um NPC (privadas por jogador) -----
create table if not exists public.npc_notes (
  id uuid primary key default gen_random_uuid(),
  table_npc_id uuid not null references public.table_npcs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (table_npc_id, user_id)
);
alter table public.npc_notes enable row level security;

-- Cada usuário só vê/edita as SUAS anotações.
drop policy if exists npc_notes_self on public.npc_notes;
create policy npc_notes_self on public.npc_notes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists npc_notes_tnpc_idx on public.npc_notes (table_npc_id);

-- 12) TABLE_MUSIC: estado de reprodução sincronizado por mesa -----------------
-- O mestre controla; os jogadores acompanham via realtime (YouTube sincronizado).
create table if not exists public.table_music (
  table_id uuid primary key references public.campaigns (id) on delete cascade,
  provider text not null default 'youtube' check (provider in ('youtube', 'spotify')),
  url text,
  video_id text,
  title text not null default '',
  is_playing boolean not null default false,
  position_seconds double precision not null default 0,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.table_music enable row level security;

-- Membros leem o estado; só o mestre/gerente controla.
drop policy if exists music_read on public.table_music;
create policy music_read on public.table_music
  for select to authenticated using (public.is_table_member(table_id));
drop policy if exists music_manage on public.table_music;
create policy music_manage on public.table_music
  for all to authenticated
  using (public.can_manage_table(table_id)) with check (public.can_manage_table(table_id));

-- 13) MUSIC_TRACKS: playlist da mesa -----------------------------------------
create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.campaigns (id) on delete cascade,
  provider text not null default 'youtube' check (provider in ('youtube', 'spotify')),
  url text not null,
  video_id text,
  title text not null default '',
  position int not null default 0,
  added_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.music_tracks enable row level security;

drop policy if exists tracks_read on public.music_tracks;
create policy tracks_read on public.music_tracks
  for select to authenticated using (public.is_table_member(table_id));
drop policy if exists tracks_manage on public.music_tracks;
create policy tracks_manage on public.music_tracks
  for all to authenticated
  using (public.can_manage_table(table_id)) with check (public.can_manage_table(table_id));

create index if not exists tracks_table_idx on public.music_tracks (table_id, position);

-- Realtime: cards de NPC e player de música ao vivo.
alter publication supabase_realtime add table public.table_npcs;
alter publication supabase_realtime add table public.table_music;
alter publication supabase_realtime add table public.music_tracks;
