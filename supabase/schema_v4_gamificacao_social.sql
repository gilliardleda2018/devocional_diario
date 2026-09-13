-- ============================================================================
-- Migração Schema v4: gamificação puxando gente pra rede social.
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
--
-- Contexto: as missões, níveis e conquistas do app eram 100% individuais --
-- nenhuma delas dependia de interagir com amigos. Isso, somado a dois bugs
-- (RLS de INSERT faltando em profiles, e "TORCIDA_RECEBIDA"/"CONVITE_ACEITO"
-- fora da whitelist de notifications.type -- ver correções abaixo, já
-- aplicadas em produção), deixava a parte social do app praticamente morta:
-- o botão de torcer sempre falhava, e convidar um amigo não criava a
-- amizade nem dava recompensa nenhuma.
--
-- Este arquivo:
--  1. Concede sementes por torcer (enviar_torcida).
--  2. Concede sementes aos dois lados quando uma amizade é aceita
--     (responder_pedido_amizade_v2 e o branch de aceite cruzado em
--     enviar_pedido_amizade_v2).
--  3. Adiciona resgatar_convite(): finalmente liga o código salvo por
--     /convite/[codigo] a uma amizade de verdade + recompensa -- antes esse
--     código só era salvo no localStorage e nunca era lido de volta.
--  4. Adiciona total_amigos em obter_estatisticas_usuario(), usado pela
--     nova missão "Sua primeira conexão".
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. enviar_torcida: +2 sementes por torcida enviada (repetível, já limitado
-- a 1x/dia por amigo pela constraint unique de torcidas).
-- ---------------------------------------------------------------------------
create or replace function public.enviar_torcida(p_destinatario_id uuid)
returns torcidas
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_amigos boolean;
  v_resultado public.torcidas;
begin
  select exists(
    select 1 from public.amizades
    where status = 'aceita'
      and ((solicitante_id = auth.uid() and destinatario_id = p_destinatario_id)
        or (solicitante_id = p_destinatario_id and destinatario_id = auth.uid()))
  ) into v_amigos;

  if not v_amigos then
    raise exception 'Vocês precisam ser amigos pra torcer';
  end if;

  insert into public.torcidas (remetente_id, destinatario_id)
    values (auth.uid(), p_destinatario_id)
    on conflict (remetente_id, destinatario_id, data) do nothing
    returning * into v_resultado;

  if v_resultado.id is null then
    raise exception 'Você já torceu por essa pessoa hoje';
  end if;

  insert into public.notifications (user_id, actor_user_id, type, entity_id)
  values (p_destinatario_id, auth.uid(), 'TORCIDA_RECEBIDA', v_resultado.id::text)
  on conflict do nothing;

  insert into public.moedas_transacoes (usuario_id, quantidade, motivo)
  values (auth.uid(), 2, 'torcida_enviada');

  return v_resultado;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Amizade aceita concede +15 sementes pra cada lado, uma única vez
-- (dispara só na transição pendente -> aceita).
-- ---------------------------------------------------------------------------
create or replace function public.responder_pedido_amizade_v2(p_amizade_id uuid, p_aceitar boolean)
returns amizades
language plpgsql
security definer
set search_path to 'public'
as $function$
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
      insert into public.notifications (user_id, actor_user_id, type, entity_id)
      values (v_resultado.solicitante_id, v_user_id, 'FRIEND_REQUEST_ACCEPTED', v_resultado.id::text)
      on conflict do nothing;

      insert into public.moedas_transacoes (usuario_id, quantidade, motivo)
      values (v_resultado.solicitante_id, 15, 'amizade_aceita'),
             (v_resultado.destinatario_id, 15, 'amizade_aceita');
    end if;
  else
    delete from public.amizades
    where id = p_amizade_id and destinatario_id = v_user_id and status = 'pendente';
  end if;

  update public.notifications
  set is_read = true, lido_em = now()
  where entity_id = p_amizade_id::text and user_id = v_user_id;

  return v_resultado;
end;
$function$;

