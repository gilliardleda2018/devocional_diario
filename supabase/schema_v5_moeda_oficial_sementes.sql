-- ============================================================================
-- Migração Schema v5: Sementes de Fé como moeda oficial do jogo.
-- Já aplicada em produção via Supabase MCP (migrations
-- "moeda_oficial_conversao_xp_em_sementes" e
-- "restringe_execucao_direta_conceder_sementes_por_xp"). Este arquivo existe
-- só pra manter o histórico do schema versionado no git -- não precisa ser
-- reexecutado a mão.
--
-- Regra: a cada 250 XP acumulado, o usuário ganha 1 Semente de Fé; a cada
-- 5 Sementes, ele sobe de fase (ver src/lib/devocional/niveis.js, que já
-- calculava xp_total em fases -- agora os limiares de fase são múltiplos
-- exatos de 1250 XP = 5 sementes). A conversão de XP em sementes soma na
-- MESMA carteira usada na Loja de Sementes (public.moedas_transacoes,
-- saldo lido por obter_saldo_sementes()) -- não é uma moeda paralela.
--
-- Importante: o avanço de FASE (na tela de Progresso) é calculado no
-- frontend a partir do xp_total bruto, não do saldo gasto de sementes --
-- assim comprar um item na loja nunca "rebaixa" o usuário de fase.
-- ============================================================================

create or replace function public.conceder_sementes_por_xp(p_usuario_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_xp_total integer;
  v_sementes_devidas integer;
  v_ja_convertidas integer;
  v_a_conceder integer;
begin
  select xp_total into v_xp_total from public.streaks where user_id = p_usuario_id;
  if v_xp_total is null then
    return 0;
  end if;

  v_sementes_devidas := floor(v_xp_total::numeric / 250)::integer;

  select coalesce(sum(quantidade), 0) into v_ja_convertidas
  from public.moedas_transacoes
  where usuario_id = p_usuario_id and motivo = 'conversao_xp';

  v_a_conceder := v_sementes_devidas - v_ja_convertidas;

  if v_a_conceder > 0 then
    insert into public.moedas_transacoes (usuario_id, quantidade, motivo)
    values (p_usuario_id, v_a_conceder, 'conversao_xp');
  end if;

  return greatest(v_a_conceder, 0);
end;
$function$;

-- Só chamada internamente por registrar_devocional_hoje e concluir_quiz_hoje.
revoke execute on function public.conceder_sementes_por_xp(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- registrar_devocional_hoje e concluir_quiz_hoje: idênticas às versões
-- anteriores, só chamando conceder_sementes_por_xp(auth.uid()) depois de
-- conceder XP.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_devocional_hoje(
  p_tema_oracao text,
  p_referencia_versiculo text,
  p_reflexao text
)
returns public.streaks
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_hoje date := current_date;
  v_ontem date := current_date - interval '1 day';
  v_ja_existia boolean;
  v_xp_ganho integer;
  v_streak public.streaks;
  v_ultimo_dia_atual date;
  v_usar_congelamento boolean := false;
begin
  select exists(
    select 1 from public.devotional_logs where user_id = auth.uid() and data = v_hoje
  ) into v_ja_existia;

  v_xp_ganho := case when v_ja_existia then 0 else 20 end;

  insert into public.devotional_logs (user_id, data, tema_oracao, referencia_versiculo, reflexao)
  values (auth.uid(), v_hoje, p_tema_oracao, p_referencia_versiculo, p_reflexao)
  on conflict (user_id, data)
  do update set
    tema_oracao = excluded.tema_oracao,
    referencia_versiculo = excluded.referencia_versiculo,
    reflexao = excluded.reflexao;

  select ultimo_dia into v_ultimo_dia_atual from public.streaks where user_id = auth.uid();

  if v_ultimo_dia_atual is not null and (v_hoje - v_ultimo_dia_atual) = 2 then
    update public.inventario_usuario
    set quantidade = quantidade - 1, atualizado_em = now()
    where usuario_id = auth.uid() and item = 'congelar_ofensiva' and quantidade > 0
    returning true into v_usar_congelamento;
  end if;

  insert into public.streaks (user_id, ofensiva_atual, maior_ofensiva, ultimo_dia, xp_total)
  values (auth.uid(), 1, 1, v_hoje, v_xp_ganho)
  on conflict (user_id) do update set
    ofensiva_atual = case
      when public.streaks.ultimo_dia = v_hoje then public.streaks.ofensiva_atual
      when public.streaks.ultimo_dia = v_ontem then public.streaks.ofensiva_atual + 1
      when v_usar_congelamento then public.streaks.ofensiva_atual + 1
      else 1
    end,
    maior_ofensiva = greatest(
      public.streaks.maior_ofensiva,
      case
        when public.streaks.ultimo_dia = v_hoje then public.streaks.ofensiva_atual
        when public.streaks.ultimo_dia = v_ontem then public.streaks.ofensiva_atual + 1
        when v_usar_congelamento then public.streaks.ofensiva_atual + 1
        else 1
      end
    ),
    ultimo_dia = v_hoje,
    xp_total = public.streaks.xp_total + v_xp_ganho,
    atualizado_em = now()
  returning * into v_streak;

  if v_xp_ganho > 0 then
    insert into public.xp_eventos (usuario_id, quantidade, motivo)
    values (auth.uid(), v_xp_ganho, 'devocional_diario');

    perform public.conceder_sementes_por_xp(auth.uid());

    if v_streak.ofensiva_atual in (7, 30, 100) then
      perform public.conceder_bau(auth.uid(), 'marco_ofensiva');
    elsif random() < 0.15 then
      perform public.conceder_bau(auth.uid(), 'surpresa_diaria');
    end if;
  end if;

  return v_streak;
end;
$function$;

create or replace function public.concluir_quiz_hoje(p_acertos integer, p_total integer)
returns table(xp_ganho integer, sementes_ganhas integer, ja_concluido boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_hoje date := current_date;
  v_log public.devotional_logs;
  v_xp integer;
  v_sementes integer;
begin
  select * into v_log from public.devotional_logs
  where user_id = auth.uid() and data = v_hoje;

  if v_log.user_id is null then
    raise exception 'Complete o devocional de hoje antes do quiz';
  end if;

  if v_log.quiz_concluido then
    return query select 0, 0, true;
    return;
  end if;

  v_xp := 10 + greatest(0, least(p_acertos, p_total)) * 2;
  v_sementes := 5 + greatest(0, least(p_acertos, p_total));

  update public.devotional_logs
  set quiz_concluido = true, quiz_acertos = greatest(0, least(p_acertos, p_total))
  where user_id = auth.uid() and data = v_hoje;

  update public.streaks
  set xp_total = xp_total + v_xp, atualizado_em = now()
  where user_id = auth.uid();

  insert into public.xp_eventos (usuario_id, quantidade, motivo)
  values (auth.uid(), v_xp, 'quiz_diario');

  insert into public.moedas_transacoes (usuario_id, quantidade, motivo)
  values (auth.uid(), v_sementes, 'quiz_diario');

  perform public.conceder_sementes_por_xp(auth.uid());

  return query select v_xp, v_sementes, false;
end;
$function$;

-- Backfill idempotente: credita de uma vez o que o XP já acumulado de cada
-- usuário já "devia" antes desta migração existir.
do $$
declare
  v_user record;
begin
  for v_user in select user_id from public.streaks loop
    perform public.conceder_sementes_por_xp(v_user.user_id);
  end loop;
end;
$$;
