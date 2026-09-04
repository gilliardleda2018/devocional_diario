"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Feed de atividade dos amigos (devocionais concluídos + torcidas
 * recebidas), mais recente primeiro. Vem da função obter_feed_amigos, que
 * nunca inclui a reflexão (texto privado) de ninguém.
 * Com atualizações EM TEMPO REAL via Supabase Realtime!
 */
export function useFeedAmigos(usuarioId, limite = 30) {
  const [feed, setFeed] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoItemAlert, setNovoItemAlert] = useState(false);

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

    if (!usuarioId) return;

    const supabase = criarClienteSupabase();
    const canal = supabase
      .channel(`feed_realtime_${usuarioId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "devocionais_diarios" },
        () => {
          setNovoItemAlert(true);
          recarregar();
          setTimeout(() => setNovoItemAlert(false), 4000);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "torcidas_amigos" },
        () => {
          setNovoItemAlert(true);
          recarregar();
          setTimeout(() => setNovoItemAlert(false), 4000);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "amigos" },
        () => {
          recarregar();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuarioId, recarregar]);

  return { feed, carregando, novoItemAlert, recarregar };
}
