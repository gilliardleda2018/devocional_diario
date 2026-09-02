"use client";

import { useState } from "react";

/**
 * Ícones de compartilhamento (WhatsApp, X, Instagram, copiar) pra
 * versículos, missões e conquistas -- link direto, sem SDK de rede social
 * nenhuma. `compact` deixa os ícones pequenos, pra caber dentro de um card
 * de conquista.
 *
 * Instagram não tem um link web que já abra com o texto preenchido (só a
 * Meta Graph API faz isso, e exige app aprovado) -- então o botão copia o
 * texto pra área de transferência e abre o Instagram, com um aviso pra
 * colar nos Stories ou na legenda.
 */
export default function CompartilharBotoes({ texto, compact = false }) {
  const [copiado, setCopiado] = useState(false);
  const [copiadoInstagram, setCopiadoInstagram] = useState(false);

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

  async function compartilharInstagram() {
    try {
      await navigator.clipboard.writeText(textoCompleto);
      setCopiadoInstagram(true);
      setTimeout(() => setCopiadoInstagram(false), 2600);
    } catch {
      // clipboard indisponível -- ainda assim abrimos o Instagram
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
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
        onClick={compartilharInstagram}
        title="Copiar texto e abrir o Instagram"
        style={{
          ...estiloIcone(tamanho, fonte, "#FFFFFF"),
          background: "linear-gradient(45deg, #F9CE34, #EE2A7B 55%, #6228D7)",
          border: "none",
        }}
      >
        <span aria-hidden="true" style={{ fontWeight: 800, fontSize: fonte - 2 }}>
          {copiadoInstagram ? "✓" : "IG"}
        </span>
      </button>
      <button
        type="button"
        className="action-btn chunky"
        onClick={copiarTexto}
        title="Copiar texto"
        style={estiloIcone(tamanho, fonte, "#B98B4E")}
      >
        <span aria-hidden="true">{copiado ? "✓" : "🔗"}</span>
      </button>
      {copiadoInstagram && (
        <span style={{ fontSize: compact ? 10.5 : 11.5, color: "#7A8A7F", fontWeight: 600 }}>
          Copiado! Cole nos Stories do Instagram.
        </span>
      )}
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
