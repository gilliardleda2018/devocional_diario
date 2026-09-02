"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Lista de amigos, pedidos pendentes e o próprio código de amigo, mais as
 * ações (enviar pedido, aceitar/recusar, desfazer amizade, torcer). Toda a
 * lógica de quem pode ver o quê mora nas funções RPC (ver supabase/schema.sql,
 * seção "AMIGOS") -- este hook só chama e expõe o estado.
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
    const supabase = criarClienteSupabase();
    const [respostaAmigos, respostaPedidos, respostaCodigo] = await Promise.all([
      supabase.rpc("obter_meus_amigos"),
      supabase.rpc("obter_pedidos_pendentes"),
      supabase.rpc("obter_meu_codigo_amigo"),
    ]);
    if (!respostaAmigos.error) setAmigos(respostaAmigos.data ?? []);
    if (!respostaPedidos.error) setPedidos(respostaPedidos.data ?? []);
    if (!respostaCodigo.error) setMeuCodigo(respostaCodigo.data ?? null);
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const enviarPedido = useCallback(
    async (codigo) => {
      setErro(null);
      const supabase = criarClienteSupabase();
      const { error } = await supabase.rpc("enviar_pedido_amizade", { p_codigo_amigo: codigo });
      if (error) {
        setErro(error.message);
        return { sucesso: false, erro: error.message };
      }
      await recarregar();
      return { sucesso: true };
    },
    [recarregar]
  );

  const responderPedido = useCallback(
    async (amizadeId, aceitar) => {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.rpc("responder_pedido_amizade", {
        p_amizade_id: amizadeId,
        p_aceitar: aceitar,
      });
      if (!error) await recarregar();
      return { sucesso: !error, erro: error?.message };
    },
    [recarregar]
  );

  const removerAmigo = useCallback(
    async (amizadeId) => {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.from("amizades").delete().eq("id", amizadeId);
      if (!error) await recarregar();
      return { sucesso: !error, erro: error?.message };
    },
    [recarregar]
  );

  const torcer = useCallback(async (amigoId) => {
    const supabase = criarClienteSupabase();
    const { error } = await supabase.rpc("enviar_torcida", { p_destinatario_id: amigoId });
    return { sucesso: !error, erro: error?.message };
  }, []);

  return { amigos, pedidos, meuCodigo, carregando, erro, recarregar, enviarPedido, responderPedido, removerAmigo, torcer };
}
