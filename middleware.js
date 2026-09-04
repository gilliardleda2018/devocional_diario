import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Roda em toda navegação: renova o token de sessão do Supabase antes que
 * expire, e mantém os cookies de auth sincronizados entre client/server.
 * Sem isso, o usuário seria deslogado silenciosamente depois de um tempo.
 */
export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(nome) {
          return request.cookies.get(nome)?.value;
        },
        set(nome, valor, opcoes) {
          response.cookies.set({ name: nome, value: valor, ...opcoes });
        },
        remove(nome, opcoes) {
          response.cookies.set({ name: nome, value: "", ...opcoes });
        },
      },
    });

    await supabase.auth.getUser();
  } catch (e) {
    console.warn("Aviso no middleware de autenticação:", e?.message || e);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
