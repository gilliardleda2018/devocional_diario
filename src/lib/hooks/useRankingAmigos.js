"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/** "Liga" filtrada só entre você e seus amigos aceitos (ver useRanking para a versão geral). */
export function useRankingAmigos(usuarioId, limite = 20) {
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setRanking([]);
      setCarregando(false);
      return;
    }
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.rpc("obter_ranking_amigos", { p_limite: limite });
    if (!error) setRanking(data ?? []);
    setCarregando(false);
  }, [usuarioId, limite]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { ranking, carregando, recarregar };
}
