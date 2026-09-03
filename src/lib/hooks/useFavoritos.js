"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

const LOCAL_STORAGE_KEY = "devocional_favoritos_v1";

function obterFavoritosLocais() {
  if (typeof window === "undefined") return [];
  try {
    const json = localStorage.getItem(LOCAL_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function salvarFavoritosLocais(lista) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {
    console.error("Erro ao salvar favoritos localmente:", e);
  }
}

export function useFavoritos(usuarioId) {
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);

    if (!usuarioId) {
      setFavoritos(obterFavoritosLocais());
      setCarregando(false);
      return;
    }

    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase
        .from("favoritos")
        .select("*")
        .order("criado_em", { ascending: false });

      if (!error && data) {
        setFavoritos(data);
        salvarFavoritosLocais(data);
      } else {
        setFavoritos(obterFavoritosLocais());
      }
    } catch {
      setFavoritos(obterFavoritosLocais());
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const eFavorito = useCallback(
    (referencia) => {
      if (!referencia) return false;
      return favoritos.some((f) => f.referencia?.toLowerCase() === referencia.toLowerCase());
    },
    [favoritos]
  );

  const alternarFavorito = async (referencia, texto, nota = "") => {
    if (!referencia || !texto) return;

    const existe = eFavorito(referencia);

    if (existe) {
      // Remover
      const novosLocais = favoritos.filter((f) => f.referencia?.toLowerCase() !== referencia.toLowerCase());
      setFavoritos(novosLocais);
      salvarFavoritosLocais(novosLocais);

      if (usuarioId) {
        try {
          const supabase = criarClienteSupabase();
          await supabase
            .from("favoritos")
            .delete()
            .eq("user_id", usuarioId)
            .eq("referencia", referencia);
        } catch (e) {
          console.error("Erro ao remover favorito Supabase:", e);
        }
      }
    } else {
      // Adicionar
      const novoItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        referencia,
        texto,
        nota: nota || null,
        criado_em: new Date().toISOString(),
      };

      const novosLocais = [novoItem, ...favoritos];
      setFavoritos(novosLocais);
      salvarFavoritosLocais(novosLocais);

      if (usuarioId) {
        try {
          const supabase = criarClienteSupabase();
          await supabase.from("favoritos").insert({
            user_id: usuarioId,
            referencia,
            texto,
          });
        } catch (e) {
          console.error("Erro ao inserir favorito Supabase:", e);
        }
      }
    }
  };

  return { favoritos, carregando, eFavorito, alternarFavorito, recarregar };
}
