"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook para gerenciar Pedidos de Oração com resiliência total a esquemas Supabase.
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

      // 1. Buscar pedidos de oração principais
      const { data: rawRequests, error: reqError } = await supabase
        .from("prayer_requests")
        .select("id, autor_id, titulo, conteudo, visibilidade, status, criado_em")
        .order("criado_em", { ascending: false })
        .limit(40);

      if (reqError) {
        console.error("Erro na busca de prayer_requests:", reqError);
        setErro(reqError.message);
        setPedidos(obterPedidosPadrao());
        setCarregando(false);
        return;
      }

      if (!rawRequests || rawRequests.length === 0) {
        setPedidos(obterPedidosPadrao());
        setCarregando(false);
        return;
      }

      // 2. Extrair autor_ids e buscar perfis
      const autorIds = [...new Set(rawRequests.map((r) => r.autor_id).filter(Boolean))];
      const requestIds = rawRequests.map((r) => r.id);

      const [{ data: profilesData }, { data: interactionsData }] = await Promise.all([
        supabase.from("profiles").select("id, nome_exibicao, foto_url").in("id", autorIds),
        supabase.from("prayer_interactions").select("id, prayer_request_id, user_id, tipo").in("prayer_request_id", requestIds),
      ]);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const interactionsMap = (interactionsData || []).reduce((acc, i) => {
        if (!acc[i.prayer_request_id]) acc[i.prayer_request_id] = [];
        acc[i.prayer_request_id].push(i);
        return acc;
      }, {});

      // 3. Montar objetos completos
      const formatados = rawRequests.map((item) => {
        const profile = profilesMap[item.autor_id] || { nome_exibicao: "Irmão em Fé", foto_url: null };
        const interactions = interactionsMap[item.id] || [];
        const userPrayed = interactions.some((i) => i.user_id === usuarioId);

        return {
          id: item.id,
          autor_id: item.autor_id,
          user_id: item.autor_id,
          titulo: item.titulo,
          conteudo: item.conteudo,
          descricao: item.conteudo,
          visibilidade: item.visibilidade || "PUBLIC",
          is_anonimo: false,
          status: item.status || "ACTIVE",
          criado_em: item.criado_em || new Date().toISOString(),
          created_at: item.criado_em || new Date().toISOString(),
          profiles: profile,
          prayer_interactions: interactions,
          intersections: interactions,
          prayer_count: interactions.length,
          user_prayed: userPrayed,
        };
      });

      setPedidos(formatados);
    } catch (e) {
      console.error("Erro geral no usePedidosOracao:", e);
      setErro(e.message);
      setPedidos(obterPedidosPadrao());
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
          })
          .select()
          .single();

        if (!error) {
          await recarregar();
          return { data, error: null };
        }
        console.error("Erro ao criar pedido:", error);
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

      // Atualização otimista de UI instantânea
      setPedidos((prev) =>
        prev.map((item) => {
          if (item.id === prayerRequestId) {
            const jaOra = item.user_prayed;
            const novoCount = jaOra ? Math.max(0, item.prayer_count - 1) : item.prayer_count + 1;
            return {
              ...item,
              user_prayed: !jaOra,
              prayer_count: novoCount,
            };
          }
          return item;
        })
      );

      try {
        const supabase = criarClienteSupabase();
        const { data: existente } = await supabase
          .from("prayer_interactions")
          .select("id")
          .eq("prayer_request_id", prayerRequestId)
          .eq("user_id", usuarioId)
          .maybeSingle();

        if (existente) {
          await supabase.from("prayer_interactions").delete().eq("id", existente.id);
        } else {
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

function obterPedidosPadrao() {
  return [
    {
      id: "demo-prayer-1",
      autor_id: "demo-user-1",
      user_id: "demo-user-1",
      titulo: "Pela saúde da minha família e renovação de forças",
      conteudo: "Peço a intercessão dos irmãos por paz e restauração da saúde em nossa casa. Que a presença do Senhor guarde nossos corações.",
      descricao: "Peço a intercessão dos irmãos por paz e restauração da saúde em nossa casa. Que a presença do Senhor guarde nossos corações.",
      visibilidade: "PUBLIC",
      is_anonimo: false,
      criado_em: new Date(Date.now() - 3600000 * 2).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      profiles: { nome_exibicao: "Maria Santos", foto_url: null },
      prayer_interactions: [],
      intersections: [],
      prayer_count: 5,
      user_prayed: false,
    },
    {
      id: "demo-prayer-2",
      autor_id: "demo-user-2",
      user_id: "demo-user-2",
      titulo: "Sabedoria em decisões profissionais e discernimento",
      conteudo: "Pedindo direcionamento a Deus para novos projetos de trabalho. Que os passos sejam guiados segundo a vontade dEle.",
      descricao: "Pedindo direcionamento a Deus para novos projetos de trabalho. Que os passos sejam guiados segundo a vontade dEle.",
      visibilidade: "PUBLIC",
      is_anonimo: false,
      criado_em: new Date(Date.now() - 3600000 * 5).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      profiles: { nome_exibicao: "João Pedro", foto_url: null },
      prayer_interactions: [],
      intersections: [],
      prayer_count: 8,
      user_prayed: false,
    },
  ];
}
