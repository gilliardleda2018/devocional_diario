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
      let notifsList = [];

      // 1. Tenta RPC primeiro
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("obter_notificacoes", { p_limite: 40 })
        .catch(() => ({ error: true }));

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        notifsList = rpcData;
      } else {
        // Fallback seguro sem dependência de nome de Foreign Key no PostgREST
        const { data: rawNotifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", usuarioId)
          .order("criado_em", { ascending: false })
          .limit(40)
          .catch(() => ({ data: null }));

        if (rawNotifs && rawNotifs.length > 0) {
          const actorIds = [...new Set(rawNotifs.map((n) => n.actor_user_id).filter(Boolean))];
          let profilesMap = {};
          if (actorIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, nome_exibicao, username, foto_url")
              .in("id", actorIds)
              .catch(() => ({ data: null }));

            if (profiles) {
              profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
            }
          }

          notifsList = rawNotifs.map((n) => {
            const actor = profilesMap[n.actor_user_id] || {};
            return {
              id: n.id,
              type: n.type,
              entity_id: n.entity_id,
              is_read: n.is_read,
              criado_em: n.criado_em,
              actor_id: n.actor_user_id,
              actor_nome: actor.nome_exibicao || "Um irmão em fé",
              actor_username: actor.username || null,
              actor_foto_url: actor.foto_url || null,
            };
          });
        }
      }

      // 2. Mescla solicitações de amizade pendentes recebidas (join manual em 2 etapas, imune a erros PostgREST)
      const { data: rawPedidos } = await supabase
        .from("amizades")
        .select("id, solicitante_id, criado_em")
        .eq("destinatario_id", usuarioId)
        .eq("status", "pendente")
        .catch(() => ({ data: null }));

      if (rawPedidos && rawPedidos.length > 0) {
        const solicitanteIds = [...new Set(rawPedidos.map((p) => p.solicitante_id).filter(Boolean))];
        let solProfilesMap = {};
        if (solicitanteIds.length > 0) {
          const { data: solProfiles } = await supabase
            .from("profiles")
            .select("id, nome_exibicao, username, foto_url")
            .in("id", solicitanteIds)
            .catch(() => ({ data: null }));

          if (solProfiles) {
            solProfilesMap = Object.fromEntries(solProfiles.map((sp) => [sp.id, sp]));
          }
        }

        rawPedidos.forEach((p) => {
          const solProfile = solProfilesMap[p.solicitante_id] || {};
          const jaExiste = notifsList.some(
            (n) => n.type === "FRIEND_REQUEST_RECEIVED" && (n.entity_id === p.id || n.actor_id === p.solicitante_id)
          );
          if (!jaExiste) {
            notifsList.unshift({
              id: `pendente_${p.id}`,
              type: "FRIEND_REQUEST_RECEIVED",
              entity_id: p.id,
              is_read: false,
              criado_em: p.criado_em || new Date().toISOString(),
              actor_id: p.solicitante_id,
              actor_nome: solProfile.nome_exibicao || "Um irmão em fé",
              actor_username: solProfile.username || null,
              actor_foto_url: solProfile.foto_url || null,
            });
          }
        });
      }

      setNotificacoes(notifsList);
    } catch (e) {
      console.error("Erro ao carregar notificações:", e);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  // Efeito principal + Supabase Realtime Listener (notifications + amizades)
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "amizades",
          filter: `destinatario_id=eq.${usuarioId}`,
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
        if (typeof id === "string" && id.startsWith("pendente_")) return;
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
