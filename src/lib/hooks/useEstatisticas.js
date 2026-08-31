"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Estatísticas agregadas do usuário (total de devocionais, temas
 * distintos, XP, ofensiva) -- usadas pra calcular XP/nível e badges na
 * tela de Progresso. Vem de uma função RPC (obter_estatisticas_usuario)
 * pra não precisar de 3-4 queries separadas no cliente.
 */
export function useEstatisticas(usuarioId, gatilhoRecarga) {
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setStats(null);
      setCarregando(false);
      return;
    }
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.rpc("obter_estatisticas_usuario");
    if (!error && data?.length) {
      setStats(data[0]);
    }
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarregar, gatilhoRecarga]);

  return { stats, carregando, recarregar };
}
