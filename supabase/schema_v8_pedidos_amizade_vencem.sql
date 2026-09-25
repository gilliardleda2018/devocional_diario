-- =====================================================================
-- v8 -- Pedidos de amizade vencem após 30 dias sem resposta
--
-- Em set/2026 havia 27 pedidos pendentes cujos destinatários nunca mais
-- abriram o app: ficavam para sempre em "Aguardando resposta" para quem
-- enviou. Com a decisão do dono do app, todos foram cancelados (item 2) e,
-- daqui em diante, pedidos sem resposta há mais de 30 dias são cancelados
-- sozinhos todo dia (item 3). Quem enviou pode mandar de novo depois.
-- Junto com o pedido some a notificação "pedido recebido" ligada a ele.
-- =====================================================================

-- 1. Função de limpeza (só o agendador e o painel usam; o app não chama).
create or replace function public.expirar_pedidos_amizade(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_removidos integer;
begin
  with vencidos as (
    delete from public.amizades
    where status = 'pendente'
      and criado_em < now() - make_interval(days => p_dias)
    returning id
  ),
  avisos as (
    delete from public.notifications n
    using vencidos v
    where n.type = 'FRIEND_REQUEST_RECEIVED'
      and n.entity_id = v.id::text
    returning n.id
  )
  select count(*) into v_removidos from vencidos;

  return v_removidos;
end;
$$;

revoke all on function public.expirar_pedidos_amizade(integer) from public, anon, authenticated;

-- 2. Limpeza única de set/2026: cancela todos os pedidos pendentes.
delete from public.notifications n
using public.amizades a
where a.status = 'pendente'
  and n.type = 'FRIEND_REQUEST_RECEIVED'
  and n.entity_id = a.id::text;

delete from public.amizades where status = 'pendente';

-- 3. Agendamento diário (03:00 de Brasília = 06:00 UTC).
create extension if not exists pg_cron;

select cron.schedule(
  'expirar-pedidos-amizade',
  '0 6 * * *',
  $$select public.expirar_pedidos_amizade(30);$$
);
