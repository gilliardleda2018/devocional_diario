-- =====================================================================
-- v7 -- Medição de uso (funil de retenção)
--
-- Registra passos do funil: visitou a página de entrada -> fez o devocional
-- sem conta -> criou conta -> fez o 1º devocional -> voltou nos dias seguintes.
-- Retenção de quem já tem conta também sai de devotional_logs.
--
-- Ninguém lê ou grava a tabela diretamente (RLS ligado e sem políticas);
-- a gravação é só pela função registrar_evento, que aceita apenas nomes de
-- evento conhecidos e limita o tamanho dos dados. Os relatórios são
-- consultados pelo painel do Supabase (SQL), não pelo app.
-- =====================================================================

create table if not exists public.eventos (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  nome text not null,
  visitante_id text,
  user_id uuid references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb
);

create index if not exists eventos_nome_criado_em_idx on public.eventos (nome, criado_em);
create index if not exists eventos_visitante_idx on public.eventos (visitante_id);
create index if not exists eventos_user_idx on public.eventos (user_id);

alter table public.eventos enable row level security;
revoke all on public.eventos from anon, authenticated;
revoke all on sequence public.eventos_id_seq from anon, authenticated;

create or replace function public.registrar_evento(
  p_nome text,
  p_visitante_id text default null,
  p_dados jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_nome not in (
    'entrada_visita',
    'entrada_devocional_iniciado',
    'entrada_devocional_concluido',
    'entrada_cadastro_clicado',
    'login_visita',
    'conta_criada',
    'app_aberto',
    'devocional_iniciado',
    'devocional_concluido'
  ) then
    return;
  end if;

  if p_visitante_id is not null and length(p_visitante_id) > 64 then
    p_visitante_id := left(p_visitante_id, 64);
  end if;

  if p_dados is null or length(p_dados::text) > 1000 then
    p_dados := '{}'::jsonb;
  end if;

  insert into public.eventos (nome, visitante_id, user_id, dados)
  values (p_nome, p_visitante_id, auth.uid(), p_dados);
end;
$$;

revoke all on function public.registrar_evento(text, text, jsonb) from public;
grant execute on function public.registrar_evento(text, text, jsonb) to anon, authenticated;
