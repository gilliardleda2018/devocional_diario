import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/src/lib/supabase/server";

/**
 * Rota que o Supabase chama de volta depois do login (Google OAuth ou
 * clique no magic link). Troca o `code` da URL pela sessão real e
 * redireciona pro app.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const proximo = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = criarClienteSupabaseServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${proximo}`);
}
