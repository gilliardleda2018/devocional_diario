"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook para gerenciar Pedidos de Oração com resiliência total a esquemas Supabase.
 * Passe `communityId` para ver/postar só no mural de uma comunidade específica
 * (RLS já garante que só membros leem pedidos COMMUNITY dessa comunidade).
 */
export function usePedidosOracao(usuarioId, communityId = null) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [comentarios, setComentarios] = useState({}); // prayer_request_id -> { itens, carregando, carregado }

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
      let query = supabase
        .from("prayer_requests")
        .select("id, autor_id, titulo, conteudo, visibilidade, status, community_id, criado_em")
        .order("criado_em", { ascending: false })
        .limit(40);

      if (communityId) {
        query = query.eq("community_id", communityId);
      }

      const { data: rawRequests, error: reqError } = await query;

      if (reqError) {
        console.error("Erro na busca de prayer_requests:", reqError);
        setErro(reqError.message);
        setPedidos([]);
        setCarregando(false);
        return;
      }

      if (!rawRequests || rawRequests.length === 0) {
        setPedidos([]);
        setCarregando(false);
        return;
      }

      // 2. Extrair autor_ids e buscar perfis, interações e contagem de comentários
      const autorIds = [...new Set(rawRequests.map((r) => r.autor_id).filter(Boolean))];
      const requestIds = rawRequests.map((r) => r.id);

      const [{ data: profilesData }, { data: interactionsData }, { data: commentsData }] = await Promise.all([
        supabase.from("profiles").select("id, nome_exibicao, foto_url").in("id", autorIds),
        supabase.from("prayer_interactions").select("id, prayer_request_id, user_id, tipo").in("prayer_request_id", requestIds),
        supabase.from("prayer_comments").select("id, prayer_request_id").in("prayer_request_id", requestIds),
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

      const commentCountMap = (commentsData || []).reduce((acc, c) => {
        acc[c.prayer_request_id] = (acc[c.prayer_request_id] || 0) + 1;
        return acc;
      }, {});

      // 3. Montar objetos completos
      const formatados = rawRequests.map((item) => {
        const profile = profilesMap[item.autor_id] || { nome_exibicao: "Irmão em Fé", foto_url: null };
        const interactions = interactionsMap[item.id] || [];
        const oracoes = interactions.filter((i) => i.tipo === "PRAY");
        const curtidas = interactions.filter((i) => i.tipo === "ENCOURAGE");
        const userPrayed = oracoes.some((i) => i.user_id === usuarioId);
        const userLiked = curtidas.some((i) => i.user_id === usuarioId);

        return {
          id: item.id,
          autor_id: item.autor_id,
          user_id: item.autor_id,
          titulo: item.titulo,
          conteudo: item.conteudo,
          descricao: item.conteudo,
          visibilidade: item.visibilidade || "PUBLIC",
          community_id: item.community_id || null,
          is_anonimo: false,
          status: item.status || "ACTIVE",
          criado_em: item.criado_em || new Date().toISOString(),
          created_at: item.criado_em || new Date().toISOString(),
          profiles: profile,
          prayer_interactions: interactions,
          intersections: oracoes,
          prayer_count: oracoes.length,
          user_prayed: userPrayed,
          like_count: curtidas.length,
          user_liked: userLiked,
          comment_count: commentCountMap[item.id] || 0,
        };
      });

      setPedidos(formatados);
    } catch (e) {
      console.error("Erro geral no usePedidosOracao:", e);
      setErro(e.message);
      setPedidos([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId, communityId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criarPedido = useCallback(
    async ({ titulo, descricao, conteudo, visibilidade = "PUBLIC", isAnonimo = false, communityId: communityIdParam }) => {
      const textoFinal = descricao || conteudo;
      if (!usuarioId || !titulo?.trim() || !textoFinal?.trim()) {
        return { error: "Preencha o título e o conteúdo do pedido." };
      }
      // Se chamado a partir do mural de uma comunidade específica (hook já
      // aberto com communityId), usa esse -- senão, o que foi passado na hora.
      const communityIdFinal = communityIdParam ?? communityId ?? null;
      if (visibilidade === "COMMUNITY" && !communityIdFinal) {
        return { error: "Escolha uma comunidade para publicar este pedido." };
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
            community_id: visibilidade === "COMMUNITY" ? communityIdFinal : null,
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
    [usuarioId, communityId, recarregar]
  );

  const alternarInteracao = useCallback(
    async (prayerRequestId, tipo, campoAtivo, campoContagem) => {
      if (!usuarioId || !prayerRequestId) return { error: "Parâmetros inválidos" };

      // Atualização otimista de UI instantânea
      setPedidos((prev) =>
        prev.map((item) => {
          if (item.id === prayerRequestId) {
            const jaAtivo = item[campoAtivo];
            const novaContagem = jaAtivo ? Math.max(0, item[campoContagem] - 1) : item[campoContagem] + 1;
            return {
              ...item,
              [campoAtivo]: !jaAtivo,
              [campoContagem]: novaContagem,
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
          .eq("tipo", tipo)
          .maybeSingle();

        if (existente) {
          await supabase.from("prayer_interactions").delete().eq("id", existente.id);
        } else {
          await supabase.from("prayer_interactions").insert({
            prayer_request_id: prayerRequestId,
            user_id: usuarioId,
            tipo,
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

  const alternarOracao = useCallback(
    (prayerRequestId) => alternarInteracao(prayerRequestId, "PRAY", "user_prayed", "prayer_count"),
    [alternarInteracao]
  );

  const alternarCurtida = useCallback(
    (prayerRequestId) => alternarInteracao(prayerRequestId, "ENCOURAGE", "user_liked", "like_count"),
    [alternarInteracao]
  );

  const carregarComentarios = useCallback(
    async (prayerRequestId) => {
      setComentarios((prev) => ({
        ...prev,
        [prayerRequestId]: { ...(prev[prayerRequestId] || {}), carregando: true },
      }));
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase
          .from("prayer_comments")
          .select("id, prayer_request_id, autor_id, conteudo, criado_em")
          .eq("prayer_request_id", prayerRequestId)
          .order("criado_em", { ascending: true });

        if (error) throw error;

        const autorIds = [...new Set((data || []).map((c) => c.autor_id))];
        const { data: profilesData } = autorIds.length
          ? await supabase.from("profiles").select("id, nome_exibicao, foto_url").in("id", autorIds)
          : { data: [] };
        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const itens = (data || []).map((c) => ({
          ...c,
          profiles: profilesMap[c.autor_id] || { nome_exibicao: "Irmão em Fé", foto_url: null },
        }));

        setComentarios((prev) => ({
          ...prev,
          [prayerRequestId]: { itens, carregando: false, carregado: true },
        }));
      } catch (e) {
        console.error("Erro ao carregar comentários:", e);
        setComentarios((prev) => ({
          ...prev,
          [prayerRequestId]: { itens: [], carregando: false, carregado: true, erro: e.message },
        }));
      }
    },
    []
  );

  const adicionarComentario = useCallback(
    async (prayerRequestId, conteudo) => {
      if (!usuarioId || !prayerRequestId || !conteudo?.trim()) {
        return { error: "Escreva algo antes de comentar." };
      }
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase
          .from("prayer_comments")
          .insert({
            prayer_request_id: prayerRequestId,
            autor_id: usuarioId,
            conteudo: conteudo.trim(),
          })
          .select("id, prayer_request_id, autor_id, conteudo, criado_em")
          .single();

        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, nome_exibicao, foto_url")
          .eq("id", usuarioId)
          .maybeSingle();

        const novoComentario = { ...data, profiles: profile || { nome_exibicao: "Você", foto_url: null } };

        setComentarios((prev) => {
          const atual = prev[prayerRequestId]?.itens || [];
          return {
            ...prev,
            [prayerRequestId]: { itens: [...atual, novoComentario], carregando: false, carregado: true },
          };
        });
        setPedidos((prev) =>
          prev.map((item) =>
            item.id === prayerRequestId ? { ...item, comment_count: (item.comment_count || 0) + 1 } : item
          )
        );

        return { data: novoComentario, error: null };
      } catch (e) {
        console.error("Erro ao comentar:", e);
        return { error: e.message };
      }
    },
    [usuarioId]
  );

  const removerComentario = useCallback(async (prayerRequestId, comentarioId) => {
    try {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.from("prayer_comments").delete().eq("id", comentarioId);
      if (error) throw error;

      setComentarios((prev) => {
        const atual = prev[prayerRequestId]?.itens || [];
        return {
          ...prev,
          [prayerRequestId]: { ...prev[prayerRequestId], itens: atual.filter((c) => c.id !== comentarioId) },
        };
      });
      setPedidos((prev) =>
        prev.map((item) =>
          item.id === prayerRequestId ? { ...item, comment_count: Math.max(0, (item.comment_count || 0) - 1) } : item
        )
      );
      return { error: null };
    } catch (e) {
      console.error("Erro ao remover comentário:", e);
      return { error: e.message };
    }
  }, []);

  return {
    pedidos,
    pedidosOracao: pedidos,
    carregando,
    erro,
    recarregar,
    criarPedido,
    criarPedidoOracao: criarPedido,
    alternarOracao,
    alternarCurtida,
    interagirOracao: alternarOracao,
    comentarios,
    carregarComentarios,
    adicionarComentario,
    removerComentario,
  };
}
