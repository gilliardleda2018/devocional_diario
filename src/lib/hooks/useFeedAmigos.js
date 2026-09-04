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
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_feed_amigos", { p_limite: limite }).catch(() => ({ error: true }));

      if (!error && data && Array.isArray(data)) {
        setFeed(data);
      } else {
        // Fallback direto via Supabase se RPC não estiver presente
        const { data: directAmigos } = await supabase
          .from("amizades")
          .select("solicitante_id, destinatario_id")
          .eq("status", "aceita")
          .or(`solicitante_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);

        const amigosIds = directAmigos
          ? directAmigos.map((a) => (a.solicitante_id === usuarioId ? a.destinatario_id : a.solicitante_id))
          : [];

        if (amigosIds.length > 0) {
          const { data: devocionais } = await supabase
            .from("devocionais_diarios")
            .select("id, usuario_id, criado_em, tema_oracao, referencia_versiculo")
            .in("usuario_id", amigosIds)
            .order("criado_em", { ascending: false })
            .limit(limite)
            .catch(() => ({ data: null }));

          if (devocionais && devocionais.length > 0) {
            const userIds = [...new Set(devocionais.map((d) => d.usuario_id).filter(Boolean))];
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

            setFeed(
              devocionais.map((d) => {
                const prof = profilesMap[d.usuario_id] || {};
                return {
                  id: d.id,
                  tipo: "devocional",
                  usuario_id: d.usuario_id,
                  nome_exibicao: prof.nome_exibicao || "Irmão em Fé",
                  foto_url: prof.foto_url || null,
                  quando: d.criado_em,
                  tema_oracao: d.tema_oracao,
                  referencia_versiculo: d.referencia_versiculo,
                };
              })
            );
          } else {
            setFeed([]);
          }
        } else {
          setFeed([]);
        }
      }
    } catch (e) {
      console.error("Erro no feed de amigos:", e);
      setFeed([]);
    } finally {
      setCarregando(false);
    }
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
        { event: "*", schema: "public", table: "amizades" },
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
