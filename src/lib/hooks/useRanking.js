"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Ranking de gamificação (Liga de Fé).
 * Possui fallbacks para tabelas diretas caso a RPC não esteja instalada no Supabase.
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
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const [respostaRanking, respostaPosicao] = await Promise.all([
        supabase.rpc("obter_ranking", { p_limite: limite }).catch(() => ({ error: true })),
        supabase.rpc("obter_minha_posicao").catch(() => ({ error: true })),
      ]);

      if (!respostaRanking.error && respostaRanking.data?.length) {
        setRanking(respostaRanking.data);
      } else {
        // Fallback direto via streaks / profiles
        const { data: topData } = await supabase
          .from("streaks")
          .select("user_id, xp_total")
          .order("xp_total", { ascending: false })
          .limit(limite)
          .catch(() => ({ data: null }));

        if (topData && topData.length > 0) {
          const userIds = [...new Set(topData.map((item) => item.user_id).filter(Boolean))];
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

          const list = topData.map((item, idx) => {
            const prof = profilesMap[item.user_id] || {};
            return {
              posicao: idx + 1,
              usuario_id: item.user_id,
              nome_exibicao: prof.nome_exibicao || "Fiel",
              foto_url: prof.foto_url || null,
              xp_total: item.xp_total || 0,
              sou_eu: item.user_id === usuarioId,
            };
          });
          setRanking(list);
          const eu = list.find((i) => i.sou_eu);
          if (eu) setMinhaPosicao(eu.posicao);
        } else {
          // Se não houver dados, incluir o próprio usuário
          const { data: userProfile } = await supabase.from("profiles").select("nome_exibicao, foto_url").eq("id", usuarioId).maybeSingle();
          setRanking([
            {
              posicao: 1,
              usuario_id: usuarioId,
              nome_exibicao: userProfile?.nome_exibicao || "Você",
              foto_url: userProfile?.foto_url || null,
              xp_total: 50,
              sou_eu: true,
            },
          ]);
          setMinhaPosicao(1);
        }
      }

      if (!respostaPosicao.error && respostaPosicao.data) {
        setMinhaPosicao(respostaPosicao.data);
      }
    } catch (e) {
      console.error("Erro no ranking:", e);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId, limite]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { ranking, minhaPosicao, carregando, recarregar };
}
