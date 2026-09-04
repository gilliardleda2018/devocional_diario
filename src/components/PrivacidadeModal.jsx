"use client";

import { useState, useEffect } from "react";
import { useFaithGraph } from "@/src/lib/hooks/useFaithGraph";

export default function PrivacidadeModal({ usuarioId, isOpen, onClose }) {
  const {
    configPrivacidade,
    bloqueados = [],
    salvarPrivacidade,
    desbloquearUsuario,
  } = useFaithGraph(usuarioId);

  const [form, setForm] = useState({
    discoverable: true,
    allow_friend_requests: true,
    allow_followers: true,
    show_church: true,
    show_city: true,
  });

  useEffect(() => {
    if (configPrivacidade) {
      setForm({
        discoverable: configPrivacidade.discoverable ?? true,
        allow_friend_requests: configPrivacidade.allow_friend_requests ?? true,
        allow_followers: configPrivacidade.allow_followers ?? true,
        show_church: configPrivacidade.show_church ?? true,
        show_city: configPrivacidade.show_city ?? true,
      });
    }
  }, [configPrivacidade]);

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setMensagemSucesso(false);
    await salvarPrivacidade(form);
    setSalvando(false);
    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 3000);
  };

  const listaBloqueados = bloqueados || [];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>🛡️ Privacidade & Controles</h3>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={styles.subtitle}>
          Você tem total controle sobre sua visibilidade e quem pode interagir com você no Faith Graph.
        </p>

        {mensagemSucesso && (
          <div style={styles.successBanner}>
            ✓ Configurações de privacidade salvas com sucesso!
          </div>
        )}

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Visibilidade no Grafo Social</h4>

          <div style={styles.toggleRow}>
            <div>
              <span style={styles.toggleLabel}>Aparecer em &quot;Descobrir Pessoas&quot;</span>
              <p style={styles.toggleDesc}>
                Permite que o recomendador de fé sugira seu perfil para irmãos em comum.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.discoverable}
              onChange={() => handleToggle("discoverable")}
              style={styles.checkbox}
            />
          </div>

          <div style={styles.toggleRow}>
            <div>
              <span style={styles.toggleLabel}>Receber pedidos de amizade</span>
              <p style={styles.toggleDesc}>Outros usuários poderão te enviar solicitações.</p>
            </div>
            <input
              type="checkbox"
              checked={form.allow_friend_requests}
              onChange={() => handleToggle("allow_friend_requests")}
              style={styles.checkbox}
            />
          </div>

          <div style={styles.toggleRow}>
            <div>
              <span style={styles.toggleLabel}>Permitir novos seguidores</span>
              <p style={styles.toggleDesc}>Outros irmãos poderão seguir suas atualizações públicas.</p>
            </div>
            <input
              type="checkbox"
              checked={form.allow_followers}
              onChange={() => handleToggle("allow_followers")}
              style={styles.checkbox}
            />
          </div>

          <div style={styles.toggleRow}>
            <div>
              <span style={styles.toggleLabel}>Exibir minha igreja no perfil</span>
              <p style={styles.toggleDesc}>Mostra sua comunidade local para outros membros.</p>
            </div>
            <input
              type="checkbox"
              checked={form.show_church}
              onChange={() => handleToggle("show_church")}
              style={styles.checkbox}
            />
          </div>
        </div>

        {/* Usuários Bloqueados */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Usuários Bloqueados ({listaBloqueados.length})</h4>
          <p style={styles.toggleDesc}>
            Usuários bloqueados não podem ver seus pedidos de oração, enviar solicitações ou ver seu perfil.
          </p>

          {listaBloqueados.length === 0 ? (
            <p style={styles.emptyBlocked}>Nenhum usuário bloqueado no momento.</p>
          ) : (
            <div style={styles.blockedList}>
              {listaBloqueados.map((b) => (
                <div key={b.id || b.blocked_id} style={styles.blockedItem}>
                  <span style={styles.blockedName}>
                    {b.profiles?.nome_exibicao || "Usuário Bloqueado"}
                  </span>
                  <button
                    style={styles.unblockBtn}
                    onClick={() => desbloquearUsuario(b.blocked_id)}
                  >
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>
            Fechar
          </button>
          <button
            className="action-btn chunky"
            style={styles.saveBtn}
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30, 40, 32, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 20,
    maxWidth: 480,
    width: "100%",
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#33422F",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    color: "#7A8A7F",
    cursor: "pointer",
  },
  subtitle: {
    fontSize: 12.5,
    color: "#6B7C70",
    margin: "0 0 16px",
    lineHeight: 1.4,
  },
  successBanner: {
    background: "#DDE8DE",
    color: "#2D4C33",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    marginBottom: 14,
  },
  section: {
    borderTop: "1px solid #F1EEE3",
    paddingTop: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#8A6224",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    margin: "0 0 10px",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#33422F",
    display: "block",
  },
  toggleDesc: {
    fontSize: 11.5,
    color: "#7A8A7F",
    margin: "2px 0 0",
    lineHeight: 1.3,
  },
  checkbox: {
    accentColor: "#B98B4E",
    width: 20,
    height: 20,
    cursor: "pointer",
    flexShrink: 0,
  },
  emptyBlocked: {
    fontSize: 12.5,
    color: "#9AA79C",
    fontStyle: "italic",
    margin: "6px 0",
  },
  blockedList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  blockedItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "8px 12px",
  },
  blockedName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#33422F",
  },
  unblockBtn: {
    background: "#FEF2F2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    borderTop: "1px solid #F1EEE3",
    paddingTop: 16,
    marginTop: 8,
  },
  cancelBtn: {
    background: "#F3F4F6",
    color: "#4B5563",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};
