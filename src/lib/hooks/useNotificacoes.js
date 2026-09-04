import { useState, useEffect, useCallback, useMemo } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

export function useNotificacoes(usuarioId) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarNotificacoes = useCallback(async () => {
    if (!usuarioId) return;
    setCarregando(true);
    setErro(null);

    try {
      const supabase = criarClienteSupabase();

      // Tenta RPC primeiro
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("obter_notificacoes", { p_limite: 40 })
        .catch(() => ({ error: true }));

      if (!rpcError && Array.isArray(rpcData)) {
        setNotificacoes(rpcData);
        setCarregando(false);
        return;
      }

      // Fallback: consulta direta na tabela notifications + profiles
      const { data: rawNotifs } = await supabase
        .from("notifications")
        .select("*, actor:profiles!notifications_actor_user_id_fkey(id, nome_exibicao, username, foto_url)")
        .eq("user_id", usuarioId)
        .order("criado_em", { ascending: false })
        .limit(40);

      if (rawNotifs) {
        const formatadas = rawNotifs.map((n) => ({
          id: n.id,
          type: n.type,
          entity_id: n.entity_id,
          is_read: n.is_read,
          criado_em: n.criado_em,
          actor_id: n.actor?.id || n.actor_user_id,
          actor_nome: n.actor?.nome_exibicao || "Um fiel",
          actor_username: n.actor?.username,
          actor_foto_url: n.actor?.foto_url,
        }));
        setNotificacoes(formatadas);
      }
    } catch (e) {
      console.error("Erro ao carregar notificações:", e);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  // Efeito principal + Supabase Realtime Listener
  useEffect(() => {
    carregarNotificacoes();

    if (!usuarioId) return;

    const supabase = criarClienteSupabase();
    const canal = supabase
      .channel(`notificacoes_user_${usuarioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${usuarioId}`,
        },
        () => {
          carregarNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuarioId, carregarNotificacoes]);

  // Ações de Leitura
  const marcarComoLida = useCallback(
    async (id) => {
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      try {
        const supabase = criarClienteSupabase();
        await supabase.rpc("marcar_notificacao_lida", { p_id: id }).catch(async () => {
          await supabase.from("notifications").update({ is_read: true, lido_em: new Date().toISOString() }).eq("id", id);
        });
      } catch (e) {
        console.error("Erro ao marcar notificação como lida:", e);
      }
    },
    []
  );

  const marcarTodasComoLidas = useCallback(async () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      const supabase = criarClienteSupabase();
      await supabase.rpc("marcar_todas_notificacoes_lidas").catch(async () => {
        await supabase.from("notifications").update({ is_read: true, lido_em: new Date().toISOString() }).eq("user_id", usuarioId);
      });
    } catch (e) {
      console.error("Erro ao marcar todas notificações como lidas:", e);
    }
  }, [usuarioId]);

  // Contagem de Não Lidas
  const unreadNotificationsCount = useMemo(() => {
    return notificacoes.filter((n) => !n.is_read).length;
  }, [notificacoes]);

  // Agrupamento por Período de Data
  const notificacoesAgrupadas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const umaSemanaAtras = new Date(hoje);
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

    const grupos = {
      hoje: [],
      ontem: [],
      estaSemana: [],
      maisAntigas: [],
    };

    notificacoes.forEach((item) => {
      const d = new Date(item.criado_em);
      if (d >= hoje) {
        grupos.hoje.push(item);
      } else if (d >= ontem) {
        grupos.ontem.push(item);
      } else if (d >= umaSemanaAtras) {
        grupos.estaSemana.push(item);
      } else {
        grupos.maisAntigas.push(item);
      }
    });

    return grupos;
  }, [notificacoes]);

  return {
    notificacoes,
    notificacoesAgrupadas,
    unreadNotificationsCount,
    carregando,
    erro,
    marcarComoLida,
    marcarTodasComoLidas,
    recarregar: carregarNotificacoes,
  };
}
