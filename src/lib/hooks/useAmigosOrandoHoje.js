"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

export function useAmigosOrandoHoje(usuarioId) {
  const [amigosOrando, setAmigosOrando] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setAmigosOrando([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_amigos_orando_hoje", { p_limite: 12 });
      setAmigosOrando(!error && Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao carregar amigos orando hoje:", e);
      setAmigosOrando([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { amigosOrando, carregando, recarregar };
}
