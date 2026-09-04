"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Lê as chaves públicas das env vars NEXT_PUBLIC_* (expostas ao browser
 * de propósito -- a anon key é segura de expor, o acesso real é
 * controlado pelas políticas de RLS no banco, ver supabase/schema.sql).
 */
export function criarClienteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createBrowserClient(url, anonKey);
}
