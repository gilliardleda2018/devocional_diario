"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook para gerenciar Pedidos de Oração com suporte a:
 * - Filtros por visibilidade (PUBLIC, AMIGOS, COMMUNITY, PRIVATE)
 * - Reação "Estou Orando" 🙏
 * - Mapeamento seguro de aliases de campos
 */
export function usePedidosOracao(usuarioId) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setPedidos([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase
        .from("prayer_requests")
        .select(`
          id,
          autor_id,
          user_id:autor_id,
          titulo,
          conteudo,
          descricao:conteudo,
          visibilidade,
          is_anonimo,
          status,
          criado_em,
          created_at:criado_em,
          profiles:autor_id (id, nome_exibicao, foto_url),
          prayer_interactions (id, user_id, tipo)
        `)
        .order("criado_em", { ascending: false })
        .limit(40);

      if (!error && data) {
        // Mapear propriedades computadas para facilitar consumo na UI
        const formatados = data.map((item) => {
          const interactions = item.prayer_interactions || [];
          const userPrayed = interactions.some((i) => i.user_id === usuarioId);
          return {
            ...item,
            user_id: item.user_id || item.autor_id,
            descricao: item.descricao || item.conteudo,
            created_at: item.created_at || item.criado_em,
            prayer_count: interactions.length,
            user_prayed: userPrayed,
            intersections: interactions,
          };
        });
        setPedidos(formatados);
      } else {
        setPedidos([]);
        if (error) setErro(error.message);
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos de oração:", e);
      setPedidos([]);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criarPedido = useCallback(
    async ({ titulo, descricao, conteudo, visibilidade = "PUBLIC", isAnonimo = false, communityId = null }) => {
      const textoFinal = descricao || conteudo;
      if (!usuarioId || !titulo?.trim() || !textoFinal?.trim()) {
        return { error: "Preencha o título e o conteúdo do pedido." };
      }
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase
          .from("prayer_requests")
          .insert({
            autor_id: usuarioId,
            titulo: titulo.trim(),
            conteudo: textoFinal.trim(),
            visibilidade,
            is_anonimo: isAnonimo,
            community_id: communityId,
          })
          .select()
          .single();

        if (!error) {
          await recarregar();
          return { data, error: null };
        }
        return { error: error.message };
      } catch (e) {
        return { error: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  const alternarOracao = useCallback(
    async (prayerRequestId) => {
      if (!usuarioId || !prayerRequestId) return { error: "Parâmetros inválidos" };
      try {
        const supabase = criarClienteSupabase();

        // Checar se já orou
        const { data: existente } = await supabase
          .from("prayer_interactions")
          .select("id")
          .eq("prayer_request_id", prayerRequestId)
          .eq("user_id", usuarioId)
          .maybeSingle();

        if (existente) {
          // Remover oração
          await supabase.from("prayer_interactions").delete().eq("id", existente.id);
        } else {
          // Inserir oração
          await supabase.from("prayer_interactions").insert({
            prayer_request_id: prayerRequestId,
            user_id: usuarioId,
            tipo: "PRAY",
          });
        }

        await recarregar();
        return { error: null };
      } catch (e) {
        return { error: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  return {
    pedidos,
    pedidosOracao: pedidos,
    carregando,
    erro,
    recarregar,
    criarPedido,
    criarPedidoOracao: criarPedido,
    alternarOracao,
    interagirOracao: alternarOracao,
  };
}
