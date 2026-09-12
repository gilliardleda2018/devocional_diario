"use client";

import { useState } from "react";
import { useDiario } from "@/src/lib/hooks/useDiario";
import { encontrarMood } from "@/src/lib/devocional/versiculos";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";

function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function DiarioTab({ usuarioId }) {
  const { entradas, carregando } = useDiario(usuarioId);
  const [filtro, setFiltro] = useState("");

  const entradasFiltradas = entradas.filter(
    (e) =>
      e.reflexao?.toLowerCase().includes(filtro.toLowerCase()) ||
      e.referencia_versiculo?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div style={styles.headerTopo}>
          <span style={styles.headerIcone}>📔</span>
          <div>
            <h2 style={styles.titulo}>Meu Diário</h2>
            <p style={styles.subtitulo}>
              Tudo que você já escreveu nos seus devocionais, num só lugar pra reler quando quiser.
            </p>
          </div>
        </div>

        <div style={styles.searchWrapper}>
          <span style={styles.searchIcone}>🔍</span>
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por palavra ou versículo..."
            style={styles.searchInput}
          />
          {filtro && (
            <button onClick={() => setFiltro("")} style={styles.clearBtn} type="button">
              Limpar
            </button>
          )}
        </div>
      </div>

      {carregando ? (
        <div style={styles.carregandoState}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <p>Carregando seu diário...</p>
        </div>
      ) : entradasFiltradas.length === 0 ? (
        <div style={styles.vazioState}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>📔</span>
          <h3 style={styles.vazioTitulo}>
            {filtro ? "Nenhuma reflexão encontrada" : "Seu diário ainda está em branco"}
          </h3>
          <p style={styles.vazioTexto}>
            {filtro
              ? "Tente buscar com outros termos."
              : "Escreva uma reflexão no passo 2 do devocional de hoje e ela aparece aqui pra você reler depois."}
          </p>
        </div>
      ) : (
        <div style={styles.lista}>
          {entradasFiltradas.map((item) => {
            const mood = encontrarMood(item.tema_oracao);
            return (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardHeaderRow}>
                  <span style={styles.dataBadge}>{formatarData(item.data)}</span>
                  {mood && (
                    <span style={styles.moodBadge}>
                      {mood.icon} {mood.label}
                    </span>
                  )}
                </div>
                {item.referencia_versiculo && (
                  <p style={styles.referencia}>📖 {item.referencia_versiculo}</p>
                )}
                <blockquote style={styles.reflexaoTexto}>{item.reflexao}</blockquote>
                <div style={styles.cardFooter}>
                  <CompartilharBotoes texto={item.reflexao} compact />
                </div>
              </div>
            );
          })}
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
    border: "1px dashed #E7E0D0",
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
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "16px 18px",
    boxShadow: "0 4px 14px rgba(80,70,40,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  dataBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8A6224",
    background: "#F1E2C4",
    padding: "4px 10px",
    borderRadius: 999,
  },
  moodBadge: {
    fontSize: 11.5,
    fontWeight: 600,
    color: "#5C6B60",
    background: "#EAF0EC",
    padding: "4px 10px",
    borderRadius: 999,
  },
  referencia: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#B98B4E",
    margin: 0,
  },
  reflexaoTexto: {
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 1.6,
    color: "#2D3B33",
    margin: 0,
    borderLeft: "3px solid #D9A94C",
    paddingLeft: 12,
    whiteSpace: "pre-line",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 8,
    borderTop: "1px solid #F1EEE3",
  },
};
