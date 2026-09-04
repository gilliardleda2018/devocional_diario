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
-- primeiro login via trigger (ver final do arquivo). `codigo_amigo` é o
-- código curto (ex: "4F2A9B") que a pessoa compartilha por fora (WhatsApp
-- etc.) pra alguém virar seu amigo dentro do app -- ver seção "Amigos".
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_exibicao text,
  codigo_amigo text unique,
  foto_url text,
  criado_em timestamptz not null default now()
);

alter table public.profiles add column if not exists foto_url text;

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
  foto_url text,
  xp_total integer,
  ofensiva_atual integer,
  maior_ofensiva integer,
  posicao bigint
)
language sql
security definer
set search_path = public
as $$
  select p.nome_exibicao, p.foto_url, s.xp_total, s.ofensiva_atual, s.maior_ofensiva,
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
-- Função: obter_progresso_semana
-- Usada pelo card de "Missões" (metas curtas, estilo quest de jogo) na tela
-- inicial: quantos devocionais nos últimos 7 dias, quantos temas distintos
-- nesse período, e se a reflexão de hoje já foi escrita.
-- ============================================================================
create or replace function public.obter_progresso_semana()
returns table(
  devocionais_semana bigint,
  temas_semana bigint,
  refletiu_hoje boolean
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.devotional_logs where user_id = auth.uid() and data >= current_date - interval '6 days'),
    (select count(distinct tema_oracao) from public.devotional_logs where user_id = auth.uid() and tema_oracao is not null and data >= current_date - interval '6 days'),
    exists(
      select 1 from public.devotional_logs
      where user_id = auth.uid() and data = current_date
        and reflexao is not null and length(trim(reflexao)) > 0
    );
$$;

grant execute on function public.obter_progresso_semana() to authenticated;

-- ============================================================================
-- AMIGOS -- conexão entre usuários, feed de atividade, torcidas e desafios
-- em grupo. Ninguém descobre ninguém por busca: a única forma de virar
-- amigo é através do "código de amigo" (profiles.codigo_amigo), que cada
-- pessoa compartilha por fora (WhatsApp etc.) com quem ela quiser.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- gerar_codigo_amigo: sorteia um código curto e garante que é único.
-- ---------------------------------------------------------------------------
create or replace function public.gerar_codigo_amigo()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_codigo text;
  v_existe boolean;
begin
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    select exists(select 1 from public.profiles where codigo_amigo = v_codigo) into v_existe;
    exit when not v_existe;
  end loop;
  return v_codigo;
end;
$$;

-- Preenche o código de quem já tinha conta antes desta migração (a partir
-- de agora, o trigger no fim do arquivo já cria o código pra gente nova).
update public.profiles set codigo_amigo = public.gerar_codigo_amigo() where codigo_amigo is null;

-- ---------------------------------------------------------------------------
-- amizades: pedido de amizade entre dois usuários. `status` começa
-- 'pendente' e vira 'aceita'/'recusada' quando o destinatário responde
-- (ver função responder_pedido_amizade). O insert/update passa sempre por
-- função security definer -- não expomos policy de insert/update direta,
-- só select e delete (pra qualquer um dos dois poder desfazer a amizade).
-- ---------------------------------------------------------------------------
create table if not exists public.amizades (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references auth.users (id) on delete cascade,
  destinatario_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceita', 'recusada')),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  check (solicitante_id <> destinatario_id),
  unique (solicitante_id, destinatario_id)
);

alter table public.amizades enable row level security;

create policy "usuário vê amizades que participa"
  on public.amizades for select
  using (auth.uid() = solicitante_id or auth.uid() = destinatario_id);

create policy "usuário remove amizades que participa"
  on public.amizades for delete
  using (auth.uid() = solicitante_id or auth.uid() = destinatario_id);

-- Envia um pedido de amizade a partir do código da outra pessoa. Se a outra
-- pessoa já tinha te chamado antes (pedido pendente na direção oposta),
-- aceita automaticamente em vez de criar um pedido duplicado.
create or replace function public.enviar_pedido_amizade(p_codigo_amigo text)
returns public.amizades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_destinatario_id uuid;
  v_existente public.amizades;
  v_resultado public.amizades;
