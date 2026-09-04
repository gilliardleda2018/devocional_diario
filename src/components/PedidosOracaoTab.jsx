"use client";

import { useState } from "react";
import AvatarUsuario from "./AvatarUsuario";
import PerfilAmigoModal from "./PerfilAmigoModal";
import { usePedidosOracao } from "@/src/lib/hooks/usePedidosOracao";
import { useAmigos } from "@/src/lib/hooks/useAmigos";

export default function PedidosOracaoTab({ usuarioId, nomeUsuario }) {
  const {
    pedidos,
    carregando,
    erro,
    criarPedido,
    alternarOracao,
    recarregar,
  } = usePedidosOracao(usuarioId);

  const { amigos, enviarPedido, torcer } = useAmigos(usuarioId);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);

  const [filtroVisibilidade, setFiltroVisibilidade] = useState("ALL"); // ALL, MY_REQUESTS
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [visibilidade, setVisibilidade] = useState("PUBLIC");
  const [anonimo, setAnonimo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) return;

    setEnviando(true);
    setErroEnvio(null);

    const { data, error } = await criarPedido({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      visibilidade,
      isAnonimo: anonimo,
    });

    setEnviando(false);

    if (error) {
      setErroEnvio("Não foi possível publicar o pedido. Tente novamente.");
    } else {
      setTitulo("");
      setDescricao("");
      setVisibilidade("PUBLIC");
      setAnonimo(false);
      setModalNovoAberto(false);
    }
  };

  const pedidosFiltrados = (pedidos || []).filter((p) => {
    if (filtroVisibilidade === "MY_REQUESTS") {
      return p.user_id === usuarioId;
    }
    return true;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Mural de Oração</h2>
          <p style={styles.subtitle}>
            &ldquo;Orai uns pelos outros, para que sereis curados.&rdquo; — Tiago 5:16
          </p>
        </div>
        <button
          className="action-btn chunky"
          style={styles.newPrayerBtn}
          onClick={() => setModalNovoAberto(true)}
        >
          ➕ Pedir Oração
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filterRow} className="no-scrollbar">
        <button
          style={filtroVisibilidade === "ALL" ? styles.filterActive : styles.filterInactive}
          onClick={() => setFiltroVisibilidade("ALL")}
        >
          🌐 Todos os Pedidos
        </button>
        <button
          style={filtroVisibilidade === "MY_REQUESTS" ? styles.filterActive : styles.filterInactive}
          onClick={() => setFiltroVisibilidade("MY_REQUESTS")}
        >
          ✍️ Meus Pedidos
        </button>
      </div>

      {/* Loading & State */}
      {carregando && (
        <div style={styles.loadingBox}>
          <p style={styles.loadingText}>Carregando pedidos de oração...</p>
        </div>
      )}

      {erro && pedidosFiltrados.length === 0 && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>Ops, não foi possível carregar os pedidos. Tente recarregar.</p>
          <button style={styles.retryBtn} onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && pedidosFiltrados.length === 0 && (
        <div style={styles.emptyCard}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🙏</span>
          <p style={styles.emptyTitle}>Nenhum pedido de oração encontrado</p>
          <p style={styles.emptyDesc}>
            {filtroVisibilidade === "MY_REQUESTS"
              ? "Você ainda não publicou nenhum pedido de oração. Clique em 'Pedir Oração' acima para compartilhar com a comunidade."
              : "Seja o primeiro a interceder ou compartilhe sua motivação de oração com a comunidade."}
          </p>
        </div>
      )}

      {/* Feed de Pedidos */}
      <div style={styles.feed}>
        {pedidosFiltrados.map((item) => {
          const eAutor = item.user_id === usuarioId;
          const autorNome = item.is_anonimo
            ? "Irmão(ã) em Cristo"
            : item.profiles?.nome_exibicao || "Irmão em Fé";
          const autorFoto = item.is_anonimo ? null : item.profiles?.foto_url;
          const jaOra = item.intersections?.some((i) => i.user_id === usuarioId) || item.user_prayed;

          const handleAbrirPerfil = () => {
            if (item.is_anonimo) return;
            setPerfilSelecionado(
              item.profiles
                ? { ...item.profiles, usuario_id: item.autor_id }
                : { usuario_id: item.autor_id, nome_exibicao: autorNome, foto_url: autorFoto }
            );
          };

          return (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.authorInfo}>
                  <button
                    onClick={handleAbrirPerfil}
                    style={{ background: "none", border: "none", padding: 0, cursor: item.is_anonimo ? "default" : "pointer" }}
                    title={item.is_anonimo ? "Anônimo" : `Ver perfil de ${autorNome}`}
                  >
                    <AvatarUsuario
                      fotoUrl={autorFoto}
                      nome={autorNome}
                      tamanho={36}
                      moldura={true}
                    />
                  </button>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <h4
                        style={{ ...styles.authorName, cursor: item.is_anonimo ? "default" : "pointer" }}
                        onClick={handleAbrirPerfil}
                      >
                        {autorNome}
                      </h4>
                      {!eAutor && !item.is_anonimo && (
                        <button
                          onClick={handleAbrirPerfil}
                          style={styles.quickAddBtn}
                          title={`Adicionar ${autorNome} como amigo`}
                        >
                          ➕ Adicionar
                        </button>
                      )}
                    </div>
                    <span style={styles.cardTime}>
                      {new Date(item.created_at).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div style={styles.badgeVisibilidade}>
                  {item.visibilidade === "PUBLIC" && "🌐 Público"}
                  {item.visibilidade === "FRIENDS" && "👥 Amigos"}
                  {item.visibilidade === "COMMUNITY" && "🏛️ Comunidade"}
                  {item.visibilidade === "PRIVATE" && "🔒 Privado"}
                </div>
              </div>

              <h3 style={styles.prayerTitle}>{item.titulo}</h3>
              <p style={styles.prayerContent}>{item.descricao}</p>

              {/* Botão de Reação & Intercessores */}
              <div style={styles.cardFooter}>
                <button
                  className="action-btn"
                  style={jaOra ? styles.prayedBtnActive : styles.prayedBtnInactive}
                  onClick={() => alternarOracao(item.id)}
                >
                  <span style={{ fontSize: 16 }}>🙏</span>
                  <span>{jaOra ? "Estou Orando" : "Orar por este pedido"}</span>
                  <span style={styles.counterBadge}>{item.prayer_count || 0}</span>
                </button>

                {item.prayer_count > 0 && (
                  <span style={styles.intercessionText}>
                    {item.prayer_count === 1
                      ? "1 pessoa está orando"
                      : `${item.prayer_count} pessoas estão orando`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar Pedido */}
      {modalNovoAberto && (
        <div style={styles.modalOverlay} onClick={() => setModalNovoAberto(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Novo Pedido de Oração</h3>
              <button style={styles.closeBtn} onClick={() => setModalNovoAberto(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCriar} style={styles.form}>
              {erroEnvio && <p style={styles.formError}>{erroEnvio}</p>}

              <label style={styles.label}>Motivo / Título do Pedido</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Ex: Pela saúde da minha família, sabedoria no trabalho..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={80}
                required
              />

              <label style={styles.label}>Detalhes da Oração</label>
              <textarea
                style={styles.textarea}
                placeholder="Abra o seu coração e compartilhe com os irmãos como podemos interceder por você..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                required
              />

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={styles.label}>Quem pode ver este pedido?</label>
                  <select
                    style={styles.select}
                    value={visibilidade}
                    onChange={(e) => setVisibilidade(e.target.value)}
                  >
                    <option value="PUBLIC">🌐 Público (Toda a comunidade)</option>
                    <option value="FRIENDS">👥 Apenas Meus Amigos</option>
                    <option value="COMMUNITY">🏛️ Apenas Minha Igreja</option>
                    <option value="PRIVATE">🔒 Privado (Apenas eu)</option>
                  </select>
                </div>
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="anonimo"
                  checked={anonimo}
                  onChange={(e) => setAnonimo(e.target.checked)}
                  style={{ accentColor: "#B98B4E", width: 18, height: 18 }}
                />
                <label htmlFor="anonimo" style={styles.checkboxLabel}>
                  Publicar de forma anônima (sem mostrar seu nome ou foto)
                </label>
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setModalNovoAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="action-btn chunky"
                  style={styles.submitBtn}
                  disabled={enviando || !titulo.trim() || !descricao.trim()}
                >
                  {enviando ? "Publicando..." : "Publicar Pedido 🙏"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Perfil do Autor */}
      {perfilSelecionado && (
        <PerfilAmigoModal
          aberto={!!perfilSelecionado}
          aoFechar={() => setPerfilSelecionado(null)}
          amigo={perfilSelecionado}
          usuarioAtualId={usuarioId}
          meusAmigos={amigos}
          aoAdicionar={enviarPedido}
          aoTorcer={torcer}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "4px 0",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    color: "#33422F",
    margin: 0,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#6B7C70",
    margin: "4px 0 0",
    fontStyle: "italic",
  },
  newPrayerBtn: {
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 12,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  filterActive: {
    background: "#FFFFFF",
    color: "#33422F",
    border: "1px solid #B98B4E",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(80,70,40,0.06)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  filterInactive: {
    background: "#FBF9F3",
    color: "#7A8A7F",
    border: "1px solid #E7E0D0",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
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
  errorBox: {
    padding: 16,
    background: "#FEF2F2",
    borderRadius: 14,
    border: "1px solid #FCA5A5",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#991B1B",
    marginBottom: 8,
  },
  retryBtn: {
    background: "#991B1B",
    color: "#FFF",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
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
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "16px 18px",
    boxShadow: "0 4px 12px rgba(80, 70, 40, 0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  authorInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#33422F",
    margin: 0,
  },
  quickAddBtn: {
    background: "#F1E2C4",
    color: "#8A6224",
    border: "1px solid #D8CFB8",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  cardTime: {
    fontSize: 11,
    color: "#9AA79C",
  },
  badgeVisibilidade: {
    fontSize: 11,
    fontWeight: 600,
    color: "#8A6224",
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "2px 8px",
  },
  prayerTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 600,
    color: "#2D3B33",
    margin: "0 0 6px",
  },
  prayerContent: {
    fontSize: 13.5,
    color: "#4B5563",
    lineHeight: 1.5,
    margin: "0 0 14px",
    whiteSpace: "pre-line",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #F1EEE3",
    paddingTop: 12,
  },
  prayedBtnActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#FEF3C7",
    color: "#92400E",
    border: "1px solid #F59E0B",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  prayedBtnInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#FBF9F3",
    color: "#374151",
    border: "1px solid #E7E0D0",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  counterBadge: {
    background: "rgba(0,0,0,0.06)",
    borderRadius: 10,
    padding: "1px 6px",
    fontSize: 11.5,
    fontWeight: 700,
  },
  intercessionText: {
    fontSize: 12,
    color: "#7A8A7F",
    fontWeight: 500,
  },

  // Modal Styles
  modalOverlay: {
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
  modalContent: {
    background: "#FFFFFF",
    borderRadius: 20,
    maxWidth: 480,
    width: "100%",
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formError: {
    fontSize: 12.5,
    color: "#B15A4A",
    background: "#FDF2F2",
    padding: "8px 12px",
    borderRadius: 8,
    margin: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    padding: "10px 12px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 14,
    color: "#2D3B33",
  },
  textarea: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    padding: "10px 12px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 14,
    color: "#2D3B33",
    resize: "vertical",
  },
  select: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    padding: "10px 12px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 13.5,
    color: "#2D3B33",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "4px 0 8px",
  },
  checkboxLabel: {
    fontSize: 12.5,
    color: "#4B5563",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
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
  submitBtn: {
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
