"use client";

import { useState, useEffect } from "react";
import { copiarTextoSeguro } from "@/src/lib/util/copiarSeguro";

export default function CompartilharBotoes({ texto, compact = false }) {
  const [copiado, setCopiado] = useState(false);
  const [copiadoInstagram, setCopiadoInstagram] = useState(false);
  const [origem, setOrigem] = useState("https://main.d357ab4gel6chc.amplifyapp.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigem(window.location.origin);
    }
  }, []);

  const textoCompleto = `${texto}\n\n${origem}`;

  async function copiarTexto() {
    const ok = await copiarTextoSeguro(textoCompleto);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  }

  async function compartilharInstagram() {
    const ok = await copiarTextoSeguro(textoCompleto);
    if (ok) {
      setCopiadoInstagram(true);
      setTimeout(() => setCopiadoInstagram(false), 2600);
    }
    if (typeof window !== "undefined") {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
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
