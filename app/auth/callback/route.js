import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/src/lib/supabase/server";

/**
 * Rota que o Supabase chama de volta depois do login (Google OAuth ou
 * clique no magic link). Troca o `code` da URL pela sessão real e
 * redireciona pro app.
 *
 * Trata 3 casos que antes falhavam silenciosamente (o usuário via uma
 * página em branco/inválida sem entender por quê):
 *   1. Supabase manda ?error=...&error_description=... direto (ex: link
 *      expirado ou já usado) -- nunca chega a ter `code`.
 *   2. exchangeCodeForSession(code) falha (ex: o link foi aberto num
 *      navegador/dispositivo diferente do que pediu o login, então o
 *      "code verifier" do PKCE não está nos cookies) -- exchangeCodeForSession
 *      NÃO lança exceção nesse caso, só retorna { error }, então é
 *      preciso checar explicitamente.
 *   3. Atrás de um proxy (Render, etc.) `origin` de request.url às vezes
 *      não bate com o domínio público -- usamos x-forwarded-host como
 *      fallback, mesmo padrão recomendado pela própria Supabase.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const erroSupabase = searchParams.get("error_description") || searchParams.get("error");
  const proximo = searchParams.get("next") ?? "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const baseUrl =
    process.env.NODE_ENV === "development" || !forwardedHost ? origin : `https://${forwardedHost}`;

  function redirecionarParaLoginComErro(mensagem) {
    const destino = new URL("/login", baseUrl);
    destino.searchParams.set("erro", mensagem);
    return NextResponse.redirect(destino);
  }

  if (erroSupabase) {
    return redirecionarParaLoginComErro(
      "Não foi possível confirmar o login. O link pode ter expirado ou já ter sido usado -- solicite um novo."
    );
  }

  if (!code) {
    return redirecionarParaLoginComErro("Link de login inválido ou incompleto. Solicite um novo.");
  }

  try {
    const supabase = criarClienteSupabaseServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirecionarParaLoginComErro(
        "Não foi possível confirmar o login (o link pode ter sido aberto em outro navegador). Solicite um novo link."
      );
    }
  } catch {
    return redirecionarParaLoginComErro("Ocorreu um erro ao confirmar o login. Tente novamente.");
  }

  return NextResponse.redirect(`${baseUrl}${proximo}`);
}
