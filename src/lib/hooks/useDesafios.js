"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Desafios em grupo (ex: "7 dias seguidos") -- lista os que o usuário
 * participa, e oferece ações pra criar, entrar, sair e ver o progresso de
 * cada participante num desafio específico.
 */
export function useDesafios(usuarioId) {
  const [desafios, setDesafios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setDesafios([]);
      setCarregando(false);
      return;
    }
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.rpc("obter_meus_desafios");
    if (!error) setDesafios(data ?? []);
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criarDesafio = useCallback(
    async (titulo, metaDias) => {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.rpc("criar_desafio", { p_titulo: titulo, p_meta_dias: metaDias });
      if (!error) await recarregar();
      return { sucesso: !error, erro: error?.message };
    },
    [recarregar]
  );

  const entrarNoDesafio = useCallback(
    async (desafioId) => {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.rpc("entrar_no_desafio", { p_desafio_id: desafioId });
      if (!error) await recarregar();
      return { sucesso: !error, erro: error?.message };
    },
    [recarregar]
  );

  const sairDoDesafio = useCallback(
    async (desafioId) => {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.rpc("sair_do_desafio", { p_desafio_id: desafioId });
      if (!error) await recarregar();
      return { sucesso: !error, erro: error?.message };
    },
    [recarregar]
  );

  const obterProgresso = useCallback(async (desafioId) => {
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.rpc("obter_progresso_desafio", { p_desafio_id: desafioId });
    return { dados: data ?? [], erro: error?.message };
  }, []);

  return { desafios, carregando, recarregar, criarDesafio, entrarNoDesafio, sairDoDesafio, obterProgresso };
}