begin
  select id into v_destinatario_id from public.profiles where codigo_amigo = upper(trim(p_codigo_amigo));
  if v_destinatario_id is null then
    raise exception 'Código de amigo não encontrado';
  end if;
  if v_destinatario_id = auth.uid() then
    raise exception 'Você não pode adicionar a si mesmo';
  end if;

  select * into v_existente from public.amizades
    where (solicitante_id = auth.uid() and destinatario_id = v_destinatario_id)
       or (solicitante_id = v_destinatario_id and destinatario_id = auth.uid())
    limit 1;

  if v_existente.id is not null then
    if v_existente.status = 'aceita' then
      raise exception 'Vocês já são amigos';
    else
      update public.amizades set status = 'aceita', respondido_em = now()
        where id = v_existente.id
        returning * into v_resultado;
      return v_resultado;
    end if;
  end if;

  insert into public.amizades (solicitante_id, destinatario_id, status, respondido_em)
    values (auth.uid(), v_destinatario_id, 'aceita', now())
    returning * into v_resultado;
  return v_resultado;
end;
$$;

grant execute on function public.enviar_pedido_amizade(text) to authenticated;

-- Aceita ou recusa um pedido recebido -- só quem recebeu pode responder.
create or replace function public.responder_pedido_amizade(p_amizade_id uuid, p_aceitar boolean)
returns public.amizades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resultado public.amizades;
begin
  update public.amizades
    set status = case when p_aceitar then 'aceita' else 'recusada' end,
        respondido_em = now()
    where id = p_amizade_id and destinatario_id = auth.uid() and status = 'pendente'
    returning * into v_resultado;
  if v_resultado.id is null then
    raise exception 'Pedido não encontrado';
  end if;
  return v_resultado;
end;
$$;

grant execute on function public.responder_pedido_amizade(uuid, boolean) to authenticated;

create or replace function public.obter_meu_codigo_amigo()
returns text
language sql
security definer
set search_path = public
as $$
  select codigo_amigo from public.profiles where id = auth.uid();
$$;

grant execute on function public.obter_meu_codigo_amigo() to authenticated;

create or replace function public.obter_pedidos_pendentes()
returns table(
  amizade_id uuid,
  solicitante_id uuid,
  nome_exibicao text,
  foto_url text,
  criado_em timestamptz
)
language sql
security definer
set search_path = public
as $$
  select a.id, a.solicitante_id, p.nome_exibicao, p.foto_url, a.criado_em
  from public.amizades a
  join public.profiles p on p.id = a.solicitante_id
  where a.destinatario_id = auth.uid() and a.status = 'pendente'
  order by a.criado_em desc;
$$;

grant execute on function public.obter_pedidos_pendentes() to authenticated;

