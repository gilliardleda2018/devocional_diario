"use client";

import { useState, useEffect } from "react";
import { estaSuportadoAudio, falarTexto, pararAudio } from "@/src/lib/audio/narrador";

export default function AudioPlayer({ texto, rotulo = "Ouvir trecho", compacto = false }) {
  const [tocando, setTocando] = useState(false);
  const [velocidade, setVelocidade] = useState(1.0);
  const suportado = estaSuportadoAudio();

  useEffect(() => {
    return () => {
      pararAudio();
    };
  }, []);

  if (!suportado || !texto) return null;

  function alternarAudio() {
    if (tocando) {
      pararAudio();
      setTocando(false);
    } else {
      setTocando(true);
      falarTexto(texto, {
        velocidade,
        aoFim: () => setTocando(false),
        aoErro: () => setTocando(false),
      });
    }
  }

  function alternarVelocidade(e) {
    e.stopPropagation();
    const proximas = [1.0, 1.25, 1.5];
    const idx = proximas.indexOf(velocidade);
    const nova = proximas[(idx + 1) % proximas.length];
    setVelocidade(nova);
    if (tocando) {
      pararAudio();
      setTocando(true);
      falarTexto(texto, {
        velocidade: nova,
        aoFim: () => setTocando(false),
        aoErro: () => setTocando(false),
      });
    }
  }

  if (compacto) {
    return (
      <button
        className="action-btn"
        onClick={alternarAudio}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: tocando ? "rgba(185,139,78,0.2)" : "rgba(185,139,78,0.1)",
          color: "#7A5722",
          border: "1px solid rgba(185,139,78,0.3)",
          borderRadius: 20,
          padding: "4px 10px",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
        title={tocando ? "Pausar narração" : "Ouvir narração"}
      >
        <span>{tocando ? "⏸️" : "🔊"}</span>
        <span>{tocando ? "Ouvindo..." : rotulo}</span>
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justify: "space-between",
        background: tocando ? "#F5EFE3" : "#FAF7F0",
        border: "1px solid #E7E0D0",
        borderRadius: 12,
        padding: "8px 14px",
        margin: "12px 0",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          className="action-btn"
          onClick={alternarAudio}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#B98B4E",
            color: "#FFFFFF",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(185,139,78,0.3)",
          }}
        >
          {tocando ? "⏸" : "▶"}
        </button>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#33422F", display: "block" }}>
            {tocando ? "Narrando áudio..." : rotulo}
          </span>
          <span style={{ fontSize: 11, color: "#7A8A7F" }}>Voz clara em português</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {tocando && (
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <span style={barStyle(0.2)}></span>
            <span style={barStyle(0.4)}></span>
            <span style={barStyle(0.1)}></span>
          </div>
        )}
        <button
          className="action-btn"
          onClick={alternarVelocidade}
          style={{
            background: "#EBE5D8",
            border: "1px solid #D8CEBB",
            borderRadius: 6,
            padding: "3px 7px",
            fontSize: 11,
            fontWeight: 700,
            color: "#5C4A30",
            cursor: "pointer",
          }}
          title="Alterar velocidade da voz"
        >
          {velocidade}x
        </button>
      </div>
    </div>
  );
}

function barStyle(delay) {
  return {
    width: 3,
    height: 12,
    background: "#B98B4E",
    borderRadius: 2,
    animation: `wave 1s ease-in-out infinite alternate ${delay}s`,
  };
}
