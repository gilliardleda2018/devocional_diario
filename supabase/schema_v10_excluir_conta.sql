-- =====================================================================
-- v10 -- Excluir a própria conta (exigência da Google Play)
--
-- Apps que permitem criar conta precisam permitir excluí-la pelo próprio
-- app. Apagar a linha de auth.users leva junto, em cascata, todos os dados
-- da pessoa (perfil, devocionais, diário, favoritos, amizades, pedidos de
-- oração, comentários, notificações, sementes, eventos...) -- todas as
-- chaves estrangeiras para auth.users são ON DELETE CASCADE.
--
-- Só apaga a conta de quem está logado (auth.uid()); não recebe parâmetro.
-- =====================================================================

create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'não autenticado';
  end if;

  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