create or replace function public.obter_meus_amigos()
returns table(
  amizade_id uuid,
  amigo_id uuid,
  nome_exibicao text,
  foto_url text,
  ofensiva_atual integer,
  maior_ofensiva integer,
  amigos_desde timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    case when a.solicitante_id = auth.uid() then a.destinatario_id else a.solicitante_id end,
    p.nome_exibicao,
    p.foto_url,
    coalesce(s.ofensiva_atual, 0),
    coalesce(s.maior_ofensiva, 0),
    a.respondido_em
  from public.amizades a
  join public.profiles p on p.id = case when a.solicitante_id = auth.uid() then a.destinatario_id else a.solicitante_id end
  left join public.streaks s on s.user_id = p.id
  where a.status = 'aceita' and (a.solicitante_id = auth.uid() or a.destinatario_id = auth.uid())
  order by p.nome_exibicao;
$$;

grant execute on function public.obter_meus_amigos() to authenticated;

-- ---------------------------------------------------------------------------
-- torcidas: um "empurrãozinho" amigável -- só entre amigos, no máximo 1 por
-- dia pra cada amigo (o unique com `data` evita spam).
-- ---------------------------------------------------------------------------
create table if not exists public.torcidas (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null references auth.users (id) on delete cascade,
  destinatario_id uuid not null references auth.users (id) on delete cascade,
  data date not null default current_date,
  criado_em timestamptz not null default now(),
  check (remetente_id <> destinatario_id),
  unique (remetente_id, destinatario_id, data)
);

alter table public.torcidas enable row level security;

create policy "usuário vê torcidas que enviou ou recebeu"
  on public.torcidas for select
  using (auth.uid() = remetente_id or auth.uid() = destinatario_id);

create or replace function public.enviar_torcida(p_destinatario_id uuid)
returns public.torcidas
language plpgsql
security definer
set search_path = public
as $$
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
  return v_resultado;
end;
$$;

grant execute on function public.enviar_torcida(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- obter_feed_amigos: junta devocionais recentes dos amigos + torcidas
-- recebidas, mais novo primeiro. Nunca expõe a reflexão (texto privado) --
-- só tema de oração, referência do versículo e a ofensiva atual.
-- ---------------------------------------------------------------------------
create or replace function public.obter_feed_amigos(p_limite integer default 30)
returns table(
  tipo text,
  quando timestamptz,
  pessoa_id uuid,
  nome_exibicao text,
  foto_url text,
  tema_oracao text,
  referencia_versiculo text,
  ofensiva_atual integer
)
language sql
security definer
set search_path = public
as $$
  (
    select
      'devocional'::text,
      dl.criado_em,
      dl.user_id,
      p.nome_exibicao,
      p.foto_url,
      dl.tema_oracao,
      dl.referencia_versiculo,
      coalesce(s.ofensiva_atual, 0)
    from public.devotional_logs dl
    join public.amizades a on
      a.status = 'aceita' and
      ((a.solicitante_id = auth.uid() and a.destinatario_id = dl.user_id)
        or (a.destinatario_id = auth.uid() and a.solicitante_id = dl.user_id))
    join public.profiles p on p.id = dl.user_id
    left join public.streaks s on s.user_id = dl.user_id
  )
  union all
  (
    select
      'torcida'::text,
      t.criado_em,
      t.remetente_id,
      p.nome_exibicao,
      p.foto_url,
      null::text,
      null::text,
      null::integer
    from public.torcidas t
    join public.profiles p on p.id = t.remetente_id
    where t.destinatario_id = auth.uid()
  )
  order by 2 desc
  limit p_limite;
$$;

grant execute on function public.obter_feed_amigos(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Liga entre amigos: igual a obter_ranking, só que filtrada só pra você +
-- seus amigos aceitos, em vez de todo mundo que usa o app.
-- ---------------------------------------------------------------------------
create or replace function public.obter_ranking_amigos(p_limite integer default 20)
returns table(
  nome_exibicao text,
  foto_url text,
  xp_total integer,
  ofensiva_atual integer,
  maior_ofensiva integer,
  posicao bigint,
  sou_eu boolean
)
language sql
security definer
set search_path = public
as $$
  with membros as (
    select auth.uid() as user_id
    union
    select case when a.solicitante_id = auth.uid() then a.destinatario_id else a.solicitante_id end
    from public.amizades a
    where a.status = 'aceita' and (a.solicitante_id = auth.uid() or a.destinatario_id = auth.uid())
  )
  select p.nome_exibicao, p.foto_url, s.xp_total, s.ofensiva_atual, s.maior_ofensiva,
         row_number() over (order by s.xp_total desc, s.maior_ofensiva desc) as posicao,
         s.user_id = auth.uid() as sou_eu
  from public.streaks s
  join public.profiles p on p.id = s.user_id
  where s.user_id in (select user_id from membros)
  order by s.xp_total desc, s.maior_ofensiva desc
  limit p_limite;
$$;

grant execute on function public.obter_ranking_amigos(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- desafios: uma meta com prazo (ex: "7 dias seguidos") que um grupo entra
-- junto -- o progresso de cada participante é calculado ao vivo a partir
-- de devotional_logs (o mesmo padrão usado no resto do schema), não fica
-- guardado numa coluna à parte.
-- ---------------------------------------------------------------------------
create table if not exists public.desafios (
  id uuid primary key default gen_random_uuid(),
  criador_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  meta_dias integer not null check (meta_dias between 1 and 90),
  data_inicio date not null default current_date,
  data_fim date not null,
  criado_em timestamptz not null default now()
);

alter table public.desafios enable row level security;

create table if not exists public.desafio_participantes (
  desafio_id uuid not null references public.desafios (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entrou_em timestamptz not null default now(),
  primary key (desafio_id, user_id)
);

alter table public.desafio_participantes enable row level security;

create policy "participante vê o desafio"
  on public.desafios for select
  using (exists(select 1 from public.desafio_participantes dp where dp.desafio_id = id and dp.user_id = auth.uid()));

create policy "participante vê quem mais participa do desafio"
  on public.desafio_participantes for select
  using (exists(select 1 from public.desafio_participantes dp2 where dp2.desafio_id = desafio_id and dp2.user_id = auth.uid()));

create or replace function public.criar_desafio(p_titulo text, p_meta_dias integer)
returns public.desafios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resultado public.desafios;
begin
  if p_meta_dias < 1 or p_meta_dias > 90 then
    raise exception 'A meta precisa ser entre 1 e 90 dias';
  end if;
  if length(trim(coalesce(p_titulo, ''))) = 0 then
    raise exception 'Dê um título pro desafio';
  end if;
  insert into public.desafios (criador_id, titulo, meta_dias, data_inicio, data_fim)
    values (auth.uid(), trim(p_titulo), p_meta_dias, current_date, current_date + (p_meta_dias - 1))
    returning * into v_resultado;
  insert into public.desafio_participantes (desafio_id, user_id) values (v_resultado.id, auth.uid());
  return v_resultado;
end;
$$;

grant execute on function public.criar_desafio(text, integer) to authenticated;

create or replace function public.entrar_no_desafio(p_desafio_id uuid)
returns public.desafios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desafio public.desafios;
begin
  select * into v_desafio from public.desafios where id = p_desafio_id;
  if v_desafio.id is null then
    raise exception 'Desafio não encontrado';
  end if;
  if v_desafio.data_fim < current_date then
    raise exception 'Esse desafio já terminou';
  end if;
  insert into public.desafio_participantes (desafio_id, user_id)
    values (p_desafio_id, auth.uid())
    on conflict do nothing;
  return v_desafio;
end;
$$;

grant execute on function public.entrar_no_desafio(uuid) to authenticated;

create or replace function public.sair_do_desafio(p_desafio_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.desafio_participantes where desafio_id = p_desafio_id and user_id = auth.uid();
end;
$$;

grant execute on function public.sair_do_desafio(uuid) to authenticated;

create or replace function public.obter_meus_desafios()
returns table(
  desafio_id uuid,
  titulo text,
  meta_dias integer,
  data_inicio date,
  data_fim date,
  total_participantes bigint
)
language sql
security definer
set search_path = public
as $$
  select d.id, d.titulo, d.meta_dias, d.data_inicio, d.data_fim,
         (select count(*) from public.desafio_participantes dp2 where dp2.desafio_id = d.id)
  from public.desafios d
  join public.desafio_participantes dp on dp.desafio_id = d.id and dp.user_id = auth.uid()
  order by d.criado_em desc;
$$;

grant execute on function public.obter_meus_desafios() to authenticated;

create or replace function public.obter_progresso_desafio(p_desafio_id uuid)
returns table(
  user_id uuid,
  nome_exibicao text,
  dias_completados integer,
  meta_dias integer,
  sou_eu boolean
)
language sql
security definer
set search_path = public
as $$
  select
    dp.user_id,
    p.nome_exibicao,
    (
      select count(*)::integer from public.devotional_logs dl
      where dl.user_id = dp.user_id
        and dl.data >= d.data_inicio
        and dl.data <= least(d.data_fim, current_date)
    ),
    d.meta_dias,
    dp.user_id = auth.uid()
  from public.desafio_participantes dp
  join public.desafios d on d.id = dp.desafio_id
  join public.profiles p on p.id = dp.user_id
  where dp.desafio_id = p_desafio_id
    and exists(select 1 from public.desafio_participantes dpme where dpme.desafio_id = p_desafio_id and dpme.user_id = auth.uid())
  order by 3 desc;
$$;

grant execute on function public.obter_progresso_desafio(uuid) to authenticated;

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
  insert into public.profiles (id, nome_exibicao, codigo_amigo, foto_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    public.gerar_codigo_amigo(),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );

  insert into public.streaks (user_id, ofensiva_atual, maior_ofensiva, ultimo_dia)
  values (new.id, 0, 0, null);

  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.lidar_novo_usuario();
