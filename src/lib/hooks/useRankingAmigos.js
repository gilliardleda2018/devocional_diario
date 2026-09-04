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
          .select("usuario_id, xp_total, ofensiva_atual")
          .order("xp_total", { ascending: false })
          .limit(limite)
          .catch(() => ({ data: null }));

        if (stats && stats.length > 0) {
          const userIds = [...new Set(stats.map((s) => s.usuario_id).filter(Boolean))];
          let profilesMap = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, nome_exibicao, foto_url")
              .in("id", userIds)
              .catch(() => ({ data: null }));
            if (profs) {
              profilesMap = Object.fromEntries(profs.map((p) => [p.id, p]));
            }
          }

          setRanking(
            stats.map((s, idx) => {
              const prof = profilesMap[s.usuario_id] || {};
              return {
                posicao: idx + 1,
                usuario_id: s.usuario_id,
                nome_exibicao: prof.nome_exibicao || "Irmão em Fé",
                foto_url: prof.foto_url || null,
                xp_total: s.xp_total || 0,
                ofensiva_atual: s.ofensiva_atual || 0,
              };
            })
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
