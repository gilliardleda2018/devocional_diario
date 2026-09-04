"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Estatísticas agregadas do usuário (total de devocionais, temas distintos, XP, ofensiva).
 * Possui fallbacks para tabelas diretas (devotional_logs + streaks) para resiliência máxima.
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
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_estatisticas_usuario").catch(() => ({ error: true }));

      if (!error && data?.length) {
        setStats(data[0]);
      } else {
        // Fallback direto via devotional_logs + streaks
        const [{ count: totalLogs }, { data: streakData }] = await Promise.all([
          supabase.from("devotional_logs").select("*", { count: "exact", head: true }).eq("user_id", usuarioId),
          supabase.from("streaks").select("*").eq("user_id", usuarioId).maybeSingle(),
        ]);

        const devocionaisConcluidos = totalLogs || 0;
        const ofensivaAtual = streakData?.ofensiva_atual || 0;
        const maiorOfensiva = streakData?.maior_ofensiva || ofensivaAtual;
        const xpCalculado = (devocionaisConcluidos * 50) + (ofensivaAtual * 10);

        setStats({
          devocionais_concluidos: devocionaisConcluidos,
          temas_distintos: 1,
          ofensiva_atual: ofensivaAtual,
          maior_ofensiva: maiorOfensiva,
          xp_total: xpCalculado,
        });
      }
    } catch (e) {
      console.error("Erro ao carregar estatísticas:", e);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar, gatilhoRecarga]);

  return { stats, carregando, recarregar };
}
