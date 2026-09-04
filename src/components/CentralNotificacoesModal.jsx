"use client";

import { useState } from "react";
import { useNotificacoes } from "@/src/lib/hooks/useNotificacoes";
import { useAmigos } from "@/src/lib/hooks/useAmigos";

export default function CentralNotificacoesModal({ usuarioId, aoFechar, aoAbrirPerfilAmigo }) {
  const {
    notificacoesAgrupadas,
    unreadNotificationsCount,
    carregando,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoes(usuarioId);

  const { responderPedido } = useAmigos(usuarioId);
  const [processando, setProcessando] = useState({});

  function tempoRelativo(dataIso) {
    if (!dataIso) return "";
    const diffMs = new Date() - new Date(dataIso);
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `Há ${diffHoras}h`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias === 1) return "Ontem";
    return `Há ${diffDias} dias`;
  }

  async function handleAceitarPedido(notif) {
    if (!notif.entity_id) return;
    setProcessando((prev) => ({ ...prev, [notif.id]: true }));
    try {
      await responderPedido(notif.entity_id, true);
      await marcarComoLida(notif.id);
    } catch (e) {
      console.error("Erro ao aceitar pedido:", e);
    } finally {
      setProcessando((prev) => ({ ...prev, [notif.id]: false }));
    }
  }

  async function handleRemoverPedido(notif) {
    if (!notif.entity_id) return;
    setProcessando((prev) => ({ ...prev, [notif.id]: true }));
    try {
      await responderPedido(notif.entity_id, false);
      await marcarComoLida(notif.id);
    } catch (e) {
      console.error("Erro ao remover pedido:", e);
    } finally {
      setProcessando((prev) => ({ ...prev, [notif.id]: false }));
    }
  }

  function renderGrupo(titulo, lista) {
    if (!lista || lista.length === 0) return null;
    return (
      <div style={styles.grupoSection}>
        <div style={styles.grupoTitulo}>{titulo}</div>
        {lista.map((item) => {
          const lida = item.is_read;
          return (
            <div
              key={item.id}
              style={lida ? styles.cardLido : styles.cardNaoLido}
              onClick={() => {
                if (!lida) marcarComoLida(item.id);
              }}
            >
              <div style={styles.avatarWrap}>
                {item.actor_foto_url ? (
                  <img src={item.actor_foto_url} alt="" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarFallback}>
                    {item.actor_nome?.slice(0, 2).toUpperCase() || "FI"}
                  </div>
                )}
                {!lida && <div style={styles.dotUnread} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.mensagemText}>
                  <strong>{item.actor_nome}</strong>{" "}
                  {item.type === "FRIEND_REQUEST_RECEIVED" && "enviou um pedido de amizade."}
                  {item.type === "FRIEND_REQUEST_ACCEPTED" && "aceitou seu pedido de amizade."}
                  {item.type === "PRAYER_INTERACTION" && "está orando pelo seu pedido. 🙏"}
                  {item.type === "NEW_FOLLOWER" && "começou a te seguir."}
                  {item.type === "SYSTEM" && item.entity_id}
                </div>

                <div style={styles.tempoText}>{tempoRelativo(item.criado_em)}</div>

                {/* Ações inline para Pedido de Amizade */}
                {item.type === "FRIEND_REQUEST_RECEIVED" && (
                  <div style={styles.acoesRow}>
                    <button
                      style={styles.btnAceitar}
                      disabled={processando[item.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAceitarPedido(item);
                      }}
                    >
                      {processando[item.id] ? "Processando..." : "ACEITAR"}
                    </button>
                    <button
                      style={styles.btnRemover}
                      disabled={processando[item.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoverPedido(item);
                      }}
                    >
                      REMOVER
                    </button>
                  </div>
                )}

                {item.type === "FRIEND_REQUEST_ACCEPTED" && (
                  <button
                    style={styles.btnVerPerfil}
                    onClick={(e) => {
                      e.stopPropagation();
                      marcarComoLida(item.id);
                      if (aoAbrirPerfilAmigo) aoAbrirPerfilAmigo(item.actor_id);
                    }}
                  >
                    Ver Perfil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const possuiNotificacoes =
    (notificacoesAgrupadas.hoje?.length || 0) +
    (notificacoesAgrupadas.ontem?.length || 0) +
    (notificacoesAgrupadas.estaSemana?.length || 0) +
    (notificacoesAgrupadas.maisAntigas?.length || 0) > 0;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Cabeçalho */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={styles.title}>Notificações 🔔</h3>
            {unreadNotificationsCount > 0 && (
              <span style={styles.badgeCount}>{unreadNotificationsCount} novas</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {unreadNotificationsCount > 0 && (
              <button style={styles.btnMarcarTodas} onClick={marcarTodasComoLidas}>
                Marcar todas como lidas
              </button>
            )}
            <button style={styles.btnFechar} onClick={aoFechar}>
              ✕
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div style={styles.body}>
          {carregando ? (
            <div style={{ padding: 24, textAlign: "center", color: "#7A8A7F" }}>
              Carregando suas notificações...
            </div>
          ) : !possuiNotificacoes ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🕊️</span>
              <strong style={{ color: "#33422F", fontSize: 16 }}>Você está em dia.</strong>
              <p style={{ color: "#7A8A7F", fontSize: 13, margin: "4px 0 0" }}>
                Novas atividades e pedidos de amizade aparecerão aqui.
              </p>
            </div>
          ) : (
            <div>
              {renderGrupo("Hoje", notificacoesAgrupadas.hoje)}
              {renderGrupo("Ontem", notificacoesAgrupadas.ontem)}
              {renderGrupo("Esta Semana", notificacoesAgrupadas.estaSemana)}
              {renderGrupo("Mais Antigas", notificacoesAgrupadas.maisAntigas)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30, 40, 35, 0.5)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    zIndex: 9990,
    padding: "60px 16px 16px",
  },
  modal: {
    background: "#FBF9F3",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    maxHeight: "82vh",
    boxShadow: "0 16px 36px rgba(0,0,0,0.16)",
    border: "1px solid #E7E0D0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    background: "#F6EFE1",
    borderBottom: "1px solid #E7E0D0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    color: "#33422F",
    margin: 0,
  },
  badgeCount: {
    background: "#B98B4E",
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 12,
  },
  btnMarcarTodas: {
    background: "none",
    border: "none",
    color: "#B98B4E",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnFechar: {
    background: "none",
    border: "none",
    color: "#7A8A7F",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  body: {
    padding: 16,
    overflowY: "auto",
    flex: 1,
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
  },
  grupoSection: {
    marginBottom: 16,
  },
  grupoTitulo: {
    fontSize: 12,
    fontWeight: 700,
    color: "#7A8A7F",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardNaoLido: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    background: "#FFFFFF",
    border: "1px solid #B98B4E",
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: "0 2px 8px rgba(185, 139, 78, 0.08)",
    cursor: "pointer",
  },
  cardLido: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    background: "rgba(255, 255, 255, 0.6)",
    border: "1px solid #E7E0D0",
    borderRadius: 12,
    marginBottom: 8,
    cursor: "pointer",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#EAF0EC",
    color: "#33422F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
  },
  dotUnread: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#B98B4E",
    border: "2px solid #FFFFFF",
  },
  mensagemText: {
    fontSize: 13.5,
    color: "#33422F",
    lineHeight: 1.4,
  },
  tempoText: {
    fontSize: 11,
    color: "#9AA79C",
    marginTop: 4,
  },
  acoesRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  btnAceitar: {
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnRemover: {
    background: "#EAF0EC",
    color: "#5C7060",
    border: "1px solid #E7E0D0",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnVerPerfil: {
    background: "none",
    border: "none",
    color: "#B98B4E",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    marginTop: 6,
  },
};
