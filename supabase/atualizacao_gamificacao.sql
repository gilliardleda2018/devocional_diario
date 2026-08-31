-- ============================================================================
-- Migração incremental: XP, estatísticas e ranking.
--
-- Rode este arquivo SÓ SE você já tinha rodado o supabase/schema.sql antes
-- (ou seja, o projeto Supabase já existe e já tem as tabelas). Se está
-- criando o projeto do zero agora, ignore este arquivo -- basta rodar
-- schema.sql, que já vem com tudo incluído.
-- ============================================================================

alter table public.streaks add column if not exists xp_total integer not null default 0;

create or replace function public.registrar_devocional_hoje(
  p_tema_oracao text,
  p_referencia_versiculo text,
  p_reflexao text
)
returns public.streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoje date := current_date;
  v_ontem date := current_date - interval '1 day';
  v_ja_existia boolean;
  v_xp_ganho integer;
  v_streak public.streaks;
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

  insert into public.streaks (user_id, ofensiva_atual, maior_ofensiva, ultimo_dia, xp_total)
  values (auth.uid(), 1, 1, v_hoje, v_xp_ganho)
  on conflict (user_id) do update set
    ofensiva_atual = case
      when public.streaks.ultimo_dia = v_hoje then public.streaks.ofensiva_atual
      when public.streaks.ultimo_dia = v_ontem then public.streaks.ofensiva_atual + 1
      else 1
    end,
    maior_ofensiva = greatest(
      public.streaks.maior_ofensiva,
      case
        when public.streaks.ultimo_dia = v_hoje then public.streaks.ofensiva_atual
        when public.streaks.ultimo_dia = v_ontem then public.streaks.ofensiva_atual + 1
        else 1
      end
    ),
    ultimo_dia = v_hoje,
    xp_total = public.streaks.xp_total + v_xp_ganho,
    atualizado_em = now()
  returning * into v_streak;

  return v_streak;
end;
$$;

create or replace function public.obter_estatisticas_usuario()
returns table(
  total_devocionais bigint,
  temas_distintos bigint,
  xp_total integer,
  ofensiva_atual integer,
  maior_ofensiva integer
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.devotional_logs where user_id = auth.uid()),
    (select count(distinct tema_oracao) from public.devotional_logs where user_id = auth.uid() and tema_oracao is not null),
    coalesce((select xp_total from public.streaks where user_id = auth.uid()), 0),
    coalesce((select ofensiva_atual from public.streaks where user_id = auth.uid()), 0),
    coalesce((select maior_ofensiva from public.streaks where user_id = auth.uid()), 0);
$$;

grant execute on function public.obter_estatisticas_usuario() to authenticated;

create or replace function public.obter_ranking(p_limite integer default 20)
returns table(
  nome_exibicao text,
  xp_total integer,
  ofensiva_atual integer,
  maior_ofensiva integer,
  posicao bigint
)
language sql
security definer
set search_path = public
as $$
  select p.nome_exibicao, s.xp_total, s.ofensiva_atual, s.maior_ofensiva,
         row_number() over (order by s.xp_total desc, s.maior_ofensiva desc) as posicao
  from public.streaks s
  join public.profiles p on p.id = s.user_id
  order by s.xp_total desc, s.maior_ofensiva desc
  limit p_limite;
$$;

grant execute on function public.obter_ranking(integer) to authenticated;

create or replace function public.obter_minha_posicao()
returns bigint
language sql
security definer
set search_path = public
as $$
  select posicao from (
    select user_id, row_number() over (order by xp_total desc, maior_ofensiva desc) as posicao
    from public.streaks
  ) ranqueado
  where user_id = auth.uid();
$$;

grant execute on function public.obter_minha_posicao() to authenticated;
