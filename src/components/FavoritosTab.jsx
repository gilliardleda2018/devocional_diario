"use client";

import { useState } from "react";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";

export default function FavoritosTab({ favoritos = [], carregando = false, alternarFavorito }) {
  const [filtro, setFiltro] = useState("");
  const [modalCardVersiculo, setModalCardVersiculo] = useState(null);
  const [estiloTema, setEstiloTema] = useState("dourado");

  const favoritosFiltrados = favoritos.filter(
    (f) =>
      f.referencia?.toLowerCase().includes(filtro.toLowerCase()) ||
      f.texto?.toLowerCase().includes(filtro.toLowerCase())
  );

  const temas = {
    dourado: {
      bg: "linear-gradient(135deg, #7A5726 0%, #B98B4E 50%, #4A3415 100%)",
      text: "#FFFDF7",
      border: "1px solid rgba(255,255,255,0.2)",
      label: "✨ Dourado celestial",
    },
    oceano: {
      bg: "linear-gradient(135deg, #1E3A8A 0%, #1E293B 100%)",
      text: "#F0F9FF",
      border: "1px solid rgba(255,255,255,0.2)",
      label: "🌊 Oceano de paz",
    },
    amanhecer: {
      bg: "linear-gradient(135deg, #BE123C 0%, #4338CA 100%)",
      text: "#FFF1F2",
      border: "1px solid rgba(255,255,255,0.2)",
      label: "🌅 Amanhecer da graça",
    },
    noite: {
      bg: "linear-gradient(135deg, #0F172A 0%, #064E3B 100%)",
      text: "#ECFDF5",
      border: "1px solid rgba(255,255,255,0.2)",
      label: "🌌 Noite de oração",
    },
  };

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
      <div style={styles.headerCard}>
        <div style={styles.headerTopo}>
          <span style={styles.headerIcone}>⭐</span>
          <div>
            <h2 style={styles.titulo}>Meus Versículos Favoritos</h2>
            <p style={styles.subtitulo}>
              Guarde os textos que tocaram seu coração e crie cards inspiradores para compartilhar.
            </p>
          </div>
        </div>

        {/* Barra de Busca com ícone embutido */}
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcone}>🔍</span>
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por livro, capítulo ou palavra..."
            style={styles.searchInput}
          />
          {filtro && (
            <button onClick={() => setFiltro("")} style={styles.clearBtn} type="button">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Favoritos */}
      {carregando ? (
        <div style={styles.carregandoState}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <p>Carregando versículos salvos...</p>
        </div>
      ) : favoritosFiltrados.length === 0 ? (
        <div style={styles.vazioState}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>📖</span>
          <h3 style={styles.vazioTitulo}>
            {filtro ? "Nenhum versículo encontrado" : "Nenhum favorito salvo ainda"}
          </h3>
          <p style={styles.vazioTexto}>
            {filtro
              ? "Tente buscar com outros termos."
              : "Toque na estrela ⭐ ao ler a Bíblia ou durante o Devocional para guardar seus versículos marcantes aqui!"}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {favoritosFiltrados.map((item) => (
            <div key={item.referencia} style={styles.verseCard}>
              <div>
                <div style={styles.cardHeaderRow}>
                  <span style={styles.refBadge}>📜 {item.referencia}</span>
                  <button
                    onClick={() => alternarFavorito(item.referencia, item.texto)}
                    style={styles.starBtn}
                    title="Remover dos favoritos"
                    type="button"
                  >
                    ⭐
                  </button>
                </div>
                <blockquote style={styles.verseQuote}>
                  &ldquo;{item.texto}&rdquo;
                </blockquote>
              </div>

              {/* Rodapé do Card com Ações */}
              <div style={styles.cardFooter}>
                <button
                  onClick={() => setModalCardVersiculo(item)}
                  style={styles.cardVisualBtn}
                  className="action-btn chunky"
                  type="button"
                >
                  🖼️ Criar Card Visual
                </button>

                <CompartilharBotoes
                  texto={`"${item.texto}" — ${item.referencia}`}
                  compact={true}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Gerador de Card Visual */}
      {modalCardVersiculo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitulo}>🎨 Criar Card para Redes Sociais</h3>
              <button
                onClick={() => setModalCardVersiculo(null)}
                style={styles.closeBtn}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Seleção de Tema */}
            <div>
              <label style={styles.labelSecao}>Escolha o Tema Visual:</label>
              <div style={styles.temasGrid}>
                {Object.entries(temas).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setEstiloTema(key)}
                    style={{
                      ...styles.temaBtn,
                      ...(estiloTema === key ? styles.temaBtnAtivo : {}),
                    }}
                    type="button"
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do Card */}
            <div
              style={{
                ...styles.cardPreview,
                background: temas[estiloTema].bg,
                color: temas[estiloTema].text,
                border: temas[estiloTema].border,
              }}
            >
              <p style={styles.previewQuote}>&ldquo;{modalCardVersiculo.texto}&rdquo;</p>
              <div style={styles.previewRodape}>
                <span style={styles.previewRef}>{modalCardVersiculo.referencia}</span>
                <span style={styles.previewSub}>Devocional Diário • Almeida 1911</span>
              </div>
            </div>

            {/* Botões do Modal */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <CompartilharBotoes
                texto={`"${modalCardVersiculo.texto}" — ${modalCardVersiculo.referencia}`}
              />
              <button
                onClick={() => setModalCardVersiculo(null)}
                style={styles.fecharModalBtn}
                type="button"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    textAlign: "left",
  },
  headerCard: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "20px 18px",
    boxShadow: "0 4px 16px rgba(80,70,40,0.05)",
  },
  headerTopo: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerIcone: {
    fontSize: 28,
    flexShrink: 0,
  },
  titulo: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 600,
    fontSize: 20,
    color: "#33422F",
    margin: "0 0 4px",
  },
  subtitulo: {
    fontSize: 13,
    color: "#6B7A6E",
    margin: 0,
    lineHeight: 1.4,
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
  },
  searchIcone: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 15,
    color: "#8A9184",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 40px 11px 38px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    fontSize: 13.5,
    color: "#33422F",
    outline: "none",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "#EFEAD9",
    border: "none",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7A6E",
    cursor: "pointer",
  },
  carregandoState: {
    textAlign: "center",
    padding: "40px 0",
    color: "#8A9184",
    fontSize: 13.5,
  },
  vazioState: {
    background: "#FBF9F3",
    border: "1px border-dashed #E7E0D0",
    borderRadius: 18,
    padding: "30px 20px",
    textAlign: "center",
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 6px",
  },
  vazioTexto: {
    fontSize: 13,
    color: "#7A8A7F",
    margin: 0,
    lineHeight: 1.4,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  verseCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "16px 18px",
    boxShadow: "0 4px 14px rgba(80,70,40,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 14,
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  refBadge: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#8A6224",
    background: "#F1E2C4",
    padding: "4px 10px",
    borderRadius: 999,
    display: "inline-block",
  },
  starBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: 2,
  },
  verseQuote: {
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 15.5,
    lineHeight: 1.6,
    color: "#2D3B33",
    margin: 0,
    borderLeft: "3px solid #D9A94C",
    paddingLeft: 12,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 12,
    borderTop: "1px solid #F1EEE3",
    flexWrap: "wrap",
  },
  cardVisualBtn: {
    background: "linear-gradient(180deg, #F5E6C8 0%, #E8D3A7 100%)",
    color: "#6B4C1B",
    border: "none",
    borderBottom: "2px solid #C8AA70",
    borderRadius: 10,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    background: "#FFFFFF",
    borderRadius: 24,
    maxWidth: 440,
    width: "100%",
    padding: 22,
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #E7E0D0",
    paddingBottom: 10,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: 700,
    color: "#33422F",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    color: "#8A9184",
    cursor: "pointer",
    padding: 4,
  },
  labelSecao: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#8A9184",
    marginBottom: 8,
    display: "block",
  },
  temasGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  },
  temaBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    fontSize: 12,
    fontWeight: 600,
    color: "#33422F",
    cursor: "pointer",
    textAlign: "left",
  },
  temaBtnAtivo: {
    borderColor: "#B98B4E",
    background: "#F1E2C4",
    fontWeight: 700,
    color: "#6B4C1B",
  },
  cardPreview: {
    borderRadius: 18,
    padding: "24px 20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    minHeight: 180,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    textAlign: "center",
    boxSizing: "border-box",
  },
  previewQuote: {
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 16,
    lineHeight: 1.55,
    margin: "0 0 16px",
  },
  previewRodape: {
    borderTop: "1px solid rgba(255,255,255,0.25)",
    paddingTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  previewRef: {
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  previewSub: {
    fontSize: 10,
    opacity: 0.8,
  },
  fecharModalBtn: {
    width: "100%",
    padding: "10px 0",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    color: "#33422F",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
};
