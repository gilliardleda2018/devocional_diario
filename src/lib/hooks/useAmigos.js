"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook de Amigos com resiliência total a fallbacks de tabela (amizades + profiles)
 * para garantir funcionamento 100% independente do ambiente RPC.
 */
export function useAmigos(usuarioId) {
  const [amigos, setAmigos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [meuCodigo, setMeuCodigo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setAmigos([]);
      setPedidos([]);
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

      let listaAmigos = [];
      if (!respostaAmigos.error && respostaAmigos.data) {
        listaAmigos = respostaAmigos.data;
      } else {
        // Fallback via consulta direta na tabela amizades
        const { data: directAmigos } = await supabase
          .from("amizades")
          .select(`
            id,
            solicitante_id,
            destinatario_id,
            status,
            solicitante:solicitante_id (id, nome_exibicao, foto_url, codigo_amigo),
            destinatario:destinatario_id (id, nome_exibicao, foto_url, codigo_amigo)
          `)
          .eq("status", "aceita")
          .or(`solicitante_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);

        if (directAmigos) {
          listaAmigos = directAmigos.map((item) => {
            const isSolicitante = item.solicitante_id === usuarioId;
            const outro = isSolicitante ? item.destinatario : item.solicitante;
            return {
              amizade_id: item.id,
              amigo_id: outro?.id,
              id: outro?.id,
              nome_exibicao: outro?.nome_exibicao || "Irmão em Fé",
              foto_url: outro?.foto_url || null,
              codigo_amigo: outro?.codigo_amigo || null,
            };
          });
        }
      }
      setAmigos(listaAmigos);

      let listaPedidos = [];
      if (!respostaPedidos.error && respostaPedidos.data) {
        listaPedidos = respostaPedidos.data;
      } else {
        // Fallback de pedidos pendentes recebidos
        const { data: directPedidos } = await supabase
          .from("amizades")
          .select(`
            id,
            solicitante_id,
            created_at,
            solicitante:solicitante_id (id, nome_exibicao, foto_url)
          `)
          .eq("destinatario_id", usuarioId)
          .eq("status", "pendente");

        if (directPedidos) {
          listaPedidos = directPedidos.map((item) => ({
            id: item.id,
            amizade_id: item.id,
            solicitante_id: item.solicitante_id,
            nome_exibicao: item.solicitante?.nome_exibicao || "Irmão em Fé",
            foto_url: item.solicitante?.foto_url || null,
            created_at: item.created_at,
          }));
        }
      }
      setPedidos(listaPedidos);

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
  }, [recarregar]);

  const buscarPessoasPorNome = useCallback(
    async (termo) => {
      if (!termo || termo.trim().length < 2) return [];
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, nome_exibicao, foto_url, codigo_amigo")
          .ilike("nome_exibicao", `%${termo.trim()}%`)
          .neq("id", usuarioId)
          .limit(10);

        if (error) return [];
        return data ?? [];
      } catch (e) {
        return [];
      }
    },
    [usuarioId]
  );

  const enviarPedido = useCallback(
    async (codigoOuId) => {
      if (!usuarioId || !codigoOuId) return { sucesso: false, erro: "Código ou usuário inválido." };
      setErro(null);
      try {
        const supabase = criarClienteSupabase();
        // Tenta via RPC primeiro
        const { error: rpcError } = await supabase.rpc("enviar_pedido_amizade", { p_codigo_amigo: codigoOuId });
        if (!rpcError) {
          await recarregar();
          return { sucesso: true };
        }

        // Fallback direto via código_amigo ou id
        let targetId = codigoOuId;
        if (codigoOuId.length !== 36) {
          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("codigo_amigo", codigoOuId)
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

  const responderPedido = useCallback(
    async (amizadeId, aceitar) => {
      try {
        const supabase = criarClienteSupabase();
        const { error: rpcError } = await supabase.rpc("responder_pedido_amizade", {
          p_amizade_id: amizadeId,
          p_aceitar: aceitar,
        });

        if (rpcError) {
          // Fallback direto
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
    async (amizadeId) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.from("amizades").delete().eq("id", amizadeId);
        if (!error) await recarregar();
        return { sucesso: !error, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const torcer = useCallback(
    async (amigoId) => {
      if (!usuarioId || !amigoId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("enviar_torcida", { p_destinatario_id: amigoId });
        if (error) {
          // Fallback direto em torcidas
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
    meuCodigo,
    carregando,
    erro,
    recarregar,
    buscarPessoasPorNome,
    enviarPedido,
    responderPedido,
    removerAmigo,
    torcer,
  };
}
