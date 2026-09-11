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
        // A RPC devolve o id da pessoa em `pessoa_id`. O PerfilAmigoModal (e
        // outras telas) reconhece `usuario_id`/`amigo_id`/`id` -- sem esse
        // apelido, clicar em alguém no feed abria o modal com id undefined.
        setFeed(
          data.map((item) => ({
            ...item,
            usuario_id: item.pessoa_id,
            amigo_id: item.pessoa_id,
            id: item.pessoa_id,
          }))
        );
      } else {
        // Fallback direto via Supabase se a RPC não estiver disponível. Busca
        // devocionais e torcidas dos amigos separadamente e mescla, para se
        // comportar como a RPC (mesmos tipos de item, mesmos nomes de campo).
        const { data: directAmigos } = await supabase
          .from("amizades")
          .select("solicitante_id, destinatario_id")
          .eq("status", "aceita")
          .or(`solicitante_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);

        const amigosIds = directAmigos
          ? directAmigos.map((a) => (a.solicitante_id === usuarioId ? a.destinatario_id : a.solicitante_id))
          : [];

        if (amigosIds.length === 0) {
          setFeed([]);
        } else {
          const [{ data: devocionais }, { data: torcidasRecebidas }] = await Promise.all([
            supabase
              .from("devotional_logs")
              .select("id, user_id, criado_em, tema_oracao, referencia_versiculo")
              .in("user_id", amigosIds)
              .order("criado_em", { ascending: false })
              .limit(limite)
              .catch(() => ({ data: null })),
            supabase
              .from("torcidas")
              .select("id, remetente_id, criado_em")
              .eq("destinatario_id", usuarioId)
              .order("criado_em", { ascending: false })
              .limit(limite)
              .catch(() => ({ data: null })),
          ]);

          const pessoaIds = [
            ...new Set([
              ...(devocionais || []).map((d) => d.user_id),
              ...(torcidasRecebidas || []).map((t) => t.remetente_id),
            ].filter(Boolean)),
          ];

          let profilesMap = {};
          if (pessoaIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, nome_exibicao, foto_url")
              .in("id", pessoaIds)
              .catch(() => ({ data: null }));
            if (profs) {
              profilesMap = Object.fromEntries(profs.map((p) => [p.id, p]));
            }
          }

          const itensDevocional = (devocionais || []).map((d) => {
            const prof = profilesMap[d.user_id] || {};
            return {
              id: d.user_id,
              tipo: "devocional",
              usuario_id: d.user_id,
              amigo_id: d.user_id,
              nome_exibicao: prof.nome_exibicao || "Irmão em Fé",
              foto_url: prof.foto_url || null,
              quando: d.criado_em,
              tema_oracao: d.tema_oracao,
              referencia_versiculo: d.referencia_versiculo,
            };
          });

          const itensTorcida = (torcidasRecebidas || []).map((t) => {
            const prof = profilesMap[t.remetente_id] || {};
            return {
              id: t.remetente_id,
              tipo: "torcida",
              usuario_id: t.remetente_id,
              amigo_id: t.remetente_id,
              nome_exibicao: prof.nome_exibicao || "Irmão em Fé",
              foto_url: prof.foto_url || null,
              quando: t.criado_em,
            };
          });

          setFeed(
            [...itensDevocional, ...itensTorcida]
              .sort((a, b) => new Date(b.quando) - new Date(a.quando))
              .slice(0, limite)
          );
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
        { event: "INSERT", schema: "public", table: "devotional_logs" },
        () => {
          setNovoItemAlert(true);
          recarregar();
          setTimeout(() => setNovoItemAlert(false), 4000);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "torcidas" },
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
