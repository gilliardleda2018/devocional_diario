"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Histórico de reflexões escritas no devocional diário -- a coluna
 * `reflexao` de devotional_logs é gravada todo dia mas, até aqui, nunca
 * tinha nenhuma tela pra reler depois.
 */
export function useDiario(usuarioId) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setEntradas([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase
        .from("devotional_logs")
        .select("id, data, tema_oracao, referencia_versiculo, reflexao, criado_em")
        .eq("user_id", usuarioId)
        .not("reflexao", "is", null)
        .order("data", { ascending: false });

      setEntradas(!error && Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao carregar o diário:", e);
      setEntradas([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { entradas, carregando, recarregar };
}
