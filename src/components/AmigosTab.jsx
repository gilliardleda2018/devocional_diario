"use client";

import { useState } from "react";
import { useAmigos } from "@/src/lib/hooks/useAmigos";
import { useFeedAmigos } from "@/src/lib/hooks/useFeedAmigos";
import { useDesafios } from "@/src/lib/hooks/useDesafios";
import { useRankingAmigos } from "@/src/lib/hooks/useRankingAmigos";
import { MOODS } from "@/src/lib/devocional/versiculos";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import PerfilAmigoModal from "@/src/components/PerfilAmigoModal";

const SUBABAS = [
  { id: "feed", label: "Feed" },
  { id: "amigos", label: "Amigos" },
  { id: "desafios", label: "Desafios" },
  { id: "liga", label: "Liga" },
];

function formatarQuando(iso) {
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function rotuloMood(moodId) {
  return MOODS.find((m) => m.id === moodId)?.label ?? null;
}

export default function AmigosTab({ usuarioId }) {
  const [subaba, setSubaba] = useState("feed");
  const [amigoSelecionado, setAmigoSelecionado] = useState(null);

  const { amigos, enviarPedido, torcer } = useAmigos(usuarioId);

  return (
    <div style={styles.wrap}>
      <div style={styles.subtabRow}>
        {SUBABAS.map((s) => (
          <button
            key={s.id}
            className="tab-btn"
            style={subaba === s.id ? styles.subtabAtiva : styles.subtabInativa}
            onClick={() => setSubaba(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {subaba === "feed" && (
        <FeedAmigos
          usuarioId={usuarioId}
          irParaAmigos={() => setSubaba("amigos")}
          onAbrirPerfil={(item) => setAmigoSelecionado(item)}
        />
      )}
      {subaba === "amigos" && (
        <ListaAmigos
          usuarioId={usuarioId}
          onAbrirPerfil={(item) => setAmigoSelecionado(item)}
        />
      )}
      {subaba === "desafios" && <Desafios usuarioId={usuarioId} />}
      {subaba === "liga" && (
        <LigaAmigos
          usuarioId={usuarioId}
          onAbrirPerfil={(item) => setAmigoSelecionado(item)}
        />
      )}

      {/* Modal de perfil do amigo/usuário */}
      <PerfilAmigoModal
        aberto={!!amigoSelecionado}
        aoFechar={() => setAmigoSelecionado(null)}
        amigo={amigoSelecionado}
        usuarioAtualId={usuarioId}
        meusAmigos={amigos}
        aoAdicionar={enviarPedido}
        aoTorcer={torcer}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed dos Amigos em Tempo Real
// ---------------------------------------------------------------------------
function FeedAmigos({ usuarioId, irParaAmigos, onAbrirPerfil }) {
  const { feed, carregando, novoItemAlert } = useFeedAmigos(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando o feed...</p>;

  if (!feed.length) {
    return (
      <div style={styles.vazio}>
        <p style={styles.vazioTitulo}>Seu feed está quieto por aqui.</p>
        <p style={styles.vazioTexto}>Adicione amigos pra acompanhar as leituras e mandar torcidas em tempo real!</p>
        <button className="action-btn chunky" style={styles.primaryBtnPequeno} onClick={irParaAmigos}>
          Adicionar amigos
        </button>
      </div>
    );
  }

  return (
    <div style={styles.lista}>
      {novoItemAlert && (
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold text-center border border-amber-300 dark:border-amber-700 animate-pulse">
          ⚡ Nova atualização dos seus amigos em tempo real!
        </div>
      )}
      {feed.map((item, indice) => (
        <div key={indice} style={styles.feedCard}>
          <button
            onClick={() => onAbrirPerfil(item)}
            style={styles.avatarBtn}
            title={`Ver perfil de ${item.nome_exibicao}`}
          >
            <AvatarUsuario nome={item.nome_exibicao} fotoUrl={item.foto_url} tamanho={32} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {item.tipo === "torcida" ? (
              <p style={styles.feedTexto}>
                <strong
                  onClick={() => onAbrirPerfil(item)}
                  style={styles.nomeClicavel}
                  title="Ver perfil"
                >
                  {item.nome_exibicao}
                </strong>{" "}
                torceu por você! 🔥
              </p>
            ) : (
              <p style={styles.feedTexto}>
                <strong
                  onClick={() => onAbrirPerfil(item)}
                  style={styles.nomeClicavel}
                  title="Ver perfil"
                >
                  {item.nome_exibicao}
                </strong>{" "}
                completou o devocional de hoje
                {item.tema_oracao && ` · ${rotuloMood(item.tema_oracao) ?? item.tema_oracao}`}
                {item.referencia_versiculo && ` · ${item.referencia_versiculo}`}
                {item.ofensiva_atual > 0 && ` · 🔥 ${item.ofensiva_atual}`}
              </p>
            )}
            <p style={styles.feedQuando}>{formatarQuando(item.quando)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Amigos: meu código, pedidos pendentes, adicionar, lista
// ---------------------------------------------------------------------------
function ListaAmigos({ usuarioId, onAbrirPerfil }) {
  const { amigos, pedidos, meuCodigo, carregando, erro, enviarPedido, responderPedido, removerAmigo, torcer } =
    useAmigos(usuarioId);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(null);
  const [torcidaEnviada, setTorcidaEnviada] = useState({});

  async function handleAdicionar(e) {
    e.preventDefault();
    if (!codigoDigitado.trim()) return;
    setEnviando(true);
    setMensagem(null);
    const resultado = await enviarPedido(codigoDigitado.trim());
    setEnviando(false);
    if (resultado.sucesso) {
      setCodigoDigitado("");
      setMensagem({ tipo: "sucesso", texto: "Amigo adicionado com sucesso! 🎉" });
    } else {
      setMensagem({ tipo: "erro", texto: resultado.erro });
    }
  }

  async function handleTorcer(amigoId) {
    setTorcidaEnviada((prev) => ({ ...prev, [amigoId]: true }));
    const r = await torcer(amigoId);
    if (!r.sucesso) {
      alert(r.erro ?? "Você já torceu por essa pessoa hoje!");
    }
  }

  if (carregando) return <p style={styles.loadingText}>Carregando amigos...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Meu Código de Convite */}
      <div style={styles.card}>
        <p style={styles.cardLabel}>Seu código de amigo</p>
        <p style={styles.codigoGrande}>{meuCodigo ?? "------"}</p>
        <p style={styles.vazioTexto}>Compartilhe esse código pros seus amigos te adicionarem no app.</p>
        {meuCodigo && (
          <CompartilharBotoes
            texto={`Me adiciona no app Devocional Diário! Meu código de amigo é ${meuCodigo}`}
            referencia="Conecte-se comigo no Devocional"
          />
        )}
      </div>

      {/* Adicionar amigo por código */}
      <div>
        <h2 style={styles.sectionTitle}>Adicionar novo amigo</h2>
        <form onSubmit={handleAdicionar} style={styles.formLinha}>
          <input
            type="text"
            placeholder="Cole o código do amigo (ex: ABC12345)"
            value={codigoDigitado}
            onChange={(e) => setCodigoDigitado(e.target.value.toUpperCase())}
            style={styles.input}
          />
          <button
            type="submit"
            className="action-btn chunky"
            style={styles.primaryBtnPequeno}
            disabled={enviando}
          >
            {enviando ? "..." : "Adicionar"}
          </button>
        </form>
        {mensagem && (
          <p style={{ ...styles.mensagem, color: mensagem.tipo === "sucesso" ? "#3F7A4D" : "#B15A4A" }}>
            {mensagem.texto}
          </p>
        )}
        {erro && <p style={{ ...styles.mensagem, color: "#B15A4A" }}>{erro}</p>}
      </div>

      {/* Pedidos Pendentes */}
      {pedidos.length > 0 && (
        <div>
          <h2 style={styles.sectionTitle}>Pedidos pendentes ({pedidos.length})</h2>
          <div style={styles.lista}>
            {pedidos.map((p) => (
              <div key={p.amizade_id} style={styles.pedidoCard}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => onAbrirPerfil(p)}
                >
                  <AvatarUsuario nome={p.nome_exibicao} fotoUrl={p.foto_url} tamanho={32} />
                  <span style={styles.pedidoNome}>{p.nome_exibicao}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="action-btn chunky"
                    style={styles.aceitarBtn}
                    onClick={() => responderPedido(p.amizade_id, true)}
                  >
                    Aceitar
                  </button>
                  <button
                    className="action-btn"
                    style={styles.recusarBtn}
                    onClick={() => responderPedido(p.amizade_id, false)}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Amigos */}
      <div>
        <h2 style={styles.sectionTitle}>Seus amigos ({amigos.length})</h2>
        {amigos.length === 0 ? (
          <p style={styles.vazioTexto}>Você ainda não tem amigos por aqui. Compartilhe seu código!</p>
        ) : (
          <div style={styles.lista}>
            {amigos.map((amigo) => (
              <div key={amigo.amizade_id} style={styles.amigoCard}>
                <button
                  onClick={() => onAbrirPerfil(amigo)}
                  style={styles.avatarBtn}
                  title={`Ver perfil de ${amigo.nome_exibicao}`}
                >
                  <AvatarUsuario nome={amigo.nome_exibicao} fotoUrl={amigo.foto_url} tamanho={34} />
                </button>
                <div
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => onAbrirPerfil(amigo)}
                >
                  <p style={styles.pedidoNome}>{amigo.nome_exibicao}</p>
                  <p style={styles.feedQuando}>🔥 {amigo.ofensiva_atual} dias · recorde {amigo.maior_ofensiva}</p>
                </div>
                <button
                  className="action-btn chunky"
                  style={styles.torcerBtn}
                  disabled={!!torcidaEnviada[amigo.amigo_id]}
                  onClick={() => handleTorcer(amigo.amigo_id)}
                >
                  {torcidaEnviada[amigo.amigo_id] ? "🔥 Torceu!" : "🔥 Torcer"}
                </button>
                {confirmandoRemocao === amigo.amizade_id ? (
                  <button
                    className="action-btn"
                    style={{ ...styles.recusarBtn, fontSize: 11 }}
                    onClick={async () => {
                      await removerAmigo(amigo.amizade_id);
                      setConfirmandoRemocao(null);
                    }}
                  >
                    Confirmar?
                  </button>
                ) : (
                  <button
                    className="action-btn"
                    style={styles.linkBtnPequeno}
                    title="Remover amigo"
                    onClick={() => setConfirmandoRemocao(amigo.amizade_id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desafios entre Amigos
// ---------------------------------------------------------------------------
function Desafios({ usuarioId }) {
  const { desafios, concluidos, carregando } = useDesafios(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando desafios...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={styles.sectionTitle}>Desafios ativos ({desafios.length})</h2>
      {desafios.length === 0 ? (
        <p style={styles.vazioTexto}>Adicione mais amigos pra desbloquear os desafios em dupla!</p>
      ) : (
        desafios.map((d) => (
          <div key={d.id} style={styles.desafioCard}>
            <div style={styles.desafioTopo}>
              <strong style={{ fontSize: 14, color: "#33422F" }}>{d.titulo}</strong>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.completo ? "#3F7A4D" : "#B98B4E" }}>
                {d.completo ? "✓ Concluído!" : `+${d.xp_recompensa} XP`}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#606F63", margin: "4px 0 8px" }}>{d.descricao}</p>
            <div style={styles.barraFundo}>
              <div style={{ ...styles.barraProgresso, width: `${Math.min(100, Math.round((d.progresso / d.meta) * 100))}%` }} />
            </div>
            <p style={{ fontSize: 11, color: "#8A9184", margin: "6px 0 0", textAlign: "right" }}>
              {d.progresso} / {d.meta}
            </p>
          </div>
        ))
      )}

      {concluidos.length > 0 && (
        <>
          <h2 style={{ ...styles.sectionTitle, marginTop: 12 }}>Concluídos ({concluidos.length})</h2>
          {concluidos.map((d) => (
            <div key={d.id} style={{ ...styles.desafioCard, opacity: 0.75 }}>
              <div style={styles.desafioTopo}>
                <span style={{ fontSize: 14, color: "#33422F", textDecoration: "line-through" }}>{d.titulo}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#3F7A4D" }}>✓ Concluído</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Liga de Amigos / Ranking Semanal
// ---------------------------------------------------------------------------
function LigaAmigos({ usuarioId, onAbrirPerfil }) {
  const { ranking, carregando } = useRankingAmigos(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando ranking...</p>;

  if (ranking.length <= 1) {
    return <p style={styles.vazioTexto}>Adicione amigos pra formar sua liga.</p>;
  }

  return (
    <div style={styles.rankingCard}>
      {ranking.map((r) => (
        <div key={`${r.posicao}-${r.nome_exibicao}`} style={{ ...styles.rankingRow, ...(r.sou_eu ? styles.rankingRowEu : {}) }}>
          <span style={styles.rankingPosicao}>#{r.posicao}</span>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, cursor: "pointer" }}
            onClick={() => onAbrirPerfil(r)}
          >
            <AvatarUsuario nome={r.nome_exibicao} fotoUrl={r.foto_url} tamanho={28} />
            <span style={styles.rankingNome}>{r.nome_exibicao}</span>
          </div>
          <span style={styles.rankingXp}>{r.xp_total} XP</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: { textAlign: "left" },
  subtabRow: {
    display: "flex",
    gap: 6,
    background: "#F1EAD6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  subtabAtiva: {
    flex: 1,
    minWidth: 70,
    padding: "8px 10px",
    borderRadius: 9,
    border: "none",
    background: "#FFFFFF",
    color: "#33422F",
    fontWeight: 700,
    fontSize: 12.5,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(80,70,40,0.08)",
  },
  subtabInativa: {
    flex: 1,
    minWidth: 70,
    padding: "8px 10px",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    color: "#8A8069",
    fontWeight: 600,
    fontSize: 12.5,
    cursor: "pointer",
  },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "18px 18px 20px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#B98B4E",
    fontWeight: 700,
    margin: "0 0 10px",
  },
  codigoGrande: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 600,
    fontSize: 30,
    letterSpacing: 3,
    color: "#33422F",
    margin: "0 0 6px",
  },
  vazioTexto: { fontSize: 12.5, color: "#7A8A7F", margin: "0 0 10px" },
  vazio: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "26px 20px",
    textAlign: "center",
  },
  vazioTitulo: { fontSize: 15, fontWeight: 700, color: "#33422F", margin: "0 0 6px" },
  loadingText: { fontSize: 13, color: "#9AA79C", fontStyle: "italic" },
  sectionTitle: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 18,
    margin: "0 0 12px",
    color: "#33422F",
  },
  formLinha: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    fontSize: 13.5,
    background: "#FFFFFF",
    color: "#33422F",
  },
  primaryBtnPequeno: {
    flexShrink: 0,
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  mensagem: { fontSize: 12.5, fontWeight: 600, margin: "10px 0 0" },
  lista: { display: "flex", flexDirection: "column", gap: 10 },
  feedCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px 14px",
  },
  avatarBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  nomeClicavel: {
    cursor: "pointer",
    color: "#2D3B33",
    textDecoration: "underline text-decoration-color: #B98B4E",
  },
  feedTexto: { fontSize: 13, color: "#3C4A3F", margin: 0, lineHeight: 1.4 },
  feedQuando: { fontSize: 11, color: "#9AA79C", fontWeight: 600, margin: "4px 0 0" },
  pedidoCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#FFFDF7",
    border: "1px solid #F0DFAF",
    borderRadius: 14,
    padding: "10px 14px",
  },
  pedidoNome: { fontSize: 13.5, fontWeight: 700, color: "#33422F", margin: 0 },
  aceitarBtn: {
    background: "linear-gradient(180deg, #8FCB9A 0%, #4F9463 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "2px solid #35704A",
    borderRadius: 9,
    padding: "7px 12px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  recusarBtn: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 9,
    padding: "7px 12px",
    fontWeight: 700,
    fontSize: 12,
    color: "#8A3A26",
    cursor: "pointer",
  },
  amigoCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "10px 14px",
  },
  torcerBtn: {
    flexShrink: 0,
    background: "linear-gradient(180deg, #F2A65A 0%, #E08428 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "2px solid #A85E10",
    borderRadius: 9,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  linkBtnPequeno: {
    background: "transparent",
    border: "none",
    color: "#9AA79C",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    padding: "6px 8px",
  },
  desafioCard: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px 14px",
  },
  desafioTopo: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" },
  barraFundo: { height: 7, borderRadius: 999, background: "#EFEAD9", overflow: "hidden", marginTop: 3 },
  barraProgresso: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #D9A94C, #B98B4E)",
    transition: "width 0.4s ease",
  },
  rankingCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    overflow: "hidden",
  },
  rankingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderBottom: "1px solid #F1EEE3",
    fontSize: 13.5,
  },
  rankingRowEu: { background: "#F1E2C4", fontWeight: 700 },
  rankingPosicao: { width: 32, color: "#B98B4E", fontWeight: 700 },
  rankingNome: { flex: 1, color: "#2D3B33", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rankingXp: { color: "#7A8A7F", fontWeight: 700 },
};
