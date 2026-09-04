"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook do Faith Graph para recomendações explicáveis de conexões,
 * gestão de privacidade (Privacy by Design), bloqueios (Block User) e follows.
 */
export function useFaithGraph(usuarioId) {
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [privacidade, setPrivacidade] = useState({
    discoverable: true,
    allow_friend_requests: true,
    allow_followers: true,
    show_church: true,
    show_city: true,
    show_activity: true,
    show_prayer_activity: true,
    allow_recommendations: true,
  });
  const [bloqueados, setBloqueados] = useState([]);
  const [carregandoRecomendacoes, setCarregandoRecomendacoes] = useState(true);
  const [carregandoPrivacidade, setCarregandoPrivacidade] = useState(true);

  const carregarRecomendacoes = useCallback(async () => {
    if (!usuarioId) {
      setRecomendacoes([]);
      setCarregandoRecomendacoes(false);
      return;
    }
    setCarregandoRecomendacoes(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_recomendacoes_pessoas", { p_limite: 15 });
      if (!error && data) {
        setRecomendacoes(data);
      } else {
        setRecomendacoes([]);
      }
    } catch (e) {
      console.error("Erro ao carregar recomendações:", e);
      setRecomendacoes([]);
    } finally {
      setCarregandoRecomendacoes(false);
    }
  }, [usuarioId]);

  const carregarPrivacidade = useCallback(async () => {
    if (!usuarioId) return;
    setCarregandoPrivacidade(true);
    try {
      const supabase = criarClienteSupabase();
      const { data } = await supabase
        .from("user_privacy_settings")
        .select("*")
        .eq("user_id", usuarioId)
        .maybeSingle();

      if (data) {
        setPrivacidade(data);
      }
    } catch (e) {
      console.error("Erro ao carregar privacidade:", e);
    } finally {
      setCarregandoPrivacidade(false);
    }
  }, [usuarioId]);

  const carregarBloqueados = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase
        .from("user_blocks")
        .select(`
          id,
          blocked_id,
          created_at,
          profiles:blocked_id (id, nome_exibicao, foto_url)
        `)
        .eq("blocker_id", usuarioId);

      if (!error && data) {
        setBloqueados(data);
      }
    } catch (e) {
      console.error("Erro ao carregar bloqueados:", e);
    }
  }, [usuarioId]);

  useEffect(() => {
    carregarRecomendacoes();
    carregarPrivacidade();
    carregarBloqueados();
  }, [carregarRecomendacoes, carregarPrivacidade, carregarBloqueados]);

  const salvarPrivacidade = useCallback(
    async (novasConfiguracoes) => {
      if (!usuarioId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase
          .from("user_privacy_settings")
          .upsert({ user_id: usuarioId, ...novasConfiguracoes, atualizado_em: new Date().toISOString() });

        if (!error) {
          setPrivacidade((antigo) => ({ ...antigo, ...novasConfiguracoes }));
          return { sucesso: true };
        }
        return { sucesso: false, erro: error.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId]
  );

  const bloquearUsuario = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("bloquear_usuario", { p_target_id: targetId });
        if (!error) {
          setRecomendacoes((prev) => prev.filter((r) => r.candidate_id !== targetId));
          await carregarBloqueados();
          return { sucesso: true };
        }
        return { sucesso: false, erro: error.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, carregarBloqueados]
  );

  const desbloquearUsuario = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("desbloquear_usuario", { p_target_id: targetId });
        if (!error) {
          await carregarBloqueados();
          await carregarRecomendacoes();
          return { sucesso: true };
        }
        return { sucesso: false, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId, carregarBloqueados, carregarRecomendacoes]
  );

  const seguirUsuario = useCallback(
    async (targetId) => {
      if (!usuarioId || !targetId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("seguir_usuario", { p_target_id: targetId });
        return { sucesso: !error, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId]
  );

  const enviarPedidoAmizade = useCallback(
    async (destinatarioId) => {
      if (!usuarioId || !destinatarioId) return { sucesso: false };
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.from("amizades").insert({
          solicitante_id: usuarioId,
          destinatario_id: destinatarioId,
          status: "pendente",
        });
        return { sucesso: !error, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [usuarioId]
  );

  const registrarEventoRecomendacao = useCallback(
    async (candidateId, eventType, reasonCodes = [], score = 0) => {
      if (!usuarioId || !candidateId) return;
      try {
        const supabase = criarClienteSupabase();
        await supabase.from("recommendation_events").insert({
          user_id: usuarioId,
          candidate_id: candidateId,
          event_type: eventType,
          reason_codes: reasonCodes,
          score: score,
        });
      } catch (e) {
        // Silencioso
      }
    },
    [usuarioId]
  );

  return {
    recomendacoes,
    privacidade,
    configPrivacidade: privacidade,
    bloqueados,
    carregandoRecomendacoes,
    carregandoPrivacidade,
    carregando: carregandoRecomendacoes || carregandoPrivacidade,
    carregarRecomendacoes,
    salvarPrivacidade,
    bloquearUsuario,
    desbloquearUsuario,
    seguirUsuario,
    seguir: seguirUsuario,
    enviarPedidoAmizade,
    enviarPedido: enviarPedidoAmizade,
    registrarEventoRecomendacao,
    registrarEvento: registrarEventoRecomendacao,
  };
}
