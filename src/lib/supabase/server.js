import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components / Route Handlers.
 * Lê e escreve a sessão via cookies do Next.js -- é o que permite que o
 * login (magic link / Google OAuth) persista entre navegações.
 */
export function criarClienteSupabaseServidor() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createServerClient(url, anonKey, {
      cookies: {
        get(nome) {
          return cookieStore.get(nome)?.value;
        },
        set(nome, valor, opcoes) {
          try {
            cookieStore.set({ name: nome, value: valor, ...opcoes });
          } catch {
            // set() chamado de um Server Component sem middleware --
            // ignorável quando há um middleware.js atualizando a sessão.
          }
        },
        remove(nome, opcoes) {
          try {
            cookieStore.set({ name: nome, value: "", ...opcoes });
          } catch {
            // idem acima.
          }
        },
      },
    }
  );
}
