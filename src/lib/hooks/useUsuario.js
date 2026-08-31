"use client";

import { useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Hook simples pra Client Components saberem quem é o usuário logado
 * (ou null) sem precisar repetir a lógica de onAuthStateChange em cada
 * página. `carregando` fica true só no instante inicial.
 */
export function useUsuario() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const supabase = criarClienteSupabase();

    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user ?? null);
      setCarregando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setUsuario(sessao?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { usuario, carregando };
}
