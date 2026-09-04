"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook para gerenciar Pedidos de Oração com suporte a:
 * - Filtros por visibilidade (PÚBLICO, AMIGOS, COMUNIDADE)
 * - Reação "Estou Orando" 🙏 (sem transformar em 'likes' superficiais)
 * - Privacidade estrita de textos confidenciais
 */
export function usePedidosOracao(usuarioId) {
  const [pedidosOracao, setPedidosOracao] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setPedidosOracao([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase
        .from("prayer_requests")
        .select(`
          id,
          autor_id,
          titulo,
          conteudo,
          visibilidade,
          status,
          criado_em,
          profiles:autor_id (nome_exibicao, foto_url),
          prayer_interactions (id, user_id, tipo)
        `)
        .order("criado_em", { ascending: false })
        .limit(30);

      if (!error && data) {
        setPedidosOracao(data);
      } else {
        setPedidosOracao([]);
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos de oração:", e);
      setPedidosOracao([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criarPedidoOracao = useCallback(
    async ({ titulo, conteudo, visibilidade = "PUBLIC", communityId = null }) => {
      if (!usuarioId || !titulo.trim() || !conteudo.trim()) {
        return { sucesso: false, erro: "Preencha o título e o conteúdo do pedido." };
      }
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase.from("prayer_requests").insert({
          autor_id: usuarioId,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          visibilidade,
          community_id: communityId,
        }).select().single();

        if (!error) {
          await recarregar();
          return { sucesso: true, data };
        }
        return { sucesso: false, erro: error.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  const interagirOracao = useCallback(
    async (prayerRequestId) => {
      if (!usuarioId || !prayerRequestId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.from("prayer_interactions").insert({
          prayer_request_id: prayerRequestId,
          user_id: usuarioId,
          tipo: "PRAY",
        });

        if (!error) {
          await recarregar();
          return { sucesso: true };
        }
        return { sucesso: false, erro: error.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  return {
    pedidosOracao,
    carregando,
    recarregar,
    criarPedidoOracao,
    interagirOracao,
  };
}
