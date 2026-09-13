"use client";

import { useEffect } from "react";

/**
 * Fallback pra qualquer erro não tratado que derrube o app inteiro
 * (substitui a tela genérica "Application error" do Next.js). Também loga
 * o erro real no console -- antes disso não havia esse arquivo, então a
 * causa raiz de uma tela em branco só aparecia se alguém abrisse o
 * DevTools na hora exata do erro.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Erro fatal capturado pelo global-error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6EFE1",
          fontFamily: "'Karla', sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🕊️</div>
          <h1 style={{ fontSize: 18, color: "#33422F", marginBottom: 8, fontWeight: 700 }}>
            Ops, algo não carregou direito
          </h1>
          <p style={{ fontSize: 13.5, color: "#5C6B5F", marginBottom: 20, lineHeight: 1.5 }}>
            Isso costuma acontecer logo depois de uma atualização do app. Recarregue a página pra
            pegar a versão mais recente.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                reset();
              } finally {
                window.location.reload();
              }
            }}
            style={{
              background: "#B98B4E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
