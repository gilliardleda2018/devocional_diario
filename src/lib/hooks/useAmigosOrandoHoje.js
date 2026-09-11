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

  const torcerPorAmigo = useCallback(async (amigoId) => {
    // Otimista: marca como torcido na hora, sem esperar a rede -- se der
    // erro (ex. já torceu em outra aba), desfaz e mostra o motivo.
    setAmigosOrando((prev) =>
      prev.map((a) => (a.usuario_id === amigoId ? { ...a, ja_torci: true } : a))
    );
    try {
      const supabase = criarClienteSupabase();
      const { error } = await supabase.rpc("enviar_torcida", { p_destinatario_id: amigoId });
      if (error) {
        setAmigosOrando((prev) =>
          prev.map((a) => (a.usuario_id === amigoId ? { ...a, ja_torci: false } : a))
        );
        return { sucesso: false, erro: error.message };
      }
      return { sucesso: true };
    } catch (e) {
      setAmigosOrando((prev) =>
        prev.map((a) => (a.usuario_id === amigoId ? { ...a, ja_torci: false } : a))
      );
      return { sucesso: false, erro: e.message };
    }
  }, []);

  return { amigosOrando, carregando, recarregar, torcerPorAmigo };
}
