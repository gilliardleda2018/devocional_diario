"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Ranking (estilo "liga" do Duolingo) -- lista os usuários com mais XP.
 * A função RPC obter_ranking() só devolve nome de exibição + números de
 * gamificação (nunca e-mail ou reflexões), então é seguro chamar direto
 * do cliente com a anon key.
 */
export function useRanking(usuarioId, limite = 20) {
  const [ranking, setRanking] = useState([]);
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setRanking([]);
      setMinhaPosicao(null);
      setCarregando(false);
      return;
    }
    const supabase = criarClienteSupabase();
    const [respostaRanking, respostaPosicao] = await Promise.all([
      supabase.rpc("obter_ranking", { p_limite: limite }),
      supabase.rpc("obter_minha_posicao"),
    ]);
    if (!respostaRanking.error) {
      setRanking(respostaRanking.data ?? []);
    }
    if (!respostaPosicao.error) {
      setMinhaPosicao(respostaPosicao.data ?? null);
    }
    setCarregando(false);
  }, [usuarioId, limite]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { ranking, minhaPosicao, carregando, recarregar };
}
