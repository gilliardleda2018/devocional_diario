"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Progresso de curto prazo (últimos 7 dias), usado pelo card de Missões.
 * Vem da função RPC obter_progresso_semana() (ver supabase/schema.sql) --
 * separado de useEstatisticas porque aquele hook traz números vitalícios
 * (total de sempre), enquanto missões são metas recorrentes que resetam.
 */
export function useProgressoSemana(usuarioId, gatilhoRecarga) {
  const [progresso, setProgresso] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setProgresso(null);
      setCarregando(false);
      return;
    }
    const supabase = criarClienteSupabase();
    const { data, error } = await supabase.rpc("obter_progresso_semana");
    if (!error && data?.length) {
      setProgresso(data[0]);
    }
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarregar, gatilhoRecarga]);

  return { progresso, carregando };
}
