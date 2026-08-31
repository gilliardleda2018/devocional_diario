"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Lê as chaves públicas das env vars NEXT_PUBLIC_* (expostas ao browser
 * de propósito -- a anon key é segura de expor, o acesso real é
 * controlado pelas políticas de RLS no banco, ver supabase/schema.sql).
 */
export function criarClienteSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
