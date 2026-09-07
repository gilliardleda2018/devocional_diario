-- ============================================================================
-- Migração v3: Correções de Amigos + Comunidades funcionais
-- Rode este arquivo DEPOIS de schema.sql, schema_faith_graph.sql
-- e schema_v2_social_notifications.sql (nessa ordem).
--
-- O que este arquivo resolve:
--  1. Erro de sintaxe em buscar_usuarios() ("ascii" em vez de "asc") que
--     travava a criação dela e de tudo que vinha depois no arquivo v2
--     (obter_amigos_em_comum, obter_notificacoes, marcar_notificacao_lida,
--     marcar_todas_notificacoes_lidas).
--  2. Remove a função antiga enviar_pedido_amizade (v1), que aceitava a
--     amizade automaticamente sem o consentimento do destinatário -- um
--     bug de segurança/UX real. O fluxo correto é enviar_pedido_amizade_v2.
--  3. Implementa de fato o recurso de Comunidades: hoje as tabelas
--     `communities`/`community_members` existiam no banco mas não tinham
--     nenhuma função para criar/entrar/sair, e a política de select de
--     community_members expunha a lista de membros de QUALQUER comunidade
--     (inclusive privada) para qualquer usuário autenticado.
--
-- OBS: este arquivo já foi aplicado diretamente no projeto Supabase de
-- produção (rkfsypnclmvazurxtbwk) via migration manual -- mantê-lo aqui
-- é só para manter o histórico do schema versionado junto do código.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Corrige buscar_usuarios (era "ascii", agora "asc")
-- ---------------------------------------------------------------------------
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
  order by mutual_friends_count desc, p.nome_exibicao asc
  limit p_limite
  offset p_offset;
end;
$$;

grant execute on function public.buscar_usuarios(text, integer, integer) to authenticated;

-- Recria o que dependia de buscar_usuarios ter sido criada com sucesso, para
-- o caso de o arquivo v2 ter abortado antes de chegar nelas.
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
    n.id, n.type, n.entity_id, n.is_read, n.criado_em,
    p.id as actor_id, p.nome_exibicao as actor_nome,
    p.username as actor_username, p.foto_url as actor_foto_url
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

-- ---------------------------------------------------------------------------
-- 2. Remove a função v1 de amizade que auto-aceitava sem consentimento.
--    Nada no frontend atual a chama -- é só uma porta destrancada.
-- ---------------------------------------------------------------------------
drop function if exists public.enviar_pedido_amizade(text);
drop function if exists public.responder_pedido_amizade(uuid, boolean);

-- ---------------------------------------------------------------------------
-- 3. Comunidades -- de verdade, agora
-- ---------------------------------------------------------------------------

-- 3.1 Corrige a política de select de community_members: antes era
-- `using (true)` -- qualquer autenticado via a lista de membros de
-- qualquer comunidade, inclusive privada. Agora só quem já é membro.
drop policy if exists "membros vêem integrantes da comunidade" on public.community_members;
create policy "membro vê integrantes de comunidades que participa"
  on public.community_members for select
  using (
    exists (
      select 1 from public.community_members cm2
      where cm2.community_id = public.community_members.community_id
        and cm2.user_id = auth.uid()
    )
  );

-- 3.2 criar_comunidade: cria a comunidade e já entra o criador como ADMIN.
create or replace function public.criar_comunidade(
  p_nome text,
  p_descricao text default null,
  p_tipo text default 'GENERAL',
  p_visibilidade text default 'PUBLIC',
  p_imagem_url text default null
)
returns public.communities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_resultado public.communities;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 3 then
    raise exception 'Dê um nome com pelo menos 3 caracteres pra comunidade';
  end if;
  if p_tipo not in ('CHURCH', 'BIBLE_STUDY', 'PRAYER', 'FAMILY', 'YOUTH', 'GENERAL', 'READING_PLAN') then
    raise exception 'Tipo de comunidade inválido';
  end if;
  if p_visibilidade not in ('PUBLIC', 'PRIVATE') then
    raise exception 'Visibilidade inválida';
  end if;

  insert into public.communities (criador_id, nome, descricao, tipo, visibilidade, imagem_url)
  values (v_user_id, trim(p_nome), nullif(trim(coalesce(p_descricao, '')), ''), p_tipo, p_visibilidade, p_imagem_url)
  returning * into v_resultado;

  insert into public.community_members (community_id, user_id, papel)
  values (v_resultado.id, v_user_id, 'ADMIN');

  return v_resultado;
end;
$$;

