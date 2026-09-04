"use client";

import { useState, useEffect } from "react";
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
// Amigos: Convites WhatsApp + Busca por Nome + Pedidos Pendentes + Lista
// ---------------------------------------------------------------------------
function ListaAmigos({ usuarioId, onAbrirPerfil }) {
  const {
    amigos,
    pedidos,
    meuCodigo,
    carregando,
    erro,
    recarregar,
    buscarPessoasPorNome,
    enviarPedido,
    responderPedido,
    removerAmigo,
    torcer,
  } = useAmigos(usuarioId);

  const [buscaNome, setBuscaNome] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [adicionandoId, setAdicionandoId] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(null);
  const [torcidaEnviada, setTorcidaEnviada] = useState({});

  // Busca em tempo real conforme digita o nome
  useEffect(() => {
    if (!buscaNome.trim() || buscaNome.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      const res = await buscarPessoasPorNome(buscaNome.trim());
      setResultadosBusca(res);
      setBuscando(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaNome, buscarPessoasPorNome]);

  async function handleAdicionarPorCodigo(codigo) {
    setAdicionandoId(codigo);
    setMensagem(null);
    const resultado = await enviarPedido(codigo);
    setAdicionandoId(null);
    if (resultado.sucesso) {
      setMensagem({ tipo: "sucesso", texto: "Amigo adicionado com sucesso! 🎉" });
      setBuscaNome("");
      setResultadosBusca([]);
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

  const mensagemWhatsapp = `Olá! Baixei o app Devocional Diário para minhas leituras e orações bíblicas. Venha acompanhar meus devocionais e torcer comigo! 📖✨ Acesse aqui: https://main.d357ab4gel6chc.amplifyapp.com`;

  if (carregando) return <p style={styles.loadingText}>Carregando amigos...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 🟢 CARD PRINCIPAL DE DESTAQUE: Conectar via WhatsApp */}
      <div style={styles.whatsappCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>💬</span>
          <div>
            <h3 style={styles.whatsappTitulo}>Conectar Amigos do WhatsApp</h3>
            <p style={styles.whatsappSubtitulo}>
              Envie um convite direto pelo WhatsApp e conecte-se com seus contatos em 1 clique!
            </p>
          </div>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensagemWhatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.whatsappBtn}
          className="action-btn chunky"
        >
          <span>📲 Abrir WhatsApp e Convidar Contatos</span>
        </a>
      </div>

      {/* 🔍 BUSCA DIRETA POR NOME (SEM CÓDIGO) */}
      <div>
        <h2 style={styles.sectionTitle}>Buscar amigos pelo nome</h2>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Digite o nome do seu amigo (ex: Gilliard, Maria...)"
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            style={styles.inputBuscaNome}
          />
          {buscando && <span style={styles.spinnerBusca}>🔍...</span>}
        </div>

        {/* Resultados da busca por nome */}
        {resultadosBusca.length > 0 && (
          <div style={styles.resultadosContainer}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8A9184", margin: "0 0 6px" }}>
              Pessoas encontradas:
            </p>
            {resultadosBusca.map((pessoa) => {
              const ehAmigo = amigos.some((a) => a.amigo_id === pessoa.id || a.id === pessoa.id);
              return (
                <div key={pessoa.id} style={styles.resultadoItem}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}
                    onClick={() => onAbrirPerfil(pessoa)}
                  >
                    <AvatarUsuario nome={pessoa.nome_exibicao} fotoUrl={pessoa.foto_url} tamanho={32} />
                    <span style={styles.resultadoNome}>{pessoa.nome_exibicao}</span>
                  </div>
                  {ehAmigo ? (
                    <span style={{ fontSize: 12, color: "#3F7A4D", fontWeight: 700 }}>✓ Já é amigo</span>
                  ) : (
                    <button
                      className="action-btn chunky"
                      style={styles.aceitarBtn}
                      disabled={adicionandoId === pessoa.codigo_amigo}
                      onClick={() => handleAdicionarPorCodigo(pessoa.codigo_amigo)}
                    >
                      {adicionandoId === pessoa.codigo_amigo ? "..." : "➕ Adicionar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {mensagem && (
          <p style={{ ...styles.mensagem, color: mensagem.tipo === "sucesso" ? "#3F7A4D" : "#B15A4A" }}>
            {mensagem.texto}
          </p>
        )}
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

      {/* Lista de Amigos Conectados */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={styles.sectionTitle}>Seus amigos ({amigos.length})</h2>
          <button
            onClick={recarregar}
            style={styles.refreshBtn}
            title="Atualizar lista de amigos"
          >
            🔄 Atualizar
          </button>
        </div>
        {amigos.length === 0 ? (
          <p style={styles.vazioTexto}>Você ainda não tem amigos conectados. Convide seus contatos do WhatsApp!</p>
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
  const { desafios = [], concluidos = [], carregando } = useDesafios(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando desafios...</p>;

  const listaAtivos = desafios || [];
  const listaConcluidos = concluidos || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={styles.sectionTitle}>Desafios Ativos ({listaAtivos.length})</h2>
      {listaAtivos.length === 0 ? (
        <p style={styles.vazioTexto}>Adicione mais amigos para desbloquear desafios em grupo ou complete os devocionais do dia!</p>
      ) : (
        listaAtivos.map((d) => (
          <div key={d.id} style={styles.desafioCard}>
            <div style={styles.desafioTopo}>
              <strong style={{ fontSize: 14, color: "#33422F" }}>{d.titulo}</strong>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.completo ? "#3F7A4D" : "#B98B4E" }}>
                {d.completo ? "✓ Concluído!" : `+${d.xp_recompensa || 50} XP`}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#606F63", margin: "4px 0 8px" }}>{d.descricao}</p>
            <div style={styles.barraFundo}>
              <div style={{ ...styles.barraProgresso, width: `${Math.min(100, Math.round(((d.progresso || 0) / (d.meta || 1)) * 100))}%` }} />
            </div>
            <p style={{ fontSize: 11, color: "#8A9184", margin: "6px 0 0", textAlign: "right" }}>
              {d.progresso || 0} / {d.meta || 1}
            </p>
          </div>
        ))
      )}

      {listaConcluidos.length > 0 && (
        <>
          <h2 style={{ ...styles.sectionTitle, marginTop: 12 }}>Desafios Concluídos ({listaConcluidos.length})</h2>
          {listaConcluidos.map((d) => (
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
  whatsappCard: {
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    borderRadius: 18,
    padding: "18px",
    boxShadow: "0 6px 18px rgba(37, 211, 102, 0.25)",
  },
  whatsappTitulo: {
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 2px",
    color: "#FFFFFF",
  },
  whatsappSubtitulo: {
    fontSize: 12.5,
    opacity: 0.9,
    margin: 0,
    lineHeight: 1.35,
  },
  whatsappBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px",
    borderRadius: 12,
    background: "#FFFFFF",
    color: "#075E54",
    fontWeight: 800,
    fontSize: 13.5,
    textDecoration: "none",
    marginTop: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    boxSizing: "border-box",
  },
  inputBuscaNome: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    fontSize: 13.5,
    color: "#33422F",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
  },
  spinnerBusca: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12,
    color: "#8A9184",
  },
  resultadosContainer: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px",
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  resultadoItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    background: "#FFFFFF",
    border: "1px solid #F1EEE3",
    borderRadius: 10,
  },
  resultadoNome: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#33422F",
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
  refreshBtn: {
    background: "#FBF9F3",
    color: "#8A6224",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "4px 10px",
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
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
