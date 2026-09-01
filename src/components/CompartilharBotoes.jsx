"use client";

import { useState } from "react";

/**
 * Ícones de compartilhamento (WhatsApp, X, copiar) pra versículos e
 * conquistas -- link direto, sem SDK de rede social nenhuma.
 * `compact` deixa os ícones pequenos, pra caber dentro de um card de
 * conquista.
 */
export default function CompartilharBotoes({ texto, compact = false }) {
  const [copiado, setCopiado] = useState(false);

  const origem = typeof window !== "undefined" ? window.location.origin : "https://main.d357ab4gel6chc.amplifyapp.com";
  const textoCompleto = `${texto}\n\n${origem}`;

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(textoCompleto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // clipboard indisponível (ex.: contexto não seguro) -- ignora silenciosamente
    }
  }

  const tamanho = compact ? 26 : 34;
  const fonte = compact ? 12 : 15;

  return (
    <div style={{ display: "flex", gap: compact ? 6 : 8, alignItems: "center" }}>
      <a
        className="action-btn chunky"
        href={`https://wa.me/?text=${encodeURIComponent(textoCompleto)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Compartilhar no WhatsApp"
        style={estiloIcone(tamanho, fonte, "#3FA34D")}
      >
        <span aria-hidden="true">💬</span>
      </a>
      <a
        className="action-btn chunky"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCompleto)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Compartilhar no X"
        style={estiloIcone(tamanho, fonte, "#2D3B33")}
      >
        <span aria-hidden="true" style={{ fontWeight: 800 }}>
          X
        </span>
      </a>
      <button
        type="button"
        className="action-btn chunky"
        onClick={copiarTexto}
        title="Copiar texto"
        style={estiloIcone(tamanho, fonte, "#B98B4E")}
      >
        <span aria-hidden="true">{copiado ? "✓" : "🔗"}</span>
      </button>
    </div>
  );
}

function estiloIcone(tamanho, fonte, cor) {
  return {
    width: tamanho,
    height: tamanho,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderBottom: "2px solid #D8CFB8",
    color: cor,
    fontSize: fonte,
    textDecoration: "none",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  };
}
