"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Sementes de Fé: a moeda da gamificação (Trilha da Fé). Saldo e inventário
 * de itens (por ora só "congelar_ofensiva") vêm sempre de RPCs -- as tabelas
 * por trás não têm policy de insert/update pro cliente, só select do dono.
 */
export function useSementes(usuarioId) {
  const [saldo, setSaldo] = useState(0);
  const [congelamentos, setCongelamentos] = useState(0);
  const [inventario, setInventario] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setSaldo(0);
      setCongelamentos(0);
      setInventario([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const [{ data: saldoData }, { data: inventarioData }] = await Promise.all([
        supabase.rpc("obter_saldo_sementes").catch(() => ({ data: null })),
        supabase.rpc("obter_meu_inventario").catch(() => ({ data: null })),
      ]);

      setSaldo(typeof saldoData === "number" ? saldoData : 0);

      const lista = Array.isArray(inventarioData) ? inventarioData : [];
      setInventario(lista);
      const item = lista.find((i) => i.item === "congelar_ofensiva");
      setCongelamentos(item?.quantidade || 0);
    } catch (e) {
      console.error("Erro ao carregar sementes:", e);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const comprarCongelamento = useCallback(async () => {
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("comprar_congelamento");
      if (error) {
        return { sucesso: false, erro: error.message || "Não foi possível comprar." };
      }
      const linha = Array.isArray(data) ? data[0] : data;
      setSaldo(linha?.saldo_restante ?? 0);
      setCongelamentos(linha?.quantidade_congelamentos ?? 0);
      return { sucesso: true, saldoRestante: linha?.saldo_restante, quantidade: linha?.quantidade_congelamentos };
    } catch (e) {
      return { sucesso: false, erro: e.message };
    }
  }, []);

  const comprarCosmetico = useCallback(
    async (item) => {
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase.rpc("comprar_cosmetico", { p_item: item });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível comprar." };
        }
        const linha = Array.isArray(data) ? data[0] : data;
        setSaldo(linha?.saldo_restante ?? 0);
        await recarregar();
        return { sucesso: true, saldoRestante: linha?.saldo_restante };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const possuiItem = useCallback(
    (item) => inventario.some((i) => i.item === item && i.quantidade > 0),
    [inventario]
  );

  return { saldo, congelamentos, inventario, possuiItem, carregando, recarregar, comprarCongelamento, comprarCosmetico };
}
