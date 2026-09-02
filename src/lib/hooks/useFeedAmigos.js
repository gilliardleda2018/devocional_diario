"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Feed de atividade dos amigos (devocionais concluídos + torcidas
 * recebidas), mais recente primeiro. Vem da função obter_feed_amigos, que
 * nunca inclui a reflexão (texto privado) de ninguém.
 */
export function useFeedAmigos(usuarioId, limite = 30) {
  const [feed, setFeed] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setFeed([]);
      setCarregando(false);
      return;
    }
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.rpc("obter_feed_amigos", { p_limite: limite });
    if (!error) setFeed(data ?? []);
    setCarregando(false);
  }, [usuarioId, limite]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { feed, carregando, recarregar };
}
