"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Estado da "ofensiva" (streak de assiduidade, estilo Duolingo) do usuário
 * logado. O cálculo em si mora no banco (função registrar_devocional_hoje,
 * ver supabase/schema.sql) -- este hook só lê e expõe o estado, e oferece
 * `registrarHoje()` pra chamar depois que o usuário completa o devocional.
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
    const supabase = criarClienteSupabase();
    const { data } = await supabase
      .from("streaks")
      .select("ofensiva_atual, maior_ofensiva, ultimo_dia")
      .eq("user_id", usuarioId)
      .maybeSingle();
    setOfensiva(data ?? { ofensiva_atual: 0, maior_ofensiva: 0, ultimo_dia: null });
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const registrarHoje = useCallback(
    async ({ temaOracao, referenciaVersiculo, reflexao }) => {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("registrar_devocional_hoje", {
        p_tema_oracao: temaOracao ?? null,
        p_referencia_versiculo: referenciaVersiculo ?? null,
        p_reflexao: reflexao ?? null,
      });
      if (!error && data) {
        setOfensiva(data);
      }
      return { data, error };
    },
    []
  );

  const jaFezHoje = (() => {
    if (!ofensiva?.ultimo_dia) return false;
    const hoje = new Date().toISOString().slice(0, 10);
    return ofensiva.ultimo_dia === hoje;
  })();

  return { ofensiva, carregando, registrarHoje, jaFezHoje, recarregar };
}
