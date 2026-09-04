"use client";

import { useState, useEffect } from "react";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import { obterNivel } from "@/src/lib/devocional/niveis";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

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
  const [carregando, setCarregando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [torcendo, setTorcendo] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const amigoId = amigo?.candidate_id || amigo?.usuario_id || amigo?.amigo_id || amigo?.autor_id || amigo?.id;
  const ehProprioUsuario = usuarioAtualId && amigoId === usuarioAtualId;
  const ehAmigo = (meusAmigos || []).some(
    (a) => a.amigo_id === amigoId || a.id === amigoId || a.usuario_id === amigoId
  );

  useEffect(() => {
    if (!aberto || !amigoId) return;

    async function carregarDetalhes() {
      setCarregando(true);
      setMensagem(null);
      try {
        const supabase = criarClienteSupabase();
        const [{ data: profile }, { data: stats }, { data: ofensiva }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", amigoId).maybeSingle(),
          supabase.from("estatisticas_usuario").select("*").eq("usuario_id", amigoId).maybeSingle(),
          supabase.from("ofensivas").select("*").eq("usuario_id", amigoId).maybeSingle(),
        ]);

        setDetalhes({
          id: amigoId,
          nome_exibicao: profile?.nome_exibicao || amigo?.nome_exibicao || "Irmão em Fé",
          foto_url: profile?.foto_url || amigo?.foto_url || null,
          codigo_amigo: profile?.codigo_amigo || amigo?.codigo_amigo || null,
          xp_total: stats?.xp_total || amigo?.xp_total || 0,
          devocionais_concluidos: stats?.devocionais_concluidos || amigo?.devocionais_concluidos || 0,
          ofensiva_atual: ofensiva?.ofensiva_atual || amigo?.ofensiva_atual || 0,
          maior_ofensiva: ofensiva?.maior_ofensiva || amigo?.maior_ofensiva || 0,
        });
      } catch (err) {
        console.error("Erro ao carregar detalhes do perfil:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDetalhes();
  }, [aberto, amigoId, amigo]);

  if (!aberto || !amigo) return null;

  const perfilExibicao = detalhes || amigo;
  const nivel = obterNivel(perfilExibicao?.xp_total || 0);

  async function handleAdicionar() {
    const identificador = perfilExibicao?.codigo_amigo || amigoId || perfilExibicao?.id;
    if (!aoAdicionar || !identificador) return;
    setAdicionando(true);
    setMensagem(null);
    try {
      const res = await aoAdicionar(identificador);
      if (res?.sucesso !== false) {
        setMensagem({ tipo: "sucesso", texto: "Solicitação enviada com sucesso! 🎉" });
      } else {
        setMensagem({ tipo: "erro", texto: res?.erro || "Não foi possível adicionar." });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao enviar solicitação." });
    } finally {
      setAdicionando(false);
    }
  }

  async function handleTorcer() {
    if (!aoTorcer || !amigoId) return;
    setTorcendo(true);
    setMensagem(null);
    try {
      const res = await aoTorcer(amigoId);
      if (res?.sucesso !== false) {
        setMensagem({ tipo: "sucesso", texto: "Torcida enviada com sucesso! 🔥" });
      } else {
        setMensagem({ tipo: "erro", texto: res?.erro || "Você já enviou uma torcida hoje!" });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao enviar torcida." });
    } finally {
      setTorcendo(false);
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
            <span style={styles.tagNivel}>{nivel.titulo}</span>
          </div>
        </div>

        {/* Card de Estatísticas */}
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Ofensiva</span>
            <p style={styles.statValorAmber}>
              🔥 {perfilExibicao.ofensiva_atual ?? 0} <span style={styles.statUnit}>dias</span>
            </p>
          </div>
          <div style={styles.statBoxBorder}>
            <span style={styles.statLabel}>XP Acumulado</span>
            <p style={styles.statValorGreen}>
              ⚡ {perfilExibicao.xp_total ?? 0} XP
            </p>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {mensagem && (
          <div
            style={mensagem.tipo === "sucesso" ? styles.sucessoBanner : styles.erroBanner}
          >
            {mensagem.texto}
          </div>
        )}

        {/* Ações */}
        <div style={styles.actionsBlock}>
          {ehProprioUsuario ? (
            <p style={styles.proprioTexto}>Este é o seu perfil de usuário.</p>
          ) : ehAmigo ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={styles.amigosBadge}>
                <span>✓ Vocês são amigos</span>
              </div>
              <button
                onClick={handleTorcer}
                disabled={torcendo}
                className="action-btn chunky"
                style={styles.torcerBtn}
              >
                <span>🔥</span> {torcendo ? "Enviando..." : "Mandar Torcida"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdicionar}
              disabled={adicionando}
              className="action-btn chunky"
              style={styles.adicionarBtn}
            >
              <span>➕</span> {adicionando ? "Enviando..." : "Adicionar como Amigo"}
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
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 24,
    maxWidth: 400,
    width: "100%",
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 16,
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
    gap: 10,
    paddingTop: 8,
  },
  nome: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 2px",
  },
  tagNivel: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#8A6224",
    background: "#F1E2C4",
    borderRadius: 999,
    padding: "3px 10px",
    display: "inline-block",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "12px 14px",
  },
  statBox: {
    textAlign: "center",
  },
  statBoxBorder: {
    textAlign: "center",
    borderLeft: "1px solid #E7E0D0",
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#7A8A7F",
    display: "block",
  },
  statValorAmber: {
    fontSize: 15,
    fontWeight: 700,
    color: "#B98B4E",
    margin: "4px 0 0",
  },
  statValorGreen: {
    fontSize: 15,
    fontWeight: 700,
    color: "#3F7A4D",
    margin: "4px 0 0",
  },
  statUnit: {
    fontSize: 11,
    fontWeight: 500,
    color: "#7A8A7F",
  },
  sucessoBanner: {
    background: "#DDE8DE",
    color: "#2D4C33",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    textAlign: "center",
  },
  erroBanner: {
    background: "#FEF2F2",
    color: "#991B1B",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    textAlign: "center",
  },
  actionsBlock: {
    marginTop: 4,
  },
  proprioTexto: {
    fontSize: 12,
    color: "#7A8A7F",
    fontStyle: "italic",
    textAlign: "center",
  },
  amigosBadge: {
    background: "#EAF4EC",
    color: "#3F7A4D",
    border: "1px solid #A8D5B5",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 12.5,
    fontWeight: 700,
    textAlign: "center",
  },
  torcerBtn: {
    width: "100%",
    background: "linear-gradient(180deg, #D9A94C 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 12,
    padding: "10px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  adicionarBtn: {
    width: "100%",
    background: "linear-gradient(180deg, #8FCB9A 0%, #4F9463 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #35704A",
    borderRadius: 12,
    padding: "10px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
};
