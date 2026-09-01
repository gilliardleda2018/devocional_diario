"use client";

import { useState } from "react";
import { BOOKS_PT } from "@/src/lib/biblia/getBibleApi";
import { MOODS } from "@/src/lib/devocional/versiculos";
import { GUIAS_LEITURA } from "@/src/lib/devocional/guiasLeitura";

/**
 * "Sistema de recomendação" de leitura: a pessoa escolhe o que está
 * sentindo/enfrentando (mesmos temas do devocional guiado) e recebe um
 * guia com 2-3 livros/capítulos por onde começar, com o motivo da
 * indicação -- incentivo pra ler a Bíblia completa, não só o versículo
 * avulso do dia.
 */
export default function GuiaLeituraBiblia({ onAbrirLivro }) {
  const [aberto, setAberto] = useState(false);
  const [moodId, setMoodId] = useState(null);

  const guia = moodId ? GUIAS_LEITURA[moodId] : null;

  if (!aberto) {
    return (
      <button className="action-btn chunky" style={estilos.cartaoConvite} onClick={() => setAberto(true)}>
        <span style={{ fontSize: 22 }}>🧭</span>
        <span style={estilos.convideTextos}>
          <span style={estilos.convideTitulo}>Não sabe por onde começar?</span>
          <span style={estilos.convideSubtitulo}>Monte um guia de leitura pro que você está enfrentando agora.</span>
        </span>
      </button>
    );
  }

  return (
    <div style={estilos.card}>
      {!guia ? (
        <>
          <div style={estilos.cabecalho}>
            <span style={estilos.tituloCard}>O que você está enfrentando agora?</span>
            <button className="action-btn" style={estilos.fecharBtn} onClick={() => setAberto(false)} title="Fechar">
              ✕
            </button>
          </div>
          <p style={estilos.subtitulo}>Escolha um tema e eu sugiro por quais livros da Bíblia começar.</p>
          <div style={estilos.grid}>
            {MOODS.map((m) => (
              <button key={m.id} className="mood-btn" style={estilos.moodBtn} onClick={() => setMoodId(m.id)}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <span style={estilos.moodLabel}>{m.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={estilos.cabecalho}>
            <button className="action-btn" style={estilos.voltarBtn} onClick={() => setMoodId(null)}>
              ← Trocar tema
            </button>
            <button className="action-btn" style={estilos.fecharBtn} onClick={() => setAberto(false)} title="Fechar">
              ✕
            </button>
          </div>
          <p style={estilos.tituloGuia}>{guia.titulo}</p>
          <p style={estilos.subtitulo}>{guia.descricao}</p>
          <div style={estilos.listaLivros}>
            {guia.livros.map((l) => {
              const numero = BOOKS_PT.indexOf(l.nome) + 1;
              return (
                <div key={`${l.nome}-${l.capitulo}`} style={estilos.livroCard}>
                  <div style={estilos.livroTextos}>
                    <p style={estilos.livroTitulo}>
                      {l.nome} {l.capitulo}
                    </p>
                    <p style={estilos.livroMotivo}>{l.motivo}</p>
                  </div>
                  <button
                    className="action-btn chunky"
                    style={estilos.lerBtn}
                    onClick={() => numero > 0 && onAbrirLivro(numero, l.capitulo)}
                    disabled={numero <= 0}
                  >
                    Ler →
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const estilos = {
  cartaoConvite: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderBottom: "3px solid #D8CFB8",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
    marginBottom: 18,
  },
  convideTextos: { display: "flex", flexDirection: "column", gap: 2 },
  convideTitulo: { fontSize: 14, fontWeight: 700, color: "#33422F" },
  convideSubtitulo: { fontSize: 12.5, color: "#7A8A7F" },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "18px 18px 20px",
    marginBottom: 18,
  },
  cabecalho: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  tituloCard: { fontSize: 15, fontWeight: 700, color: "#33422F" },
  tituloGuia: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 19,
    color: "#33422F",
    margin: "0 0 4px",
  },
  subtitulo: { fontSize: 13, color: "#7A8A7F", margin: "0 0 14px" },
  fecharBtn: {
    background: "transparent",
    border: "none",
    color: "#9AA79C",
    fontSize: 15,
    cursor: "pointer",
    padding: "2px 4px",
  },
  voltarBtn: {
    background: "transparent",
    border: "none",
    color: "#B98B4E",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  moodBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: "12px 4px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    borderBottom: "3px solid #D8CFB8",
    background: "#FFFFFF",
    cursor: "pointer",
  },
  moodLabel: { fontSize: 10.5, fontWeight: 600, color: "#3C4A3F", textAlign: "center", lineHeight: 1.2 },
  listaLivros: { display: "flex", flexDirection: "column", gap: 10 },
  livroCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px 14px",
  },
  livroTextos: { display: "flex", flexDirection: "column", gap: 2 },
  livroTitulo: { fontSize: 14, fontWeight: 700, color: "#33422F", margin: 0 },
  livroMotivo: { fontSize: 12, color: "#7A8A7F", margin: 0, lineHeight: 1.4 },
  lerBtn: {
    flexShrink: 0,
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 10,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 12.5,
    cursor: "pointer",
  },
};