create or replace function public.enviar_pedido_amizade_v2(p_identificador text)
returns amizades
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_destinatario_id uuid;
  v_existente public.amizades;
  v_resultado public.amizades;
  v_bloqueado boolean;
  v_permite_pedidos boolean;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

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

  select exists(
    select 1 from public.user_blocks
    where (blocker_id = v_user_id and blocked_id = v_destinatario_id)
       or (blocker_id = v_destinatario_id and blocked_id = v_user_id)
  ) into v_bloqueado;

  if v_bloqueado then
    raise exception 'Não é possível solicitar amizade a este usuário';
  end if;

  select coalesce(allow_friend_requests, true) into v_permite_pedidos
  from public.user_privacy_settings
  where user_id = v_destinatario_id;

  if not v_permite_pedidos then
    raise exception 'Este usuário não está aceitando novas solicitações de amizade';
  end if;

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
      update public.amizades
      set status = 'aceita', respondido_em = now()
      where id = v_existente.id
      returning * into v_resultado;

      insert into public.notifications (user_id, actor_user_id, type, entity_id)
      values (v_destinatario_id, v_user_id, 'FRIEND_REQUEST_ACCEPTED', v_resultado.id::text)
      on conflict do nothing;

      insert into public.moedas_transacoes (usuario_id, quantidade, motivo)
      values (v_resultado.solicitante_id, 15, 'amizade_aceita'),
             (v_resultado.destinatario_id, 15, 'amizade_aceita');

      return v_resultado;
    else
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
    insert into public.amizades (solicitante_id, destinatario_id, status)
    values (v_user_id, v_destinatario_id, 'pendente')
    returning * into v_resultado;
  end if;

  insert into public.notifications (user_id, actor_user_id, type, entity_id)
  values (v_destinatario_id, v_user_id, 'FRIEND_REQUEST_RECEIVED', v_resultado.id::text)
  on conflict do nothing;

  return v_resultado;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. resgatar_convite: liga o código de /convite/[codigo] a uma amizade de
-- verdade (auto-aceita, sem precisar de aprovação manual -- clicar no link
-- já é o convite) e dá +15 sementes pros dois lados. Idempotente: se já são
-- amigos, retorna sucesso com sementes_ganhas = 0, sem duplicar recompensa.
-- ---------------------------------------------------------------------------
create or replace function public.resgatar_convite(p_codigo text)
returns table(sucesso boolean, sementes_ganhas integer, nome_convidador text, ja_eram_amigos boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_convidador_id uuid;
  v_nome_convidador text;
  v_existente public.amizades;
  v_bloqueado boolean;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  select id, nome_exibicao into v_convidador_id, v_nome_convidador
  from public.profiles
  where lower(codigo_amigo) = lower(trim(p_codigo))
    and coalesce(status, 'ACTIVE') = 'ACTIVE'
  limit 1;

  if v_convidador_id is null then
    raise exception 'Código de convite inválido.';
  end if;

  if v_convidador_id = v_user_id then
    raise exception 'Você não pode usar seu próprio convite.';
  end if;

  select exists(
    select 1 from public.user_blocks
    where (blocker_id = v_user_id and blocked_id = v_convidador_id)
       or (blocker_id = v_convidador_id and blocked_id = v_user_id)
  ) into v_bloqueado;

  if v_bloqueado then
    raise exception 'Não foi possível conectar com este usuário.';
  end if;

  select * into v_existente from public.amizades
  where (solicitante_id = v_user_id and destinatario_id = v_convidador_id)
     or (solicitante_id = v_convidador_id and destinatario_id = v_user_id)
  limit 1;

  if v_existente.id is not null and v_existente.status = 'aceita' then
    return query select true, 0, v_nome_convidador, true;
    return;
  end if;

  if v_existente.id is not null then
    update public.amizades
    set status = 'aceita', respondido_em = now()
    where id = v_existente.id;
  else
    insert into public.amizades (solicitante_id, destinatario_id, status, respondido_em)
    values (v_convidador_id, v_user_id, 'aceita', now());
  end if;

  insert into public.moedas_transacoes (usuario_id, quantidade, motivo)
  values (v_convidador_id, 15, 'convite_aceito'),
         (v_user_id, 15, 'convite_aceito');

  insert into public.notifications (user_id, actor_user_id, type, entity_id)
  values (v_convidador_id, v_user_id, 'CONVITE_ACEITO', v_user_id::text)
  on conflict do nothing;

  return query select true, 15, v_nome_convidador, false;
end;
$function$;

grant execute on function public.resgatar_convite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. total_amigos em obter_estatisticas_usuario, usado pela missão
-- "Sua primeira conexão" (ver src/lib/devocional/missoes.js).
-- ---------------------------------------------------------------------------
drop function if exists public.obter_estatisticas_usuario();

create function public.obter_estatisticas_usuario()
returns table(total_devocionais bigint, temas_distintos bigint, xp_total integer, ofensiva_atual integer, maior_ofensiva integer, total_amigos bigint)
language sql
security definer
set search_path to 'public'
as $function$
  select
    (select count(*) from public.devotional_logs where user_id = auth.uid()),
    (select count(distinct tema_oracao) from public.devotional_logs where user_id = auth.uid() and tema_oracao is not null),
    coalesce((select xp_total from public.streaks where user_id = auth.uid()), 0),
    coalesce((select ofensiva_atual from public.streaks where user_id = auth.uid()), 0),
    coalesce((select maior_ofensiva from public.streaks where user_id = auth.uid()), 0),
    (select count(*) from public.amizades where status = 'aceita' and (solicitante_id = auth.uid() or destinatario_id = auth.uid()));
$function$;

grant execute on function public.obter_estatisticas_usuario() to authenticated;
