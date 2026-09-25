"use client";

import { criarClienteSupabase } from "@/src/lib/supabase/client";
import { dataLocalISO } from "@/src/lib/util/data";

/**
 * Medição de uso: grava passos do funil na tabela `eventos` via RPC
 * registrar_evento (ver supabase/schema_v7_eventos.sql). Nunca lança erro
 * nem atrasa a tela -- se falhar, simplesmente não registra.
 *
 * O visitante_id é um identificador aleatório guardado no aparelho: liga o
 * que a pessoa fez antes de ter conta ao que ela faz depois de entrar.
 */
const CHAVE_VISITANTE = "devocional_visitante_id";
const CHAVE_APP_ABERTO = "devocional_evento_app_aberto";

function obterVisitanteId() {
  try {
    let id = window.localStorage.getItem(CHAVE_VISITANTE);
    if (!id) {
      id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(CHAVE_VISITANTE, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function registrarEvento(nome, dados = {}) {
  if (typeof window === "undefined") return;
  try {
    const supabase = criarClienteSupabase();
    await supabase.rpc("registrar_evento", {
      p_nome: nome,
      p_visitante_id: obterVisitanteId(),
      p_dados: dados,
    });
  } catch {}
}

/** "app_aberto" no máximo uma vez por dia por aparelho -- base da retenção diária. */
export function registrarAppAbertoHoje() {
  if (typeof window === "undefined") return;
  const hoje = dataLocalISO();
  try {
    if (window.localStorage.getItem(CHAVE_APP_ABERTO) === hoje) return;
    window.localStorage.setItem(CHAVE_APP_ABERTO, hoje);
  } catch {}
  registrarEvento("app_aberto");
}
