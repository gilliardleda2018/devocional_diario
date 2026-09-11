"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

export const TIPOS_COMUNIDADE = [
  { id: "CHURCH", label: "Igreja", icone: "⛪" },
  { id: "BIBLE_STUDY", label: "Estudo Bíblico", icone: "📖" },
  { id: "PRAYER", label: "Oração", icone: "🙏" },
  { id: "FAMILY", label: "Família", icone: "🏠" },
  { id: "YOUTH", label: "Jovens", icone: "🔥" },
  { id: "READING_PLAN", label: "Plano de Leitura", icone: "📅" },
  { id: "GENERAL", label: "Geral", icone: "🕊️" },
];

export function rotuloTipoComunidade(tipoId) {
  return TIPOS_COMUNIDADE.find((t) => t.id === tipoId) || TIPOS_COMUNIDADE[TIPOS_COMUNIDADE.length - 1];
}

/**
 * Comunidades: grupos temáticos (igreja, estudo bíblico, família...) com
 * mural de oração próprio. Toda escrita passa por RPC security definer
 * (criar_comunidade, entrar_comunidade, sair_comunidade) -- communities e
 * community_members não expõem insert/update direto ao cliente.
 */
export function useComunidades(usuarioId) {
  const [minhasComunidades, setMinhasComunidades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setMinhasComunidades([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data } = await supabase.rpc("obter_minhas_comunidades").catch(() => ({ data: null }));
      setMinhasComunidades(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao carregar minhas comunidades:", e);
      setMinhasComunidades([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const buscarPublicas = useCallback(async (termo = "", limite = 20, offset = 0) => {
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_comunidades_publicas", {
        p_termo: termo,
        p_limite: limite,
        p_offset: offset,
      });
      if (error) return [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Erro ao buscar comunidades públicas:", e);
      return [];
    }
  }, []);

  const obterMembros = useCallback(async (communityId) => {
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_membros_comunidade", { p_community_id: communityId });
      if (error) return { sucesso: false, erro: error.message, membros: [] };
      return { sucesso: true, membros: Array.isArray(data) ? data : [] };
    } catch (e) {
      return { sucesso: false, erro: e.message, membros: [] };
    }
  }, []);

  const criarComunidade = useCallback(
    async ({ nome, descricao, tipo, visibilidade, imagemUrl }) => {
      try {
        const supabase = criarClienteSupabase();
        const { data, error } = await supabase.rpc("criar_comunidade", {
          p_nome: nome,
          p_descricao: descricao || null,
          p_tipo: tipo || "GENERAL",
          p_visibilidade: visibilidade || "PUBLIC",
          p_imagem_url: imagemUrl || null,
        });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível criar a comunidade." };
        }
        await recarregar();
        return { sucesso: true, comunidade: data };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const entrarComunidade = useCallback(
    async (communityId) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("entrar_comunidade", { p_community_id: communityId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível entrar nessa comunidade." };
        }
        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const sairComunidade = useCallback(
    async (communityId) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("sair_comunidade", { p_community_id: communityId });
        if (error) {
          return { sucesso: false, erro: error.message || "Não foi possível sair da comunidade." };
        }
        await recarregar();
        return { sucesso: true };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  return {
    minhasComunidades,
    carregando,
    recarregar,
    buscarPublicas,
    obterMembros,
    criarComunidade,
    entrarComunidade,
    sairComunidade,
  };
}
