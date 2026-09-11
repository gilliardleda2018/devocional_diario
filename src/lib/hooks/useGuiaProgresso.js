"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

const TOTAL_CAPITULOS_POR_GUIA = 3;

/**
 * Progresso do usuário em cada guia temático de leitura (GUIAS_LEITURA).
 * Cada guia tem 3 capítulos; o backend (avancar_guia_leitura) controla o
 * avanço, credita XP/sementes e concede baú ao completar os 3.
 */
export function useGuiaProgresso(usuarioId) {
  const [progressoPorGuia, setProgressoPorGuia] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [bauRecebido, setBauRecebido] = useState(null);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setProgressoPorGuia({});
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data } = await supabase.rpc("obter_meu_progresso_guias").catch(() => ({ data: null }));
      const mapa = {};
      if (Array.isArray(data)) {
        for (const linha of data) {
          mapa[linha.guia_id] = linha.indice_atual;
        }
      }
      setProgressoPorGuia(mapa);
    } catch (e) {
      console.error("Erro ao carregar progresso dos guias:", e);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const indiceAtual = useCallback((guiaId) => progressoPorGuia[guiaId] || 0, [progressoPorGuia]);

  const avancarGuia = useCallback(
    async (guiaId) => {
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase.rpc("avancar_guia_leitura", { p_guia_id: guiaId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível registrar a leitura." };
        }
        const linha = Array.isArray(data) ? data[0] : data;
        setProgressoPorGuia((prev) => ({ ...prev, [guiaId]: linha?.indice_atual ?? 0 }));
        if (linha?.bau_id) {
          setBauRecebido(linha.bau_id);
        }
        return {
          sucesso: true,
          indiceAtual: linha?.indice_atual,
          concluido: linha?.concluido,
          xpGanho: linha?.xp_ganho,
          sementesGanhas: linha?.sementes_ganhas,
          bauId: linha?.bau_id,
        };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    []
  );

  return {
    progressoPorGuia,
    indiceAtual,
    totalCapitulos: TOTAL_CAPITULOS_POR_GUIA,
    carregando,
    avancarGuia,
    bauRecebido,
    limparBauRecebido: () => setBauRecebido(null),
    recarregar,
  };
}
