-- =====================================================================
-- v9 -- Eventos de compartilhamento
--
-- Acrescenta à lista de eventos aceitos por registrar_evento (v7):
--   compartilhou    -> tocou em compartilhar a Palavra (dados: local, metodo)
--   convite_visita  -> abriu um link /convite/CODIGO (dados: codigo, origem)
-- =====================================================================

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
    'devocional_concluido',
    'compartilhou',
    'convite_visita'
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
