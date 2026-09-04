"use client";

import { useState } from "react";
import AvatarUsuario from "@/src/components/AvatarUsuario";

export default function DescobrirPessoasCard({
  candidato,
  onAdicionar,
  onSeguir,
  onBloquear,
  onAbrirPerfil,
}) {
  const [adicionado, setAdicionado] = useState(false);
  const [seguindo, setSeguindo] = useState(false);
  const [processando, setProcessando] = useState(false);

  async function handleAdicionar() {
    if (processando || adicionado) return;
    setProcessando(true);
    try {
      const res = await onAdicionar(candidato.candidate_id);
      if (res?.sucesso !== false) {
        setAdicionado(true);
      }
    } finally {
      setProcessando(false);
    }
  }

  async function handleSeguir() {
    if (processando || seguindo) return;
    setProcessando(true);
    try {
      const res = await onSeguir(candidato.candidate_id);
      if (res?.sucesso !== false) {
        setSeguindo(true);
      }
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => onAbrirPerfil && onAbrirPerfil(candidato)}
          style={styles.avatarBtn}
          title={`Ver perfil de ${candidato.nome_exibicao}`}
        >
          <AvatarUsuario
            nome={candidato.nome_exibicao}
            fotoUrl={candidato.foto_url}
            tamanho={40}
            moldura={true}
          />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={styles.nome}
            onClick={() => onAbrirPerfil && onAbrirPerfil(candidato)}
          >
            {candidato.nome_exibicao}
          </h4>
          <span style={styles.reasonBadge}>
            ✨ {candidato.reason_text || "Conexão recomendada"}
          </span>
        </div>
      </div>

      <div style={styles.actionsRow}>
        {adicionado ? (
          <span style={styles.sucessoBadge}>✓ Solicitado</span>
        ) : (
          <button
            className="action-btn chunky"
            style={styles.primaryBtn}
            disabled={processando}
            onClick={handleAdicionar}
          >
            ➕ Adicionar
          </button>
        )}

        {seguindo ? (
          <span style={styles.seguindoBadge}>✓ Seguindo</span>
        ) : (
          <button
            className="action-btn"
            style={styles.secundaryBtn}
            disabled={processando}
            onClick={handleSeguir}
          >
            👤 Seguir
          </button>
        )}

        <button
          className="action-btn"
          style={styles.blockBtn}
          title="Bloquear usuário"
          onClick={() => onBloquear && onBloquear(candidato.candidate_id)}
        >
          🚫
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "14px 16px",
    boxShadow: "0 4px 12px rgba(80,70,40,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  avatarBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    flexShrink: 0,
  },
  nome: {
    fontSize: 14,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 2px",
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  reasonBadge: {
    fontSize: 11.5,
    fontWeight: 600,
    color: "#8A6224",
    background: "#F1E2C4",
    borderRadius: 999,
    padding: "2px 8px",
    display: "inline-block",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderTop: "1px solid #F1EEE3",
    paddingTop: 10,
  },
  primaryBtn: {
    flex: 1,
    background: "linear-gradient(180deg, #8FCB9A 0%, #4F9463 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "2px solid #35704A",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  secundaryBtn: {
    flex: 1,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 12,
    color: "#33422F",
    cursor: "pointer",
  },
  blockBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    padding: "6px",
    opacity: 0.6,
  },
  sucessoBadge: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#3F7A4D",
    background: "#EAF4EC",
    borderRadius: 10,
    padding: "6px 0",
  },
  seguindoBadge: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#8A6224",
    background: "#F1E2C4",
    borderRadius: 10,
    padding: "6px 0",
  },
};