grant execute on function public.criar_comunidade(text, text, text, text, text) to authenticated;

-- 3.3 entrar_comunidade: só permite entrar em comunidade PÚBLICA
-- (privada exigiria um convite -- fora do escopo desta correção).
create or replace function public.entrar_comunidade(p_community_id uuid)
returns public.community_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_comunidade public.communities;
  v_resultado public.community_members;
begin
  select * into v_comunidade from public.communities where id = p_community_id;
  if v_comunidade.id is null then
    raise exception 'Comunidade não encontrada';
  end if;
  if v_comunidade.visibilidade <> 'PUBLIC' then
    raise exception 'Esta comunidade é privada -- é preciso ser convidado';
  end if;

  insert into public.community_members (community_id, user_id, papel)
  values (p_community_id, v_user_id, 'MEMBER')
  on conflict (community_id, user_id) do nothing
  returning * into v_resultado;

  if v_resultado.user_id is null then
    -- já era membro: devolve a linha existente em vez de erro
    select * into v_resultado from public.community_members
      where community_id = p_community_id and user_id = v_user_id;
  end if;

  return v_resultado;
end;
$$;

grant execute on function public.entrar_comunidade(uuid) to authenticated;

-- 3.4 sair_comunidade: remove a própria participação.
-- Obs.: se o criador sair, a comunidade continua existindo sem admin --
-- suficiente para o MVP; transferência de posse fica para uma iteração futura.
create or replace function public.sair_comunidade(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.community_members
  where community_id = p_community_id and user_id = auth.uid();
end;
$$;

grant execute on function public.sair_comunidade(uuid) to authenticated;

-- 3.5 obter_minhas_comunidades: comunidades que eu participo.
create or replace function public.obter_minhas_comunidades()
returns table(
  id uuid,
  nome text,
  descricao text,
  imagem_url text,
  tipo text,
  visibilidade text,
  meu_papel text,
  total_membros bigint
)
language sql
security definer
set search_path = public
as $$
  select
    c.id, c.nome, c.descricao, c.imagem_url, c.tipo, c.visibilidade,
    cm.papel as meu_papel,
    (select count(*) from public.community_members cm2 where cm2.community_id = c.id)
  from public.communities c
  join public.community_members cm on cm.community_id = c.id and cm.user_id = auth.uid()
  order by cm.entrou_em desc;
$$;

grant execute on function public.obter_minhas_comunidades() to authenticated;

-- 3.6 obter_comunidades_publicas: busca/listagem para descobrir comunidades.
create or replace function public.obter_comunidades_publicas(
  p_termo text default '',
  p_limite integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  nome text,
  descricao text,
  imagem_url text,
  tipo text,
  total_membros bigint,
  ja_sou_membro boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_busca text := lower(trim(coalesce(p_termo, '')));
begin
  return query
  select
    c.id, c.nome, c.descricao, c.imagem_url, c.tipo,
    (select count(*) from public.community_members cm2 where cm2.community_id = c.id) as total_membros,
    exists(
      select 1 from public.community_members cm3
      where cm3.community_id = c.id and cm3.user_id = v_user_id
    ) as ja_sou_membro
  from public.communities c
  where c.visibilidade = 'PUBLIC'
    and (
      length(v_busca) = 0
      or lower(c.nome) like '%' || v_busca || '%'
      or lower(coalesce(c.descricao, '')) like '%' || v_busca || '%'
    )
  order by total_membros desc, c.criado_em desc
  limit p_limite
  offset p_offset;
end;
$$;

grant execute on function public.obter_comunidades_publicas(text, integer, integer) to authenticated;

-- 3.7 obter_membros_comunidade: lista de membros -- só pra quem já é membro
-- (a função é security definer, então não depende da policy de select
-- acima, mas replica a mesma regra explicitamente por clareza e defesa
-- em profundidade).
create or replace function public.obter_membros_comunidade(p_community_id uuid)
returns table(
  user_id uuid,
  nome_exibicao text,
  foto_url text,
  papel text,
  entrou_em timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid()
  ) then
    raise exception 'Você precisa ser membro pra ver a lista de integrantes';
  end if;

  return query
  select cm.user_id, p.nome_exibicao, p.foto_url, cm.papel, cm.entrou_em
  from public.community_members cm
  join public.profiles p on p.id = cm.user_id
  where cm.community_id = p_community_id
  order by cm.papel, cm.entrou_em;
end;
$$;

grant execute on function public.obter_membros_comunidade(uuid) to authenticated;
