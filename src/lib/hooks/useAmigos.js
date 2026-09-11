"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import { RELATIONSHIP_STATES, validarUsername } from "@/src/lib/constants";

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

      // 1. Amigos Aceitos - Query direta em amizades
      const { data: directAmigos } = await supabase
        .from("amizades")
        .select("id, solicitante_id, destinatario_id, status")
        .eq("status", "aceita")
        .or(`solicitante_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
        .catch(() => ({ data: null }));

      let listaAmigos = [];
      if (directAmigos && directAmigos.length > 0) {
        const outrosIds = [...new Set(
          directAmigos.map((item) => (item.solicitante_id === usuarioId ? item.destinatario_id : item.solicitante_id)).filter(Boolean)
        )];

        let profilesMap = {};
        if (outrosIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, nome_exibicao, foto_url, username, codigo_amigo, cidade, igreja")
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
            cidade: outro.cidade || null,
            igreja: outro.igreja || null,
          };
        });
      } else {
        const { data: rpcAmigos } = await supabase.rpc("obter_meus_amigos").catch(() => ({ data: null }));
        if (rpcAmigos && Array.isArray(rpcAmigos) && rpcAmigos.length > 0) {
          listaAmigos = rpcAmigos;
        }
      }
      setAmigos(listaAmigos);

      // 2. Pedidos Recebidos
      const { data: directPedidos } = await supabase
        .from("amizades")
        .select("id, solicitante_id, criado_em")
        .eq("destinatario_id", usuarioId)
        .eq("status", "pendente")
        .catch(() => ({ data: null }));

      let listaPedidos = [];
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
      } else {
        const { data: rpcPedidos } = await supabase.rpc("obter_pedidos_pendentes").catch(() => ({ data: null }));
        if (rpcPedidos && Array.isArray(rpcPedidos) && rpcPedidos.length > 0) {
          listaPedidos = rpcPedidos;
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
      const { data: prof } = await supabase.from("profiles").select("codigo_amigo").eq("id", usuarioId).maybeSingle().catch(() => ({ data: null }));
      setMeuCodigo(prof?.codigo_amigo || (usuarioId ? usuarioId.slice(0, 8) : "devocional"));
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

  // Função centralizada para estado da conexão (Fonte única de verdade)
  const getRelationshipState = useCallback(
    (targetId) => {
      if (!usuarioId || !targetId) return RELATIONSHIP_STATES.NONE;
      if (usuarioId === targetId) return RELATIONSHIP_STATES.SELF;

      if (amigos.some((a) => a.amigo_id === targetId || a.id === targetId || a.usuario_id === targetId)) {
        return RELATIONSHIP_STATES.FRIENDS;
      }
      if (pedidosEnviados.some((p) => p.destinatario_id === targetId)) {
        return RELATIONSHIP_STATES.REQUEST_SENT;
      }
      if (pedidos.some((p) => p.solicitante_id === targetId)) {
        return RELATIONSHIP_STATES.REQUEST_RECEIVED;
      }
      return RELATIONSHIP_STATES.NONE;
    },
    [usuarioId, amigos, pedidosEnviados, pedidos]
  );

  // Amigos em comum entre o usuário logado e um candidato
  const getMutualFriends = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId || usuarioId === targetId) return { total: 0, preview: [] };
      try {
        const supabase = criarClienteSupabase();
        const { data } = await supabase.rpc("obter_amigos_em_comum", { p_target_id: targetId }).catch(() => ({ data: null }));
        if (data && Array.isArray(data) && data.length > 0) {
          const total = Number(data[0].total_mutuos || data.length);
          const preview = data.filter((d) => d.amigo_id).map((d) => ({
            id: d.amigo_id,
            nome_exibicao: d.nome_exibicao,
            foto_url: d.foto_url,
          }));
          return { total, preview };
        }
        return { total: 0, preview: [] };
      } catch {
        return { total: 0, preview: [] };
      }
    },
    [usuarioId]
  );

  // Busca Paginada de Pessoas por Nome, Username, Cidade ou Igreja.
  // A RPC é a fonte de verdade (aplica privacidade granular: discoverable,
  // show_city, show_church e bloqueios); a query direta é só um fallback de
  // resiliência caso a função ainda não exista no banco, e por isso só entra
  // em ação quando a RPC falhar de verdade — nunca quando ela vier vazia.
  const buscarUsuarios = useCallback(
    async (termo, limite = 30, offset = 0) => {
      if (!termo || typeof termo !== "string" || termo.trim().length < 1) return [];
      const t = termo.trim();
      try {
        const supabase = criarClienteSupabase();

        const { data: rpcData, error: rpcError } = await supabase
          .rpc("buscar_usuarios", { p_termo: t, p_limite: limite, p_offset: offset })
          .catch(() => ({ data: null, error: true }));

        if (!rpcError && Array.isArray(rpcData)) {
          return rpcData;
        }

        let query = supabase
          .from("profiles")
          .select("id, nome_exibicao, username, foto_url, cidade, igreja, codigo_amigo")
          .or(`nome_exibicao.ilike.%${t}%,username.ilike.%${t.replace("@", "")}%,cidade.ilike.%${t}%,igreja.ilike.%${t}%`)
          .limit(limite);

        if (usuarioId) {
          query = query.neq("id", usuarioId);
        }

        const { data: rawData } = await query.catch(() => ({ data: null }));
        return Array.isArray(rawData) ? rawData : [];
      } catch (e) {
        console.error("Erro na busca de usuários:", e);
        return [];
      }
    },
    [usuarioId]
  );

  // Todas as mutações de amizade passam pela função security definer
  // correspondente no banco (única fonte de verdade das regras de negócio:
  // bloqueios, privacidade, duplicidade, aceite cruzado). A tabela `amizades`
  // não expõe policy de insert/update direta, então tentar escrever nela pela
  // API do cliente sempre falha por RLS -- por isso não há mais fallback de
  // escrita direta aqui: se a RPC falhar, o erro real é devolvido, em vez de
  // mascarado como sucesso.
  const enviarPedido = useCallback(
    async (identificador) => {
      if (!usuarioId || !identificador) return { sucesso: false, erro: "Código ou usuário inválido." };
      setErro(null);

      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("enviar_pedido_amizade_v2", {
          p_identificador: String(identificador).trim(),
        });

        if (error) {
          const mensagem = error.message || "Não foi possível enviar a solicitação.";
          setErro(mensagem);
          return { sucesso: false, erro: mensagem };
        }

        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message || "Não foi possível enviar a solicitação." };
      }
    },
    [usuarioId, recarregar]
  );

  const cancelarPedido = useCallback(
    async (amizadeId) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("cancelar_pedido_amizade", { p_amizade_id: amizadeId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível cancelar a solicitação." };
        }
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
        const { error } = await supabase.rpc("responder_pedido_amizade_v2", {
          p_amizade_id: amizadeId,
          p_aceitar: aceitar,
        });

        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível responder à solicitação." };
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
        const { error } = await supabase.rpc("remover_amizade", { p_amigo_id: amigoIdOuAmizadeId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível remover a amizade." };
        }
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
        const { error } = await supabase.rpc("bloquear_usuario", { p_target_id: targetId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível bloquear este usuário." };
        }
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
        const { error } = await supabase.rpc("desbloquear_usuario", { p_target_id: targetId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível desbloquear este usuário." };
        }
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
        const { error } = await supabase.rpc("enviar_torcida", { p_destinatario_id: amigoId });
        if (error) {
          return { sucesso: false, erro: error.message || "Você já torceu hoje!" };
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
    getMutualFriends,
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
