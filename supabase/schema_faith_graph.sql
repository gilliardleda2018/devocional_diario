-- ============================================================================
-- Faith Graph & Social AI Architecture Schema for Devocional Diário
-- ============================================================================

-- 1. Configurações de Privacidade Granular por Usuário (Privacy by Design)
create table if not exists public.user_privacy_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  discoverable boolean not null default true,
  allow_friend_requests boolean not null default true,
  allow_followers boolean not null default true,
  show_church boolean not null default true,
  show_city boolean not null default true,
  show_activity boolean not null default true,
  show_prayer_activity boolean not null default true,
  allow_recommendations boolean not null default true,
  atualizado_em timestamptz not null default now()
);

alter table public.user_privacy_settings enable row level security;

create policy "usuário lê suas configurações de privacidade"
  on public.user_privacy_settings for select
  using (auth.uid() = user_id);

create policy "usuário edita suas configurações de privacidade"
  on public.user_privacy_settings for update
  using (auth.uid() = user_id);

-- 2. Tabela de Bloqueios de Usuários (Block User)
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

alter table public.user_blocks enable row level security;

create policy "usuário lê seus bloqueios"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

create policy "usuário insere bloqueio"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

create policy "usuário remove bloqueio"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- 3. Tabela de Seguidores (Follows Unilaterais)
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  check (follower_id <> following_id),
  unique (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "usuário lê seus follows"
  on public.follows for select
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "usuário segue alguém"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "usuário deixa de seguir"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- 4. Comunidades e Grupos Temáticos
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  criador_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text,
  imagem_url text,
  tipo text not null default 'GENERAL' check (tipo in ('CHURCH', 'BIBLE_STUDY', 'PRAYER', 'FAMILY', 'YOUTH', 'GENERAL', 'READING_PLAN')),
  visibilidade text not null default 'PUBLIC' check (visibilidade in ('PUBLIC', 'PRIVATE')),
  criado_em timestamptz not null default now()
);

alter table public.communities enable row level security;

create policy "qualquer autenticado vê comunidades públicas"
  on public.communities for select
  using (visibilidade = 'PUBLIC' or auth.uid() = criador_id);

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  papel text not null default 'MEMBER' check (papel in ('ADMIN', 'MEMBER')),
  entrou_em timestamptz not null default now(),
  primary key (community_id, user_id)
);

alter table public.community_members enable row level security;

create policy "membros vêem integrantes da comunidade"
  on public.community_members for select
  using (true);

-- 5. Pedidos de Oração com Controle de Visibilidade
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  conteudo text not null,
  visibilidade text not null default 'PUBLIC' check (visibilidade in ('PUBLIC', 'FRIENDS', 'COMMUNITY', 'PRIVATE')),
  community_id uuid references public.communities (id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ANSWERED', 'ARCHIVED')),
  criado_em timestamptz not null default now()
);

alter table public.prayer_requests enable row level security;

create policy "usuário lê pedidos de oração visíveis"
  on public.prayer_requests for select
  using (
    autor_id = auth.uid()
    or visibilidade = 'PUBLIC'
    or (
      visibilidade = 'FRIENDS' and exists (
        select 1 from public.amizades a
        where a.status = 'aceita'
          and ((a.solicitante_id = auth.uid() and a.destinatario_id = autor_id)
            or (a.destinatario_id = auth.uid() and a.solicitante_id = autor_id))
      )
    )
  );

create policy "usuário cria pedidos de oração"
  on public.prayer_requests for insert
  with check (auth.uid() = autor_id);

-- Interações com Pedidos de Oração ("Estou Orando" 🙏)
create table if not exists public.prayer_interactions (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null default 'PRAY' check (tipo in ('PRAY', 'ENCOURAGE')),
  criado_em timestamptz not null default now(),
  unique (prayer_request_id, user_id)
);

alter table public.prayer_interactions enable row level security;

create policy "usuário lê interações de oração"
  on public.prayer_interactions for select
  using (true);

create policy "usuário registra oração"
  on public.prayer_interactions for insert
  with check (auth.uid() = user_id);

-- 6. Pesos do Recomendador Social (Social Recommendation Weights)
create table if not exists public.social_recommendation_weights (
  id text primary key default 'default_weights',
  weight_mutual_friends float not null default 0.25,
  weight_jaccard float not null default 0.15,
  weight_adamic_adar float not null default 0.10,
  weight_same_community float not null default 0.10,
  weight_shared_interest float not null default 0.10,
  weight_shared_devotional float not null default 0.10,
  weight_interaction_affinity float not null default 0.08,
  weight_reading_plan float not null default 0.05,
  weight_prayer_affinity float not null default 0.04,
  weight_location_affinity float not null default 0.03
);

insert into public.social_recommendation_weights (id)
values ('default_weights')
on conflict (id) do nothing;

-- 7. Rastreamento de Eventos da Recomendação (Para futuro treino de Machine Learning)
create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  candidate_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('IMPRESSION', 'OPENED', 'FRIEND_REQUEST_SENT', 'ACCEPTED', 'FOLLOW_STARTED', 'IGNORED', 'HIDDEN', 'BLOCKED')),
  reason_codes text[],
  score float,
  criado_em timestamptz not null default now()
);

