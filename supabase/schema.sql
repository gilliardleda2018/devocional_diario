-- ============================================================================
-- Schema do Devocional Diário -- rode isto no SQL Editor do seu projeto
-- Supabase (painel -> SQL Editor -> New query -> colar tudo -> Run).
--
-- Cada tabela tem Row Level Security (RLS) ligado: um usuário só consegue
-- ler/escrever as PRÓPRIAS linhas (auth.uid() = user_id). Isso é o que
-- torna seguro usar a anon key direto no browser.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: 1 linha por usuário autenticado, criada automaticamente no
-- primeiro login via trigger (ver final do arquivo).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_exibicao text,
  criado_em timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "usuário edita o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- devotional_logs: 1 linha por devocional concluído (data, tema de oração
-- escolhido, texto da reflexão, referência do versículo mostrado). É a base
-- para a "ofensiva" (streak) e o calendário de assiduidade.
-- ---------------------------------------------------------------------------
create table if not exists public.devotional_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null default current_date,
  tema_oracao text,
  referencia_versiculo text,
  reflexao text,
  criado_em timestamptz not null default now(),
  unique (user_id, data) -- só conta 1 devocional por dia para fins de ofensiva
);

alter table public.devotional_logs enable row level security;

create policy "usuário vê os próprios devocionais"
  on public.devotional_logs for select
  using (auth.uid() = user_id);

create policy "usuário insere os próprios devocionais"
  on public.devotional_logs for insert
  with check (auth.uid() = user_id);

create policy "usuário atualiza os próprios devocionais"
  on public.devotional_logs for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- streaks: 1 linha por usuário com o estado atual da ofensiva. Atualizada
-- pela função registrar_devocional_hoje() (ver abaixo) sempre que um
-- devocional é salvo -- assim o cálculo de streak fica centralizado no
-- banco, não duplicado em vários lugares do frontend.
-- ---------------------------------------------------------------------------
create table if not exists public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ofensiva_atual integer not null default 0,
  maior_ofensiva integer not null default 0,
  ultimo_dia date,
  xp_total integer not null default 0,
  atualizado_em timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "usuário vê a própria ofensiva"
  on public.streaks for select
  using (auth.uid() = user_id);

-- Não criamos policy de insert/update para o usuário: streaks só é
-- alterada pela função abaixo (security definer), nunca direto pelo cliente
-- -- evita que alguém "trapaceie" a própria sequência via API.

-- ---------------------------------------------------------------------------
-- favoritos: versículos marcados na leitura livre ou no devocional.
-- ---------------------------------------------------------------------------
create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  referencia text not null,
  texto text not null,
  criado_em timestamptz not null default now(),
  unique (user_id, referencia)
);

alter table public.favoritos enable row level security;

create policy "usuário vê os próprios favoritos"
  on public.favoritos for select
  using (auth.uid() = user_id);

create policy "usuário insere os próprios favoritos"
  on public.favoritos for insert
  with check (auth.uid() = user_id);

create policy "usuário remove os próprios favoritos"
  on public.favoritos for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Função: registrar_devocional_hoje
-- Chamada pelo frontend (rpc) quando o usuário conclui o devocional do dia.
-- Faz o upsert em devotional_logs e recalcula a ofensiva de forma atômica:
--   - se ultimo_dia = ontem -> ofensiva += 1
--   - se ultimo_dia = hoje  -> não muda (já contou hoje)
--   - qualquer outro caso   -> ofensiva reinicia em 1
-- Também concede XP_POR_DEVOCIONAL pontos de XP -- mas só na PRIMEIRA vez
-- que o devocional daquele dia é registrado (editar a reflexão do mesmo dia
-- de novo não gera XP extra, evita "farm" trivial de pontos).
-- ============================================================================
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

-- ============================================================================
-- Função: obter_estatisticas_usuario
-- Usada pela tela de Progresso para calcular conquistas/badges no cliente
-- (as badges são derivadas destes números, não guardadas numa tabela à
-- parte -- assim uma conquista de "maior ofensiva" nunca se perde mesmo se
-- a sequência atual quebrar).
-- ============================================================================
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

-- ============================================================================
-- Ranking (estilo "liga" do Duolingo) -- expõe só nome de exibição + números
-- de gamificação (nunca e-mail ou reflexões) via função security definer,
-- então não precisamos afrouxar as políticas de RLS de profiles/streaks.
-- ============================================================================
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

-- ============================================================================
-- Trigger: cria a linha em profiles e em streaks automaticamente quando
-- alguém se cadastra (Google OAuth ou magic link) -- sem isso, a primeira
-- consulta a "streaks" pra um usuário novo não acharia nada.
-- ============================================================================
create or replace function public.lidar_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome_exibicao)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));

  insert into public.streaks (user_id, ofensiva_atual, maior_ofensiva, ultimo_dia)
  values (new.id, 0, 0, null);

  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.lidar_novo_usuario();
