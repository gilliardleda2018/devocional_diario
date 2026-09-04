-- ============================================================================
-- Migração Schema v2: Cadastro, Username, Amizades, Bloqueios e Notificações
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- ============================================================================

-- 1. Extensão da Tabela profiles
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists nome_completo text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists cidade text;
alter table public.profiles add column if not exists igreja text;
alter table public.profiles add column if not exists status text default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'));
alter table public.profiles add column if not exists atualizado_em timestamptz default now();

-- Garantir que username seja único e em minúsculas se preenchido
create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username)) where username is not null;

-- Policy de visibilidade pública ajustada de profiles para busca de conexões
drop policy if exists "qualquer autenticado lê perfis públicos" on public.profiles;
create policy "qualquer autenticado lê perfis públicos"
  on public.profiles for select
  using (
    auth.uid() is not null
    and status = 'ACTIVE'
    and not exists (
      select 1 from public.user_blocks ub
      where (ub.blocker_id = auth.uid() and ub.blocked_id = public.profiles.id)
         or (ub.blocker_id = public.profiles.id and ub.blocked_id = auth.uid())
    )
  );

-- 2. Tabela de Notificações
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete cascade,
  type text not null check (type in ('FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'NEW_FOLLOWER', 'PRAYER_INTERACTION', 'COMMUNITY_INVITE', 'SYSTEM')),
  entity_id text,
  is_read boolean not null default false,
  criado_em timestamptz not null default now(),
  lido_em timestamptz
);

alter table public.notifications enable row level security;

drop policy if exists "usuário lê suas notificações" on public.notifications;
create policy "usuário lê suas notificações"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "usuário atualiza suas notificações" on public.notifications;
create policy "usuário atualiza suas notificações"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "usuário deleta suas notificações" on public.notifications;
create policy "usuário deleta suas notificações"
  on public.notifications for delete
  using (auth.uid() = user_id);

create index if not exists idx_notifications_user_unread on public.notifications (user_id, is_read, criado_em desc);

-- 3. Função para obter o estado único do relacionamento (get_relationship_state)
create or replace function public.get_relationship_state(p_target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_blocked_by_me boolean;
  v_blocked_by_other boolean;
  v_friendship public.amizades;
begin
  if v_user_id = p_target_id then
    return 'SELF';
  end if;

  -- Verificação de bloqueios
  select exists(select 1 from public.user_blocks where blocker_id = v_user_id and blocked_id = p_target_id) into v_blocked_by_me;
  if v_blocked_by_me then
    return 'BLOCKED_BY_ME';
  end if;

  select exists(select 1 from public.user_blocks where blocker_id = p_target_id and blocked_id = v_user_id) into v_blocked_by_other;
  if v_blocked_by_other then
    return 'BLOCKED_BY_OTHER';
  end if;

  -- Verificação de amizade
  select * into v_friendship from public.amizades
  where (solicitante_id = v_user_id and destinatario_id = p_target_id)
     or (solicitante_id = p_target_id and destinatario_id = v_user_id)
  limit 1;

  if v_friendship.id is null then
    return 'NONE';
  end if;

  if v_friendship.status = 'aceita' then
    return 'FRIENDS';
  end if;

  if v_friendship.status = 'pendente' then
    if v_friendship.solicitante_id = v_user_id then
      return 'REQUEST_SENT';
    else
      return 'REQUEST_RECEIVED';
    end if;
  end if;

  return 'NONE';
end;
$$;

grant execute on function public.get_relationship_state(uuid) to authenticated;

-- 4. Função Atualizada para Enviar Pedido de Amizade (com suporte a código, ID ou username)
create or replace function public.enviar_pedido_amizade_v2(p_identificador text)
returns public.amizades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_destinatario_id uuid;
  v_existente public.amizades;
  v_resultado public.amizades;
  v_bloqueado boolean;
  v_permite_pedidos boolean;
  v_limite_diario boolean;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  -- Identifica o destinatário por UUID, codigo_amigo ou username
  select id into v_destinatario_id
  from public.profiles
  where id::text = trim(p_identificador)
     or lower(codigo_amigo) = lower(trim(p_identificador))
     or lower(username) = lower(replace(trim(p_identificador), '@', ''))
  limit 1;

  if v_destinatario_id is null then
    raise exception 'Usuário não encontrado';
  end if;

  if v_destinatario_id = v_user_id then
    raise exception 'Você não pode adicionar a si mesmo';
  end if;

  -- Verifica bloqueio
  select exists(
    select 1 from public.user_blocks
    where (blocker_id = v_user_id and blocked_id = v_destinatario_id)
       or (blocker_id = v_destinatario_id and blocked_id = v_user_id)
  ) into v_bloqueado;

  if v_bloqueado then
    raise exception 'Não é possível solicitar amizade a este usuário';
  end if;

  -- Verifica configuração de privacidade do destinatário
  select coalesce(allow_friend_requests, true) into v_permite_pedidos
  from public.user_privacy_settings
  where user_id = v_destinatario_id;

  if not v_permite_pedidos then
    raise exception 'Este usuário não está aceitando novas solicitações de amizade';
  end if;

  -- Verifica amizade/pedido existente
  select * into v_existente from public.amizades
  where (solicitante_id = v_user_id and destinatario_id = v_destinatario_id)
     or (solicitante_id = v_destinatario_id and destinatario_id = v_user_id)
  limit 1;

  if v_existente.id is not null then
    if v_existente.status = 'aceita' then
      raise exception 'Vocês já são amigos';
    elsif v_existente.solicitante_id = v_user_id and v_existente.status = 'pendente' then
      raise exception 'Solicitação já enviada anteriormente';
    elsif v_existente.solicitante_id = v_destinatario_id and v_existente.status = 'pendente' then
      -- Pedido Cruzado: Aceita automaticamente!
      update public.amizades
      set status = 'aceita', respondido_em = now()
      where id = v_existente.id
      returning * into v_resultado;

      -- Notificação de aceite
      insert into public.notifications (user_id, actor_user_id, type, entity_id)
      values (v_destinatario_id, v_user_id, 'FRIEND_REQUEST_ACCEPTED', v_resultado.id::text)
      on conflict do nothing;

      return v_resultado;
    else
      -- Se estava recusada ou cancelada, reabre como pendente
      update public.amizades
      set solicitante_id = v_user_id,
          destinatario_id = v_destinatario_id,
          status = 'pendente',
          criado_em = now(),
          respondido_em = null
      where id = v_existente.id
      returning * into v_resultado;
    end if;
  else
    -- Cria nova solicitação
    insert into public.amizades (solicitante_id, destinatario_id, status)
    values (v_user_id, v_destinatario_id, 'pendente')
    returning * into v_resultado;
  end if;

  -- Notificação para o destinatário
  insert into public.notifications (user_id, actor_user_id, type, entity_id)
  values (v_destinatario_id, v_user_id, 'FRIEND_REQUEST_RECEIVED', v_resultado.id::text)
  on conflict do nothing;

  return v_resultado;
end;
$$;

grant execute on function public.enviar_pedido_amizade_v2(text) to authenticated;

-- 5. Função para Cancelar Pedido de Amizade (cancelar_pedido_amizade)
create or replace function public.cancelar_pedido_amizade(p_amizade_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  delete from public.amizades
  where id = p_amizade_id
    and solicitante_id = v_user_id
    and status = 'pendente';

  -- Remove notificação pendente associada
  delete from public.notifications
  where entity_id = p_amizade_id::text
    and type = 'FRIEND_REQUEST_RECEIVED';
end;
$$;

grant execute on function public.cancelar_pedido_amizade(uuid) to authenticated;

-- 6. Função para Remover Amizade por ID do Amigo (remover_amizade)
create or replace function public.remover_amizade(p_amigo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  delete from public.amizades
  where (solicitante_id = v_user_id and destinatario_id = p_amigo_id)
     or (solicitante_id = p_amigo_id and destinatario_id = v_user_id);
end;
$$;

grant execute on function public.remover_amizade(uuid) to authenticated;

-- 7. Responder Pedido com Atualização de Notificações
create or replace function public.responder_pedido_amizade_v2(p_amizade_id uuid, p_aceitar boolean)
returns public.amizades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_resultado public.amizades;
begin
  if p_aceitar then
    update public.amizades
    set status = 'aceita', respondido_em = now()
    where id = p_amizade_id and destinatario_id = v_user_id and status = 'pendente'
    returning * into v_resultado;

    if v_resultado.id is not null then
      -- Notifica o solicitante que o pedido foi aceito
      insert into public.notifications (user_id, actor_user_id, type, entity_id)
      values (v_resultado.solicitante_id, v_user_id, 'FRIEND_REQUEST_ACCEPTED', v_resultado.id::text)
      on conflict do nothing;
    end if;
  else
    -- Rejeição discreta: remove o pedido da lista
    delete from public.amizades
    where id = p_amizade_id and destinatario_id = v_user_id and status = 'pendente';
  end if;

  -- Marca notificação original de pedido recebido como lida/resolvida
  update public.notifications
  set is_read = true, lido_em = now()
  where entity_id = p_amizade_id::text and user_id = v_user_id;

  return v_resultado;
end;
$$;

grant execute on function public.responder_pedido_amizade_v2(uuid, boolean) to authenticated;

-- 8. Busca de Usuários Paginada e Filtrada por Privacidade / Bloqueios
create or replace function public.buscar_usuarios(
  p_termo text,
  p_limite integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  nome_exibicao text,
  nome_completo text,
  username text,
  foto_url text,
  cidade text,
  igreja text,
  codigo_amigo text,
  relationship_state text,
  mutual_friends_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_busca text := lower(trim(p_termo));
begin
  return query
  select
    p.id,
    p.nome_exibicao,
    p.nome_completo,
    p.username,
    p.foto_url,
    case when coalesce(ups.show_city, true) then p.cidade else null end as cidade,
    case when coalesce(ups.show_church, true) then p.igreja else null end as igreja,
    p.codigo_amigo,
    public.get_relationship_state(p.id) as relationship_state,
    (
      select count(*)
      from public.amizades a1
      join public.amizades a2 on (
        (a2.solicitante_id = p.id and a2.destinatario_id = case when a1.solicitante_id = v_user_id then a1.destinatario_id else a1.solicitante_id end)
        or
        (a2.destinatario_id = p.id and a2.solicitante_id = case when a1.solicitante_id = v_user_id then a1.destinatario_id else a1.solicitante_id end)
      )
      where a1.status = 'aceita' and a2.status = 'aceita'
        and (a1.solicitante_id = v_user_id or a1.destinatario_id = v_user_id)
        and (case when a1.solicitante_id = v_user_id then a1.destinatario_id else a1.solicitante_id end) <> p.id
    ) as mutual_friends_count
  from public.profiles p
  left join public.user_privacy_settings ups on ups.user_id = p.id
  where p.id <> v_user_id
    and coalesce(p.status, 'ACTIVE') = 'ACTIVE'
    and coalesce(ups.discoverable, true) = true
    and not exists (
      select 1 from public.user_blocks ub
      where (ub.blocker_id = v_user_id and ub.blocked_id = p.id)
         or (ub.blocker_id = p.id and ub.blocked_id = v_user_id)
    )
    and (
      length(v_busca) = 0
      or lower(coalesce(p.nome_exibicao, '')) like '%' || v_busca || '%'
      or lower(coalesce(p.nome_completo, '')) like '%' || v_busca || '%'
      or lower(coalesce(p.username, '')) like '%' || v_busca || '%'
      or lower(coalesce(p.codigo_amigo, '')) = v_busca
      or (coalesce(ups.show_city, true) and lower(coalesce(p.cidade, '')) like '%' || v_busca || '%')
      or (coalesce(ups.show_church, true) and lower(coalesce(p.igreja, '')) like '%' || v_busca || '%')
    )
  order by mutual_friends_count desc, p.nome_exibicao ascii
  limit p_limite
  offset p_offset;
end;
$$;

grant execute on function public.buscar_usuarios(text, integer, integer) to authenticated;

-- 9. Amigos em Comum Detalhado
create or replace function public.obter_amigos_em_comum(p_target_id uuid)
returns table(
  total_mutuos bigint,
  amigo_id uuid,
  nome_exibicao text,
  foto_url text
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
    select case when solicitante_id = v_user_id then destinatario_id else solicitante_id end as id
    from public.amizades
    where status = 'aceita' and (solicitante_id = v_user_id or destinatario_id = v_user_id)
  ),
  amigos_target as (
    select case when solicitante_id = p_target_id then destinatario_id else solicitante_id end as id
    from public.amizades
    where status = 'aceita' and (solicitante_id = p_target_id or destinatario_id = p_target_id)
  ),
  mutuos as (
    select ma.id from meus_amigos ma join amigos_target at on ma.id = at.id
  ),
  total as (
    select count(*) as cnt from mutuos
  )
  select
    t.cnt as total_mutuos,
    p.id as amigo_id,
    p.nome_exibicao,
    p.foto_url
  from total t
  left join mutuos m on true
  left join public.profiles p on p.id = m.id
  limit 3;
end;
$$;

grant execute on function public.obter_amigos_em_comum(uuid) to authenticated;

-- 10. RPCs para Gerenciamento de Notificações
create or replace function public.obter_notificacoes(p_limite integer default 30)
returns table(
  id uuid,
  type text,
  entity_id text,
  is_read boolean,
  criado_em timestamptz,
  actor_id uuid,
  actor_nome text,
  actor_username text,
  actor_foto_url text
)
language sql
security definer
set search_path = public
as $$
  select
    n.id,
    n.type,
    n.entity_id,
    n.is_read,
    n.criado_em,
    p.id as actor_id,
    p.nome_exibicao as actor_nome,
    p.username as actor_username,
    p.foto_url as actor_foto_url
  from public.notifications n
  left join public.profiles p on p.id = n.actor_user_id
  where n.user_id = auth.uid()
  order by n.criado_em desc
  limit p_limite;
$$;

grant execute on function public.obter_notificacoes(integer) to authenticated;

create or replace function public.marcar_notificacao_lida(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set is_read = true, lido_em = now()
  where id = p_id and user_id = auth.uid();
$$;

grant execute on function public.marcar_notificacao_lida(uuid) to authenticated;

create or replace function public.marcar_todas_notificacoes_lidas()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set is_read = true, lido_em = now()
  where user_id = auth.uid() and is_read = false;
$$;

grant execute on function public.marcar_todas_notificacoes_lidas() to authenticated;
