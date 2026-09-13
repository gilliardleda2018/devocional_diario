"use client";

import { useEffect } from "react";

const CHAVE_RELOAD = "devocional_chunk_reload_at";

function pareceErroDeChunk(mensagem) {
  if (!mensagem) return false;
  return /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
    mensagem
  );
}

/**
 * Depois de um deploy, uma aba que já tinha a página carregada (ou que
 * recebeu um HTML em cache do CDN) pode tentar buscar um chunk JS com hash
 * de um build anterior -- que não existe mais. Isso derruba o app inteiro
 * com "Application error: a client-side exception". Em vez de deixar o
 * usuário preso numa tela quebrada, detectamos esse erro específico e
 * recarregamos a página uma única vez (o guard por tempo evita loop caso o
 * problema persista).
 */
export default function RecuperadorChunk() {
  useEffect(() => {
    function recarregarUmaVez() {
      const ultimoReload = Number(sessionStorage.getItem(CHAVE_RELOAD) || 0);
      const agora = Date.now();
      if (agora - ultimoReload < 10_000) return;
      sessionStorage.setItem(CHAVE_RELOAD, String(agora));
      window.location.reload();
    }

    function aoErro(evento) {
      if (pareceErroDeChunk(evento?.message) || pareceErroDeChunk(evento?.error?.message)) {
        recarregarUmaVez();
      }
    }

    function aoRejeicao(evento) {
      const mensagem = evento?.reason?.message || String(evento?.reason || "");
      if (pareceErroDeChunk(mensagem)) {
        recarregarUmaVez();
      }
    }

    window.addEventListener("error", aoErro);
    window.addEventListener("unhandledrejection", aoRejeicao);
    return () => {
      window.removeEventListener("error", aoErro);
      window.removeEventListener("unhandledrejection", aoRejeicao);
    };
  }, []);

  return null;
}
