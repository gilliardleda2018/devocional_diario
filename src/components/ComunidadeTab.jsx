"use client";

import { useState } from "react";
import DescobrirPessoasCard from "./DescobrirPessoasCard";
import AmigosTab from "./AmigosTab";
import PedidosOracaoTab from "./PedidosOracaoTab";
import PrivacidadeModal from "./PrivacidadeModal";
import PerfilAmigoModal from "./PerfilAmigoModal";
import { useFaithGraph } from "@/src/lib/hooks/useFaithGraph";

export default function ComunidadeTab({ usuarioId, nomeUsuario }) {
  const [subAba, setSubAba] = useState("descobrir"); // descobrir, oracoes, amigos
  const [modalPrivacidadeAberto, setModalPrivacidadeAberto] = useState(false);
  const [perfilAmigoSelecionado, setPerfilAmigoSelecionado] = useState(null);

  const {
    recomendacoes,
    carregandoRecomendacoes,
    seguirUsuario,
    enviarPedidoAmizade,
    bloquearUsuario,
  } = useFaithGraph(usuarioId);

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
      <div style={styles.subTabRow} className="no-scrollbar">
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
            <h3 style={styles.sectionTitle}>Recomendações Inteligentes de Conexão</h3>
            <p style={styles.sectionSubtitle}>
              Pessoas com quem você compartilha amigos em comum, leitura bíblica e afinidade espiritual.
            </p>
          </div>

          {carregandoRecomendacoes ? (
            <div style={styles.loadingBox}>
              <p style={styles.loadingText}>Buscando conexões de fé para você...</p>
            </div>
          ) : recomendacoes.length === 0 ? (
            <div style={styles.emptyCard}>
              <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>✨</span>
              <p style={styles.emptyTitle}>Sem novas sugestões no momento</p>
              <p style={styles.emptyDesc}>
                Convide seus amigos pelo WhatsApp na aba &quot;Meus Amigos&quot; para expandir sua rede de oração!
              </p>
            </div>
          ) : (
            <div style={styles.cardsGrid}>
              {recomendacoes.map((candidato) => (
                <DescobrirPessoasCard
                  key={candidato.candidate_id}
                  candidato={candidato}
                  onAdicionar={enviarPedidoAmizade}
                  onSeguir={seguirUsuario}
                  onBloquear={bloquearUsuario}
                  onAbrirPerfil={(cand) => setPerfilAmigoSelecionado(cand)}
                />
              ))}
            </div>
          )}
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

      {/* Modal Perfil Amigo */}
      {perfilAmigoSelecionado && (
        <PerfilAmigoModal
          aberto={!!perfilAmigoSelecionado}
          aoFechar={() => setPerfilAmigoSelecionado(null)}
          amigo={perfilAmigoSelecionado}
          usuarioAtualId={usuarioId}
        />
      )}
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
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  subTabActive: {
    flex: 1,
    minWidth: "fit-content",
    background: "#FFFFFF",
    color: "#33422F",
    border: "none",
    borderRadius: 9,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(80,70,40,0.08)",
    whiteSpace: "nowrap",
  },
  subTabInactive: {
    flex: 1,
    minWidth: "fit-content",
    background: "transparent",
    color: "#8A9184",
    border: "none",
    borderRadius: 9,
    padding: "8px 12px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
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
  loadingBox: {
    textAlign: "center",
    padding: 24,
    background: "#FBF9F3",
    borderRadius: 14,
    border: "1px solid #E7E0D0",
  },
  loadingText: {
    fontSize: 13,
    color: "#7A8A7F",
  },
  emptyCard: {
    background: "#FBF9F3",
    border: "1px dashed #D8CFB8",
    borderRadius: 16,
    padding: "32px 20px",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 6px",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#7A8A7F",
    maxWidth: 320,
    margin: "0 auto",
  },
  cardsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
};
