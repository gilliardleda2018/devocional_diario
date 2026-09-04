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
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_ranking_amigos", { p_limite: limite }).catch(() => ({ error: true }));

      if (!error && data && Array.isArray(data)) {
        setRanking(data);
      } else {
        // Fallback: consulta estatísticas e perfis direto
        const { data: stats } = await supabase
          .from("estatisticas_usuario")
          .select(`
            usuario_id,
            xp_total,
            ofensiva_atual,
            profiles:usuario_id (nome_exibicao, foto_url)
          `)
          .order("xp_total", { ascending: false })
          .limit(limite);

        if (stats) {
          setRanking(
            stats.map((s, idx) => ({
              posicao: idx + 1,
              usuario_id: s.usuario_id,
              nome_exibicao: s.profiles?.nome_exibicao || "Irmão em Fé",
              foto_url: s.profiles?.foto_url || null,
              xp_total: s.xp_total || 0,
              ofensiva_atual: s.ofensiva_atual || 0,
            }))
          );
        } else {
          setRanking([]);
        }
      }
    } catch (e) {
      console.error("Erro no ranking de amigos:", e);
      setRanking([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId, limite]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { ranking, carregando, recarregar };
}
