"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

export const TIER_INFO = {
  BRONZE: { label: "Bronze", icone: "🥉", cor: "#B08D57" },
  PRATA: { label: "Prata", icone: "🥈", cor: "#9AA7B0" },
  OURO: { label: "Ouro", icone: "🥇", cor: "#D9A94C" },
  DIAMANTE: { label: "Diamante", icone: "💎", cor: "#5EC1DE" },
  CHAMA_ETERNA: { label: "Chama Eterna", icone: "🔥", cor: "#E0672A" },
};

function proximoResetSemanal() {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const diasAteSegunda = diaSemana === 0 ? 1 : 8 - diaSemana;
  const proximo = new Date(agora);
  proximo.setDate(agora.getDate() + diasAteSegunda);
  proximo.setHours(0, 0, 0, 0);
  return proximo;
}

/**
 * Liga Semanal: XP só da semana corrente (janela em xp_eventos), com tier
 * por faixa fixa de pontos. Complementa useRankingAmigos (todo o tempo),
 * não substitui.
 */
export function useLigaSemanal(usuarioId) {
  const [liga, setLiga] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setLiga([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data } = await supabase.rpc("obter_liga_semanal", { p_limite: 30 }).catch(() => ({ data: null }));
      setLiga(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao carregar liga semanal:", e);
      setLiga([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { liga, carregando, recarregar, proximoReset: proximoResetSemanal() };
}
