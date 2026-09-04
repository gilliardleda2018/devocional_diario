"use client";

import { useState, useEffect } from "react";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import { obterNivel } from "@/src/lib/devocional/niveis";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import { RELATIONSHIP_STATES } from "@/src/lib/constants";

export default function PerfilAmigoModal({
  aberto,
  aoFechar,
  amigo,
  usuarioAtualId,
  meusAmigos = [],
  aoAdicionar,
  aoTorcer,
}) {
  const [detalhes, setDetalhes] = useState(null);
  const [estadoRelacionamento, setEstadoRelacionamento] = useState("NONE");
  const [amigosEmComum, setAmigosEmComum] = useState({ total: 0, preview: [] });
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const amigoId = amigo?.candidate_id || amigo?.usuario_id || amigo?.amigo_id || amigo?.autor_id || amigo?.id;

  useEffect(() => {
    if (!aberto || !amigoId) return;

    let vivo = true;
    async function carregarPerfilEConexao() {
      setCarregando(true);
      setMensagem(null);
      try {
        const supabase = criarClienteSupabase();
        const [{ data: profile }, { data: stats }, { data: relState }, { data: mutuos }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", amigoId).maybeSingle(),
          supabase.from("estatisticas_usuario").select("*").eq("usuario_id", amigoId).maybeSingle(),
          supabase.rpc("get_relationship_state", { p_target_id: amigoId }).catch(() => ({ data: null })),
          supabase.rpc("obter_amigos_em_comum", { p_target_id: amigoId }).catch(() => ({ data: null })),
        ]);

        if (vivo) {
          setDetalhes({
            id: amigoId,
            nome_exibicao: profile?.nome_exibicao || amigo?.nome_exibicao || "Irmão em Fé",
            username: profile?.username || amigo?.username || null,
            foto_url: profile?.foto_url || amigo?.foto_url || null,
            codigo_amigo: profile?.codigo_amigo || amigo?.codigo_amigo || null,
            cidade: profile?.cidade || null,
            igreja: profile?.igreja || null,
            bio: profile?.bio || null,
            xp_total: stats?.xp_total || amigo?.xp_total || 0,
            ofensiva_atual: amigo?.ofensiva_atual || 0,
          });

          if (relState) {
            setEstadoRelacionamento(relState);
          } else if (usuarioAtualId === amigoId) {
            setEstadoRelacionamento("SELF");
          } else {
            const ehAmigo = meusAmigos.some((a) => a.amigo_id === amigoId || a.id === amigoId);
            setEstadoRelacionamento(ehAmigo ? "FRIENDS" : "NONE");
          }

          if (Array.isArray(mutuos) && mutuos.length > 0) {
            setAmigosEmComum({
              total: Number(mutuos[0].total_mutuos || 0),
              preview: mutuos.filter((m) => m.amigo_id),
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes do perfil:", err);
      } finally {
        if (vivo) setCarregando(false);
      }
    }

    carregarPerfilEConexao();
    return () => { vivo = false; };
  }, [aberto, amigoId, amigo, usuarioAtualId, meusAmigos]);

  if (!aberto || !amigo) return null;

  const perfilExibicao = detalhes || amigo;
  const nivel = obterNivel(perfilExibicao?.xp_total || 0);

  async function handleAdicionar() {
    const identificador = perfilExibicao?.codigo_amigo || amigoId;
    if (!aoAdicionar || !identificador) return;
    setProcessando(true);
    setMensagem(null);
    try {
      const res = await aoAdicionar(identificador);
      if (res?.sucesso !== false) {
        setEstadoRelacionamento("REQUEST_SENT");
        setMensagem({ tipo: "sucesso", texto: "Solicitação enviada com sucesso! 🎉" });
      } else {
        setMensagem({ tipo: "erro", texto: res?.erro || "Não foi possível adicionar." });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao enviar solicitação." });
    } finally {
      setProcessando(false);
    }
  }

  async function handleAceitar() {
    setProcessando(true);
    try {
      const supabase = criarClienteSupabase();
      const { data: pendente } = await supabase
        .from("amizades")
        .select("id")
        .eq("solicitante_id", amigoId)
        .eq("destinatario_id", usuarioAtualId)
        .eq("status", "pendente")
        .maybeSingle();

      if (pendente?.id) {
        await supabase.rpc("responder_pedido_amizade_v2", { p_amizade_id: pendente.id, p_aceitar: true });
        setEstadoRelacionamento("FRIENDS");
        setMensagem({ tipo: "sucesso", texto: "Vocês agora são amigos! 🤝" });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao aceitar pedido." });
    } finally {
      setProcessando(false);
    }
  }

  async function handleCancelarOuRemover() {
    setProcessando(true);
    try {
      const supabase = criarClienteSupabase();
      await supabase.rpc("remover_amizade", { p_amigo_id: amigoId });
      setEstadoRelacionamento("NONE");
      setMensagem({ tipo: "sucesso", texto: "Amizade removida." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao remover." });
    } finally {
      setProcessando(false);
    }
  }

  async function handleBloquear() {
    if (!confirm("Tem certeza que deseja bloquear este usuário? Todas as amizades e solicitações serão desfeitas.")) return;
    setProcessando(true);
    try {
      const supabase = criarClienteSupabase();
      await supabase.rpc("bloquear_usuario", { p_target_id: amigoId });
      setEstadoRelacionamento("BLOCKED_BY_ME");
      setMensagem({ tipo: "sucesso", texto: "Usuário bloqueado." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao bloquear." });
    } finally {
      setProcessando(false);
    }
  }

  async function handleDesbloquear() {
    setProcessando(true);
    try {
      const supabase = criarClienteSupabase();
      await supabase.rpc("desbloquear_usuario", { p_target_id: amigoId });
      setEstadoRelacionamento("NONE");
      setMensagem({ tipo: "sucesso", texto: "Usuário desbloqueado." });
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao desbloquear." });
    } finally {
      setProcessando(false);
    }
  }

  async function handleTorcer() {
    if (!aoTorcer || !amigoId) return;
    setProcessando(true);
    try {
      const res = await aoTorcer(amigoId);
      if (res?.sucesso !== false) {
        setMensagem({ tipo: "sucesso", texto: "Torcida enviada! 🔥" });
      } else {
        setMensagem({ tipo: "erro", texto: res?.erro || "Você já torceu hoje!" });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao enviar torcida." });
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={aoFechar}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={aoFechar} title="Fechar perfil">
          ✕
        </button>

        {/* Top Header Card */}
        <div style={styles.header}>
          <AvatarUsuario
            nome={perfilExibicao.nome_exibicao}
            fotoUrl={perfilExibicao.foto_url}
            tamanho={64}
            moldura={true}
          />
          <div style={{ textAlign: "center" }}>
            <h3 style={styles.nome}>{perfilExibicao.nome_exibicao}</h3>
            {perfilExibicao.username && <p style={styles.username}>@{perfilExibicao.username}</p>}
            <span style={styles.tagNivel}>{nivel.titulo}</span>
          </div>
        </div>

        {/* Bio e Localização */}
        {(perfilExibicao.cidade || perfilExibicao.igreja || perfilExibicao.bio) && (
          <div style={styles.infoBox}>
            {perfilExibicao.bio && <p style={styles.bioText}>"{perfilExibicao.bio}"</p>}
            <div style={styles.locTags}>
              {perfilExibicao.cidade && <span>📍 {perfilExibicao.cidade}</span>}
              {perfilExibicao.igreja && <span>⛪ {perfilExibicao.igreja}</span>}
            </div>
          </div>
        )}

        {/* Amigos em Comum */}
        {amigosEmComum.total > 0 && (
          <div style={styles.mutuoBox}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={styles.avatarAvatarsStack}>
                {amigosEmComum.preview.map((m) => (
                  <div key={m.amigo_id} style={styles.avatarMiniStack}>
                    {m.foto_url ? (
                      <img src={m.foto_url} alt="" style={styles.avatarImgMini} />
                    ) : (
                      m.nome_exibicao?.slice(0, 2).toUpperCase() || "FI"
                    )}
                  </div>
                ))}
              </div>
              <span style={styles.mutuoText}>
                {amigosEmComum.total} {amigosEmComum.total === 1 ? "amigo em comum" : "amigos em comum"}
              </span>
            </div>
          </div>
        )}

        {/* Card de Estatísticas */}
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Ofensiva</span>
            <p style={styles.statValorAmber}>🔥 {perfilExibicao.ofensiva_atual ?? 0} dias</p>
          </div>
          <div style={styles.statBoxBorder}>
            <span style={styles.statLabel}>XP Acumulado</span>
            <p style={styles.statValorGreen}>⚡ {perfilExibicao.xp_total ?? 0} XP</p>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {mensagem && (
          <div style={mensagem.tipo === "sucesso" ? styles.sucessoBanner : styles.erroBanner}>
            {mensagem.texto}
          </div>
        )}

        {/* Ações baseadas no getRelationshipState */}
        <div style={styles.actionsBlock}>
          {estadoRelacionamento === "SELF" ? (
            <p style={styles.proprioTexto}>Este é o seu perfil de usuário.</p>
          ) : estadoRelacionamento === "BLOCKED_BY_ME" ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#B15A4A", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>
                🚫 Usuário bloqueado por você
              </p>
              <button style={styles.btnDesbloquear} disabled={processando} onClick={handleDesbloquear}>
                Desbloquear Usuário
              </button>
            </div>
          ) : estadoRelacionamento === "BLOCKED_BY_OTHER" ? (
            <p style={styles.proprioTexto}>Nenhuma interação social disponível.</p>
          ) : estadoRelacionamento === "FRIENDS" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={styles.amigosBadge}>
                <span>🤝 Vocês são amigos</span>
              </div>
              <button onClick={handleTorcer} disabled={processando} style={styles.torcerBtn}>
                🔥 Mandar Torcida
              </button>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button style={styles.btnRemoverLink} disabled={processando} onClick={handleCancelarOuRemover}>
                  Remover amizade
                </button>
                <button style={styles.btnBloquearLink} disabled={processando} onClick={handleBloquear}>
                  Bloquear
                </button>
              </div>
            </div>
          ) : estadoRelacionamento === "REQUEST_SENT" ? (
            <div style={{ textAlign: "center" }}>
              <div style={styles.solicitacaoEnviadaBadge}>
                <span>⌛ Solicitação de amizade enviada</span>
              </div>
              <button style={styles.btnCancelarLink} disabled={processando} onClick={handleCancelarOuRemover}>
                Cancelar solicitação
              </button>
            </div>
          ) : estadoRelacionamento === "REQUEST_RECEIVED" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.adicionarBtn} disabled={processando} onClick={handleAceitar}>
                ✅ Aceitar Pedido
              </button>
              <button style={styles.btnRecusar} disabled={processando} onClick={handleCancelarOuRemover}>
                Remover
              </button>
            </div>
          ) : (
            <button onClick={handleAdicionar} disabled={processando} style={styles.adicionarBtn}>
              ➕ Adicionar como Amigo
            </button>
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
    background: "rgba(30, 40, 32, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 24,
    maxWidth: 380,
    width: "100%",
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "transparent",
    border: "none",
    fontSize: 18,
    color: "#7A8A7F",
    cursor: "pointer",
    padding: 4,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  nome: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 2px",
  },
  username: {
    fontSize: 12.5,
    color: "#B98B4E",
    fontWeight: 700,
    margin: "0 0 6px",
  },
  tagNivel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#8A6224",
    background: "#F1E2C4",
    borderRadius: 999,
    padding: "3px 10px",
  },
  infoBox: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 12,
    padding: 10,
    textAlign: "center",
  },
  bioText: {
    fontSize: 12.5,
    color: "#4F6D5C",
    fontStyle: "italic",
    margin: "0 0 6px",
  },
  locTags: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    fontSize: 11.5,
    color: "#7A8A7F",
    fontWeight: 600,
  },
  mutuoBox: {
    background: "#F6EFE1",
    borderRadius: 10,
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mutuoText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8A6224",
  },
  avatarAvatarsStack: {
    display: "flex",
    alignItems: "center",
    marginRight: 6,
  },
  avatarMiniStack: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#B98B4E",
    color: "#FFF",
    fontSize: 9,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #FFF",
    marginLeft: -6,
    overflow: "hidden",
  },
  avatarImgMini: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "10px 12px",
  },
  statBox: { textAlign: "center" },
  statBoxBorder: { textAlign: "center", borderLeft: "1px solid #E7E0D0" },
  statLabel: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#7A8A7F" },
  statValorAmber: { fontSize: 14, fontWeight: 700, color: "#B98B4E", margin: "2px 0 0" },
  statValorGreen: { fontSize: 14, fontWeight: 700, color: "#3F7A4D", margin: "2px 0 0" },
  sucessoBanner: { background: "#DDE8DE", color: "#2D4C33", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: "center" },
  erroBanner: { background: "#FEF2F2", color: "#991B1B", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: "center" },
  actionsBlock: { marginTop: 4 },
  proprioTexto: { fontSize: 12, color: "#7A8A7F", fontStyle: "italic", textAlign: "center" },
  amigosBadge: { background: "#EAF4EC", color: "#3F7A4D", border: "1px solid #A8D5B5", borderRadius: 10, padding: "8px", fontSize: 12.5, fontWeight: 700, textAlign: "center" },
  solicitacaoEnviadaBadge: { background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: 10, padding: "8px", fontSize: 12.5, fontWeight: 700, textAlign: "center" },
  torcerBtn: { width: "100%", background: "#B98B4E", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  adicionarBtn: { width: "100%", background: "#3F7A4D", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnRecusar: { width: "100%", background: "#FFFFFF", color: "#5C7060", border: "1px solid #E7E0D0", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnDesbloquear: { background: "#B98B4E", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnRemoverLink: { flex: 1, background: "none", border: "none", color: "#B15A4A", fontSize: 11.5, cursor: "pointer", textDecoration: "underline" },
  btnBloquearLink: { flex: 1, background: "none", border: "none", color: "#7A8A7F", fontSize: 11.5, cursor: "pointer", textDecoration: "underline" },
  btnCancelarLink: { background: "none", border: "none", color: "#B15A4A", fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 6 },
};
