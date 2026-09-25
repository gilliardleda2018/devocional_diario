"use client";

import { dataLocalISO } from "@/src/lib/util/data";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Estado da "ofensiva" (streak de assiduidade) do usuário.
 * Possui fallbacks para gravação em devotional_logs + tabela streaks
 * garantindo que a sequência do usuário funcione perfeitamente.
 */
export function useOfensiva(usuarioId) {
  const [ofensiva, setOfensiva] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setOfensiva(null);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase
        .from("streaks")
        .select("ofensiva_atual, maior_ofensiva, ultimo_dia")
        .eq("user_id", usuarioId)
        .maybeSingle();

      if (!error && data) {
        setOfensiva(data);
      } else {
        setOfensiva({ ofensiva_atual: 0, maior_ofensiva: 0, ultimo_dia: null });
      }
    } catch (e) {
      console.error("Erro ao carregar ofensiva:", e);
      setOfensiva({ ofensiva_atual: 0, maior_ofensiva: 0, ultimo_dia: null });
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const registrarHoje = useCallback(
    async ({ temaOracao, referenciaVersiculo, reflexao }) => {
      if (!usuarioId) return { data: null, error: "Usuário não autenticado" };
      try {
        const supabase = criarClienteSupabase();
        const hojeIso = dataLocalISO();

        // Tentativa via RPC primeiro
        const { data: rpcData, error: rpcError } = await supabase.rpc("registrar_devocional_hoje", {
          p_tema_oracao: temaOracao ?? null,
          p_referencia_versiculo: referenciaVersiculo ?? null,
          p_reflexao: reflexao ?? null,
        }).catch(() => ({ error: true }));

        if (!rpcError && rpcData) {
          setOfensiva(rpcData);
          return { data: rpcData, error: null };
        }

        // Sem plano B "local": antes o app gravava direto nas tabelas (o que o
        // banco não permite) e mostrava a ofensiva como salva mesmo quando
        // nada tinha sido registrado. Agora o erro é devolvido de verdade.
        return { data: null, error: "Não foi possível registrar o devocional agora." };
      } catch (e) {
        return { data: null, error: e.message };
      }
    },
    [usuarioId, ofensiva]
  );

  const jaFezHoje = (() => {
    if (!ofensiva?.ultimo_dia) return false;
    const hoje = dataLocalISO();
    return ofensiva.ultimo_dia === hoje;
  })();

  return { ofensiva, carregando, registrarHoje, jaFezHoje, recarregar };
}
