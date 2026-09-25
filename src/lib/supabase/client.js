"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Lê as chaves públicas das env vars NEXT_PUBLIC_* (expostas ao browser
 * de propósito -- a anon key é segura de expor, o acesso real é
 * controlado pelas políticas de RLS no banco, ver supabase/schema.sql).
 */

let catchFinallyAplicado = false;

/**
 * O app inteiro usa o padrão `supabase.from(...)/.rpc(...).catch(fn)` --
 * chamando .catch() direto no builder da consulta, antes de dar await.
 * Isso dependia de versões antigas de @supabase/postgrest-js, onde o
 * builder tinha .then/.catch/.finally completos feito uma Promise real.
 * Na versão atualmente instalada (2.x recente, puxada pelo ^2.45.4 do
 * package.json), o builder só implementa .then() -- é "thenable", mas não
 * tem .catch nem .finally -- e cada chamada nesse padrão lança
 * `TypeError: ...catch is not a function`, capturado silenciosamente pelo
 * try/catch externo de cada hook. Isso derrubava amigos, notificações,
 * sementes, comunidades e sugestões ao mesmo tempo, sem nenhum erro visível
 * pro usuário -- só sumia o conteúdo.
 *
 * Em vez de reescrever esse padrão em dezenas de arquivos, aplicamos .catch
 * e .finally UMA VEZ no protótipo compartilhado por todo builder (query ou
 * rpc), implementados em cima do .then() que já funciona -- exatamente como
 * uma Promise real define .catch (`p.catch(fn) === p.then(undefined, fn)`).
 * Só adiciona o que não existir, então vira no-op se uma versão futura da
 * lib já trouxer isso nativamente.
 */
function aplicarPatchCatchFinally(cliente) {
  if (catchFinallyAplicado) return;
  try {
    const builderExemplo = cliente.from("profiles").select("id");
    const proto = Object.getPrototypeOf(builderExemplo);
    if (proto && typeof proto.then === "function") {
      if (typeof proto.catch !== "function") {
        proto.catch = function (onRejected) {
          return this.then(undefined, onRejected);
        };
      }
      if (typeof proto.finally !== "function") {
        proto.finally = function (onFinally) {
          return this.then(
            (valor) => {
              if (typeof onFinally === "function") onFinally();
              return valor;
            },
            (erro) => {
              if (typeof onFinally === "function") onFinally();
              throw erro;
            }
          );
        };
      }
    }
    catchFinallyAplicado = true;
  } catch (e) {
    console.error("Não foi possível aplicar o patch de .catch/.finally no cliente Supabase:", e);
  }
}

export function criarClienteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  const cliente = createBrowserClient(url, anonKey);
  aplicarPatchCatchFinally(cliente);
  return cliente;
}

/**
 * Lê o perfil completo do próprio usuário (inclui e-mail/telefone).
 * Usa a função obter_meu_perfil() quando ela existe no banco -- necessária
 * depois que as colunas privadas de `profiles` deixam de ser legíveis por
 * outros usuários -- e cai para a leitura direta se a função ainda não
 * tiver sido criada. Funciona nos dois cenários.
 */
export async function carregarMeuPerfil(supabase, usuarioId) {
  try {
    const { data, error } = await supabase.rpc("obter_meu_perfil");
    if (!error) {
      const linha = Array.isArray(data) ? data[0] : data;
      if (linha) return linha;
    }
  } catch (e) {
    // segue para o plano B
  }
  const { data } = await supabase.from("profiles").select("*").eq("id", usuarioId).maybeSingle();
  return data || null;
}
