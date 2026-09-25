-- =====================================================================
-- v6 — Segurança (set/2026)
-- PARTE A: JÁ APLICADA no projeto Supabase "devocional-diario".
-- PARTE B: também já aplicada.
-- =====================================================================

-- ---------- PARTE A (já aplicada) -------------------------------------
-- 1) Nenhuma função fica executável por visitante anônimo; funções
--    internas (gatilho e concessão de recompensas) não são chamáveis pela API.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.proname in ('lidar_novo_usuario','conceder_bau','conceder_sementes_por_xp','gerar_codigo_amigo') then
      execute format('revoke execute on function %s from authenticated', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
grant execute on function public.obter_convite_info(text) to anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- 2) Gatilho de novo usuário nunca usa o e-mail como nome público.
--    (ver definição completa aplicada: nome = full_name/name ou 'Fiel')
-- 3) Perfis que tinham e-mail como nome foram corrigidos.
-- 4) buscar_usuarios exige login e termo com 2+ caracteres.

-- ---------- PARTE B (aplicada) ---------------------------------------
-- Hoje qualquer usuário logado consegue ler e-mail, telefone e nome
-- completo de TODOS os perfis direto pela API. Isto fecha essa brecha.
-- O app já está preparado (usa obter_meu_perfil() com plano B).

revoke select on public.profiles from anon, authenticated;
grant select (id, nome_exibicao, username, foto_url, codigo_amigo, bio, cidade, igreja,
              instagram, facebook, status, criado_em, atualizado_em)
  on public.profiles to authenticated;

create or replace function public.obter_meu_perfil()
 returns setof public.profiles
 language sql stable security definer set search_path to 'public'
as $$
  select * from public.profiles where id = auth.uid();
$$;
revoke execute on function public.obter_meu_perfil() from public, anon;
grant execute on function public.obter_meu_perfil() to authenticated;

-- ---------- PARTE C (aplicada) ---------------------------------------
-- * Fuso America/Sao_Paulo em todas as funções (alter function ... set timezone)
--   e nos defaults de devotional_logs.data, torcidas.data, desafios.data_inicio.
-- * registrar_devocional_hoje: +10 sementes por devocional (+5 com reflexão).
-- * user_privacy_settings: política de INSERT criada (antes nada era salvo)
--   e uma linha criada para cada perfil existente e novo (no gatilho).
-- * profiles: sem INSERT pela API; UPDATE só nos campos editáveis
--   (nome_exibicao, nome_completo, username, foto_url, bio, cidade, igreja,
--   telefone, instagram, facebook, atualizado_em).
