"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook de Amigos e Conexões com resiliência total, suporte a solicitações
 * recebidas e enviadas, bloqueios, busca paginada e tempo real.
 */
export function useAmigos(usuarioId) {
  const [amigos, setAmigos] = useState([]);
  const [pedidos, setPedidos] = useState([]); // Recebidos
  const [pedidosEnviados, setPedidosEnviados] = useState([]); // Enviados
  const [meuCodigo, setMeuCodigo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setAmigos([]);
      setPedidos([]);
      setPedidosEnviados([]);
      setMeuCodigo(null);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);

    try {
      const supabase = criarClienteSupabase();
      const [respostaAmigos, respostaPedidos, respostaCodigo] = await Promise.all([
        supabase.rpc("obter_meus_amigos").catch(() => ({ error: true })),
        supabase.rpc("obter_pedidos_pendentes").catch(() => ({ error: true })),
        supabase.rpc("obter_meu_codigo_amigo").catch(() => ({ error: true })),
      ]);

      // 1. Amigos Aceitos
      let listaAmigos = [];
      if (!respostaAmigos.error && respostaAmigos.data && Array.isArray(respostaAmigos.data)) {
        listaAmigos = respostaAmigos.data;
      } else {
        const { data: directAmigos } = await supabase
          .from("amizades")
          .select("id, solicitante_id, destinatario_id, status")
          .eq("status", "aceita")
          .or(`solicitante_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
          .catch(() => ({ data: null }));

        if (directAmigos && directAmigos.length > 0) {
          const outrosIds = [...new Set(
            directAmigos.map((item) => (item.solicitante_id === usuarioId ? item.destinatario_id : item.solicitante_id)).filter(Boolean)
          )];

          let profilesMap = {};
          if (outrosIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, nome_exibicao, foto_url, username, codigo_amigo")
              .in("id", outrosIds)
              .catch(() => ({ data: null }));

            if (profs) {
              profilesMap = Object.fromEntries(profs.map((p) => [p.id, p]));
            }
          }

          listaAmigos = directAmigos.map((item) => {
            const outroId = item.solicitante_id === usuarioId ? item.destinatario_id : item.solicitante_id;
            const outro = profilesMap[outroId] || {};
            return {
              amizade_id: item.id,
              amigo_id: outroId,
              usuario_id: outroId,
              id: outroId,
              nome_exibicao: outro.nome_exibicao || "Irmão em Fé",
              username: outro.username || null,
              foto_url: outro.foto_url || null,
              codigo_amigo: outro.codigo_amigo || null,
            };
          });
        }
      }
      setAmigos(listaAmigos);

      // 2. Pedidos Recebidos
      let listaPedidos = [];
      if (!respostaPedidos.error && respostaPedidos.data && Array.isArray(respostaPedidos.data)) {
        listaPedidos = respostaPedidos.data;
      } else {
        const { data: directPedidos } = await supabase
          .from("amizades")
          .select("id, solicitante_id, criado_em")
          .eq("destinatario_id", usuarioId)
          .eq("status", "pendente")
          .catch(() => ({ data: null }));

        if (directPedidos && directPedidos.length > 0) {
          const solicitantesIds = [...new Set(directPedidos.map((p) => p.solicitante_id).filter(Boolean))];
          let profilesMap = {};
          if (solicitantesIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, nome_exibicao, foto_url, username")
              .in("id", solicitantesIds)
              .catch(() => ({ data: null }));
            if (profs) {
              profilesMap = Object.fromEntries(profs.map((p) => [p.id, p]));
            }
          }

          listaPedidos = directPedidos.map((item) => {
            const sol = profilesMap[item.solicitante_id] || {};
            return {
              id: item.id,
              amizade_id: item.id,
              solicitante_id: item.solicitante_id,
              nome_exibicao: sol.nome_exibicao || "Irmão em Fé",
              username: sol.username || null,
              foto_url: sol.foto_url || null,
              criado_em: item.criado_em,
            };
          });
        }
      }
      setPedidos(listaPedidos);

      // 3. Pedidos Enviados
      const { data: directEnviados } = await supabase
        .from("amizades")
        .select("id, destinatario_id, criado_em")
        .eq("solicitante_id", usuarioId)
        .eq("status", "pendente")
        .catch(() => ({ data: null }));

      if (directEnviados && directEnviados.length > 0) {
        const destsIds = [...new Set(directEnviados.map((p) => p.destinatario_id).filter(Boolean))];
        let profilesMap = {};
        if (destsIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, nome_exibicao, foto_url, username")
            .in("id", destsIds)
            .catch(() => ({ data: null }));
          if (profs) {
            profilesMap = Object.fromEntries(profs.map((p) => [p.id, p]));
          }
        }

        const listaEnviados = directEnviados.map((item) => {
          const dest = profilesMap[item.destinatario_id] || {};
          return {
            id: item.id,
            amizade_id: item.id,
            destinatario_id: item.destinatario_id,
            nome_exibicao: dest.nome_exibicao || "Irmão em Fé",
            username: dest.username || null,
            foto_url: dest.foto_url || null,
            criado_em: item.criado_em,
          };
        });
        setPedidosEnviados(listaEnviados);
      } else {
        setPedidosEnviados([]);
      }

      // 4. Código do Usuário
      if (!respostaCodigo.error && respostaCodigo.data) {
        setMeuCodigo(respostaCodigo.data);
      } else {
        const { data: prof } = await supabase.from("profiles").select("codigo_amigo").eq("id", usuarioId).maybeSingle();
        setMeuCodigo(prof?.codigo_amigo || usuarioId.slice(0, 8));
      }
    } catch (e) {
      console.error("Erro ao carregar amigos:", e);
      setAmigos([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();

    if (!usuarioId) return;

    const supabase = criarClienteSupabase();
    const canal = supabase
      .channel(`amizades_realtime_${usuarioId}`)
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

  // Função centralizada para estado da conexão
  const getRelationshipState = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId) return "NONE";
      if (usuarioId === targetId) return "SELF";

      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase.rpc("get_relationship_state", { p_target_id: targetId });
        if (!error && data) return data;
      } catch (e) {
        console.error("Erro ao obter estado do relacionamento:", e);
      }

      // Fallback local
      if (amigos.some((a) => a.amigo_id === targetId || a.id === targetId || a.usuario_id === targetId)) {
        return "FRIENDS";
      }
      if (pedidosEnviados.some((p) => p.destinatario_id === targetId)) {
        return "REQUEST_SENT";
      }
      if (pedidos.some((p) => p.solicitante_id === targetId)) {
        return "REQUEST_RECEIVED";
      }
      return "NONE";
    },
    [usuarioId, amigos, pedidosEnviados, pedidos]
  );

  // Busca Paginada de Pessoas por Nome, Username, Cidade ou Igreja
  const buscarUsuarios = useCallback(
    async (termo, limite = 20, offset = 0) => {
      if (!termo || termo.trim().length < 2) return [];
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase
          .rpc("buscar_usuarios", {
            p_termo: termo.trim(),
            p_limite: limite,
            p_offset: offset,
          })
          .catch(() => ({ error: true }));

        if (!error && data && Array.isArray(data)) return data;

        // Fallback direto
        const { data: rawData } = await supabase
          .from("profiles")
          .select("id, nome_exibicao, username, foto_url, cidade, igreja, codigo_amigo")
          .or(`nome_exibicao.ilike.%${termo.trim()}%,username.ilike.%${termo.trim()}%`)
          .neq("id", usuarioId)
          .limit(limite)
          .catch(() => ({ data: null }));

        return rawData ?? [];
      } catch (e) {
        return [];
      }
    },
    [usuarioId]
  );

  const enviarPedido = useCallback(
    async (identificador) => {
      if (!usuarioId || !identificador) return { sucesso: false, erro: "Código ou usuário inválido." };
      setErro(null);

      try {
        const supabase = criarClienteSupabase();
        const { error: rpcError } = await supabase
          .rpc("enviar_pedido_amizade_v2", { p_identificador: identificador })
          .catch(() => ({ error: true }));

        if (!rpcError) {
          await recarregar();
          return { sucesso: true };
        }

        // Tenta v1 RPC
        const { error: rpc1Error } = await supabase
          .rpc("enviar_pedido_amizade", { p_codigo_amigo: identificador })
          .catch(() => ({ error: true }));

        if (!rpc1Error) {
          await recarregar();
          return { sucesso: true };
        }

        // Fallback direto
        let targetId = identificador;
        if (identificador.length !== 36) {
          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("id")
            .or(`codigo_amigo.eq.${identificador},username.eq.${identificador.replace('@','')}`)
            .maybeSingle();

          if (!targetProfile) {
            return { sucesso: false, erro: "Usuário não encontrado." };
          }
          targetId = targetProfile.id;
        }

        const { error: insertError } = await supabase.from("amizades").insert({
          solicitante_id: usuarioId,
          destinatario_id: targetId,
          status: "pendente",
        });

        if (insertError) {
          return { sucesso: false, erro: insertError.message };
        }

        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  const cancelarPedido = useCallback(
    async (amizadeId) => {
      try {
        const supabase = criarClienteSupabase();
        await supabase.rpc("cancelar_pedido_amizade", { p_amizade_id: amizadeId }).catch(async () => {
          await supabase.from("amizades").delete().eq("id", amizadeId);
        });
        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const responderPedido = useCallback(
    async (amizadeId, aceitar) => {
      try {
        const supabase = criarClienteSupabase();
        const { error: rpcError } = await supabase.rpc("responder_pedido_amizade_v2", {
          p_amizade_id: amizadeId,
          p_aceitar: aceitar,
        }).catch(() => ({ error: true }));

        if (rpcError) {
          if (aceitar) {
            await supabase.from("amizades").update({ status: "aceita" }).eq("id", amizadeId);
          } else {
            await supabase.from("amizades").delete().eq("id", amizadeId);
          }
        }

        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const removerAmigo = useCallback(
    async (amigoIdOuAmizadeId) => {
      try {
        const supabase = criarClienteSupabase();
        // Tenta RPC remover_amizade
        await supabase.rpc("remover_amizade", { p_amigo_id: amigoIdOuAmizadeId }).catch(async () => {
          await supabase.from("amizades").delete().or(`id.eq.${amigoIdOuAmizadeId},solicitante_id.eq.${amigoIdOuAmizadeId},destinatario_id.eq.${amigoIdOuAmizadeId}`);
        });

        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const bloquearUsuario = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        await supabase.rpc("bloquear_usuario", { p_target_id: targetId }).catch(async () => {
          await supabase.from("user_blocks").insert({ blocker_id: usuarioId, blocked_id: targetId });
          await supabase.from("amizades").delete().or(`solicitante_id.eq.${targetId},destinatario_id.eq.${targetId}`);
        });

        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  const desbloquearUsuario = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        await supabase.rpc("desbloquear_usuario", { p_target_id: targetId }).catch(async () => {
          await supabase.from("user_blocks").delete().eq("blocker_id", usuarioId).eq("blocked_id", targetId);
        });

        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, recarregar]
  );

  const torcer = useCallback(
    async (amigoId) => {
      if (!usuarioId || !amigoId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("enviar_torcida", { p_destinatario_id: amigoId }).catch(() => ({ error: true }));
        if (error) {
          await supabase.from("torcidas_amigos").insert({
            remetente_id: usuarioId,
            destinatario_id: amigoId,
            criado_em: new Date().toISOString(),
          }).catch(() => {});
        }
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId]
  );

  return {
    amigos,
    pedidos,
    pedidosEnviados,
    meuCodigo,
    carregando,
    erro,
    recarregar,
    getRelationshipState,
    buscarUsuarios,
    enviarPedido,
    cancelarPedido,
    responderPedido,
    removerAmigo,
    bloquearUsuario,
    desbloquearUsuario,
    torcer,
  };
}