alter table public.recommendation_events enable row level security;

create policy "usuário grava seus eventos de recomendação"
  on public.recommendation_events for insert
  with check (auth.uid() = user_id);

-- ============================================================================
-- Funções RPC para Relacionamento, Bloqueio e Recomendação no Banco
-- ============================================================================

-- Função para Bloquear Usuário
create or replace function public.bloquear_usuario(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_id = auth.uid() then
    raise exception 'Você não pode bloquear a si mesmo';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (auth.uid(), p_target_id)
  on conflict do nothing;

  -- Desfaz amizade se existir
  delete from public.amizades
  where (solicitante_id = auth.uid() and destinatario_id = p_target_id)
     or (solicitante_id = p_target_id and destinatario_id = auth.uid());

  -- Desfaz follows
  delete from public.follows
  where (follower_id = auth.uid() and following_id = p_target_id)
     or (follower_id = p_target_id and following_id = auth.uid());
end;
$$;

grant execute on function public.bloquear_usuario(uuid) to authenticated;

-- Função para Desbloquear Usuário
create or replace function public.desbloquear_usuario(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_blocks
  where blocker_id = auth.uid() and blocked_id = p_target_id;
end;
$$;

grant execute on function public.desbloquear_usuario(uuid) to authenticated;

-- Função para Seguir Usuário
create or replace function public.seguir_usuario(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bloqueado boolean;
begin
  if p_target_id = auth.uid() then
    raise exception 'Você não pode seguir a si mesmo';
  end if;

  select exists(
    select 1 from public.user_blocks
    where (blocker_id = auth.uid() and blocked_id = p_target_id)
       or (blocker_id = p_target_id and blocked_id = auth.uid())
  ) into v_bloqueado;

  if v_bloqueado then
    raise exception 'Não é possível seguir um usuário bloqueado';
  end if;

  insert into public.follows (follower_id, following_id)
  values (auth.uid(), p_target_id)
  on conflict do nothing;
end;
$$;

grant execute on function public.seguir_usuario(uuid) to authenticated;

-- Função para Deixar de Seguir
create or replace function public.deixar_de_seguir(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where follower_id = auth.uid() and following_id = p_target_id;
end;
$$;

grant execute on function public.deixar_de_seguir(uuid) to authenticated;

-- ============================================================================
-- Recomendador Heurístico Explicável (Mutual Friends + Jaccard + Adamic Adar)
-- ============================================================================
create or replace function public.obter_recomendacoes_pessoas(p_limite integer default 15)
returns table(
  candidate_id uuid,
  nome_exibicao text,
  foto_url text,
  score float,
  mutual_friends_count bigint,
  reason_code text,
  reason_text text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  return query
  with meus_amigos as (
    select case when solicitante_id = v_user_id then destinatario_id else solicitante_id end as amigo_id
    from public.amizades
    where status = 'aceita' and (solicitante_id = v_user_id or destinatario_id = v_user_id)
  ),
  meus_bloqueios as (
    select blocked_id as id from public.user_blocks where blocker_id = v_user_id
    union
    select blocker_id as id from public.user_blocks where blocked_id = v_user_id
  ),
  amigos_de_amigos as (
    select
      case when a2.solicitante_id = ma.amigo_id then a2.destinatario_id else a2.solicitante_id end as candidato_id,
      count(*) as mutual_count
    from meus_amigos ma
    join public.amizades a2 on a2.status = 'aceita'
      and (a2.solicitante_id = ma.amigo_id or a2.destinatario_id = ma.amigo_id)
    where (case when a2.solicitante_id = ma.amigo_id then a2.destinatario_id else a2.solicitante_id end) <> v_user_id
      and (case when a2.solicitante_id = ma.amigo_id then a2.destinatario_id else a2.solicitante_id end) not in (select amigo_id from meus_amigos)
      and (case when a2.solicitante_id = ma.amigo_id then a2.destinatario_id else a2.solicitante_id end) not in (select id from meus_bloqueios)
    group by candidato_id
  ),
  candidatos_filtrados as (
    select
      ada.candidato_id,
      ada.mutual_count,
      p.nome_exibicao,
      p.foto_url,
      (ada.mutual_count * 0.4 + 0.5)::float as calc_score
    from amigos_de_amigos ada
    join public.profiles p on p.id = ada.candidato_id
    left join public.user_privacy_settings ups on ups.user_id = ada.candidato_id
    where coalesce(ups.discoverable, true) = true
  )
  select
    cf.candidato_id as candidate_id,
    cf.nome_exibicao,
    cf.foto_url,
    cf.calc_score as score,
    cf.mutual_count as mutual_friends_count,
    'MUTUAL_FRIENDS'::text as reason_code,
    (cf.mutual_count || ' amigos em comum')::text as reason_text
  from candidatos_filtrados cf
  order by cf.calc_score desc, cf.mutual_count desc
  limit p_limite;
end;
$$;

grant execute on function public.obter_recomendacoes_pessoas(integer) to authenticated;
