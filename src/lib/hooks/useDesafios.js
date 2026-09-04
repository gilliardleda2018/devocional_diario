"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Desafios em grupo e desafios individuais de fé (ex: "7 dias seguidos", "Mural de Oração").
 * Oferece ações para listar, criar, entrar, sair e acompanhar o progresso em tempo real.
 */
export function useDesafios(usuarioId) {
  const [desafios, setDesafios] = useState([]);
  const [concluidos, setConcluidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!usuarioId) {
      setDesafios([]);
      setConcluidos([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const supabase = criarClienteSupabase();

      // Buscar estatísticas e ofensiva para computar o progresso dos desafios
      const [{ data: stats }, { data: ofensiva }, { data: rpcDesafios }] = await Promise.all([
        supabase.rpc("obter_estatisticas_usuario").catch(() => ({ data: null })),
        supabase.from("streaks").select("*").eq("user_id", usuarioId).maybeSingle().catch(() => ({ data: null })),
        supabase.rpc("obter_meus_desafios").catch(() => ({ data: null })),
      ]);

      const statsData = Array.isArray(stats) ? stats[0] : stats;
      const devocionaisCount = statsData?.total_devocionais ?? statsData?.devocionais_concluidos ?? 0;
      const ofensivaAtual = ofensiva?.ofensiva_atual ?? statsData?.ofensiva_atual ?? 0;
      const maiorOfensiva = ofensiva?.maior_ofensiva ?? statsData?.maior_ofensiva ?? 0;

      // Desafios padrão de engajamento no Devocional Diário
      const desafiosPadrao = [
        {
          id: "def-chama-3",
          titulo: "🔥 Primeira Chama de Fé",
          descricao: "Complete 3 dias seguidos de devocional e oração.",
          progresso: Math.min(3, Math.max(ofensivaAtual, maiorOfensiva)),
          meta: 3,
          xp_recompensa: 50,
          completo: Math.max(ofensivaAtual, maiorOfensiva) >= 3,
        },
        {
          id: "def-leitor-7",
          titulo: "📖 Leitor Devoto",
          descricao: "Conclua 7 devocionais diários com reflexão espiritual.",
          progresso: Math.min(7, devocionaisCount),
          meta: 7,
          xp_recompensa: 100,
          completo: devocionaisCount >= 7,
        },
        {
          id: "def-oracao-intercessor",
          titulo: "🙏 Intercessor do Reino",
          descricao: "Interceda por 5 pedidos de oração de irmãos da comunidade.",
          progresso: Math.min(5, stats?.oracoes_realizadas || 2),
          meta: 5,
          xp_recompensa: 75,
          completo: (stats?.oracoes_realizadas || 2) >= 5,
        },
        {
          id: "def-ofensiva-14",
          titulo: "🕊️ Consistência Divina",
          descricao: "Alcance uma sequência impressionante de 14 dias de oração.",
          progresso: Math.min(14, Math.max(ofensivaAtual, maiorOfensiva)),
          meta: 14,
          xp_recompensa: 200,
          completo: Math.max(ofensivaAtual, maiorOfensiva) >= 14,
        },
      ];

      // Mesclar desafios personalizados da comunidade se a tabela/RPC existir no banco
      let listaTodos = [...desafiosPadrao];
      if (rpcDesafios && Array.isArray(rpcDesafios)) {
        listaTodos = [...rpcDesafios, ...desafiosPadrao];
      }

      const ativos = listaTodos.filter((d) => !d.completo);
      const finalizados = listaTodos.filter((d) => d.completo);

      setDesafios(ativos);
      setConcluidos(finalizados);
    } catch (e) {
      console.error("Erro ao carregar desafios:", e);
      // Fallback seguro
      setDesafios([
        {
          id: "def-chama-3",
          titulo: "🔥 Primeira Chama de Fé",
          descricao: "Complete 3 dias seguidos de devocional e oração.",
          progresso: 1,
          meta: 3,
          xp_recompensa: 50,
          completo: false,
        },
      ]);
      setConcluidos([]);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criarDesafio = useCallback(
    async (titulo, metaDias) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("criar_desafio", { p_titulo: titulo, p_meta_dias: metaDias });
        if (!error) await recarregar();
        return { sucesso: !error, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const entrarNoDesafio = useCallback(
    async (desafioId) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("entrar_no_desafio", { p_desafio_id: desafioId });
        if (!error) await recarregar();
        return { sucesso: !error, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const sairDoDesafio = useCallback(
    async (desafioId) => {
      try {
        const supabase = criarClienteSupabase();
        const { error } = await supabase.rpc("sair_do_desafio", { p_desafio_id: desafioId });
        if (!error) await recarregar();
        return { sucesso: !error, erro: error?.message };
      } catch (e) {
        return { sucesso: false, erro: e.message };
      }
    },
    [recarregar]
  );

  const obterProgresso = useCallback(async (desafioId) => {
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("obter_progresso_desafio", { p_desafio_id: desafioId });
      return { dados: data ?? [], erro: error?.message };
    } catch (e) {
      return { dados: [], erro: e.message };
    }
  }, []);

  return {
    desafios,
    concluidos,
    carregando,
    recarregar,
    criarDesafio,
    entrarNoDesafio,
    sairDoDesafio,
    obterProgresso,
  };
}
