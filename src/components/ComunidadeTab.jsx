"use client";

import { useState } from "react";
import DescobrirPessoasCard from "./DescobrirPessoasCard";
import AmigosTab from "./AmigosTab";
import PedidosOracaoTab from "./PedidosOracaoTab";
import PrivacidadeModal from "./PrivacidadeModal";
import { useFaithGraph } from "@/src/lib/hooks/useFaithGraph";

export default function ComunidadeTab({ usuarioId, nomeUsuario }) {
  const [subAba, setSubAba] = useState("descobrir"); // para_voce, amigos, descobrir, oracoes
  const [modalPrivacidadeAberto, setModalPrivacidadeAberto] = useState(false);

  const { recomendacoes, carregandoRec, seguir, enviarPedido, registrarEvento } = useFaithGraph(usuarioId);

  return (
    <div style={styles.container}>
      {/* Top Banner Social */}
      <div style={styles.topBanner}>
        <div>
          <h2 style={styles.bannerTitle}>Comunidade de Fé (Faith Graph)</h2>
          <p style={styles.bannerSubtitle}>
            Conecte-se com irmãos, compartilhe devocionais e fortaleça sua caminhada diária.
          </p>
        </div>
        <button
          style={styles.privacidadeBtn}
          onClick={() => setModalPrivacidadeAberto(true)}
          title="Configurações de Privacidade"
        >
          🛡️ Privacidade
        </button>
      </div>

      {/* Sub Navegação da Comunidade */}
      <div style={styles.subTabRow}>
        <button
          style={subAba === "descobrir" ? styles.subTabActive : styles.subTabInactive}
          onClick={() => setSubAba("descobrir")}
        >
          ✨ Descobrir
        </button>
        <button
          style={subAba === "oracoes" ? styles.subTabActive : styles.subTabInactive}
          onClick={() => setSubAba("oracoes")}
        >
          🙏 Orações
        </button>
        <button
          style={subAba === "amigos" ? styles.subTabActive : styles.subTabInactive}
          onClick={() => setSubAba("amigos")}
        >
          👥 Meus Amigos
        </button>
      </div>

      {/* Conteúdo da Sub-Aba Selecionada */}
      {subAba === "descobrir" && (
        <div>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Recomendações Inteligentes de Conexão</h3>
              <p style={styles.sectionSubtitle}>
                Pessoas com quem você compartilha amigos em comum, leitura bíblica e afinidade espiritual.
              </p>
            </div>
          </div>

          <DescobrirPessoasCard usuarioId={usuarioId} />
        </div>
      )}

      {subAba === "oracoes" && (
        <PedidosOracaoTab usuarioId={usuarioId} nomeUsuario={nomeUsuario} />
      )}

      {subAba === "amigos" && (
        <AmigosTab usuarioId={usuarioId} />
      )}

      {/* Modal de Privacidade */}
      <PrivacidadeModal
        usuarioId={usuarioId}
        isOpen={modalPrivacidadeAberto}
        onClose={() => setModalPrivacidadeAberto(false)}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: "4px 0",
  },
  topBanner: {
    background: "linear-gradient(135deg, #FBF9F3 0%, #F4EFE0 100%)",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    boxShadow: "0 4px 14px rgba(80, 70, 40, 0.04)",
  },
  bannerTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    color: "#33422F",
    margin: 0,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#6B7C70",
    margin: "2px 0 0",
    lineHeight: 1.35,
  },
  privacidadeBtn: {
    background: "#FFFFFF",
    color: "#8A6224",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  subTabRow: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
    background: "#EFEAD9",
    borderRadius: 12,
    padding: 3,
  },
  subTabActive: {
    flex: 1,
    background: "#FFFFFF",
    color: "#33422F",
    border: "none",
    borderRadius: 9,
    padding: "8px 0",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(80,70,40,0.08)",
  },
  subTabInactive: {
    flex: 1,
    background: "transparent",
    color: "#8A9184",
    border: "none",
    borderRadius: 9,
    padding: "8px 0",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 600,
    color: "#33422F",
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#7A8A7F",
    margin: "2px 0 0",
  },
};
