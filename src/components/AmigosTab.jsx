"use client";

import { useState } from "react";
import { useAmigos } from "@/src/lib/hooks/useAmigos";
import { useFeedAmigos } from "@/src/lib/hooks/useFeedAmigos";
import { useDesafios } from "@/src/lib/hooks/useDesafios";
import { useRankingAmigos } from "@/src/lib/hooks/useRankingAmigos";
import { MOODS } from "@/src/lib/devocional/versiculos";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";

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

      {subaba === "feed" && <FeedAmigos usuarioId={usuarioId} irParaAmigos={() => setSubaba("amigos")} />}
      {subaba === "amigos" && <ListaAmigos usuarioId={usuarioId} />}
      {subaba === "desafios" && <Desafios usuarioId={usuarioId} />}
      {subaba === "liga" && <LigaAmigos usuarioId={usuarioId} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
function FeedAmigos({ usuarioId, irParaAmigos }) {
  const { feed, carregando } = useFeedAmigos(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando...</p>;

  if (!feed.length) {
    return (
      <div style={styles.vazio}>
        <p style={styles.vazioTitulo}>Seu feed está quieto por aqui.</p>
        <p style={styles.vazioTexto}>Adicione amigos pra ver o devocional deles e torcer por eles.</p>
        <button className="action-btn chunky" style={styles.primaryBtnPequeno} onClick={irParaAmigos}>
          Adicionar amigos
        </button>
      </div>
    );
  }

  return (
    <div style={styles.lista}>
      {feed.map((item, indice) => (
        <div key={indice} style={styles.feedCard}>
          <span style={styles.feedIcone}>{item.tipo === "torcida" ? "🔥" : "📖"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {item.tipo === "torcida" ? (
              <p style={styles.feedTexto}>
                <strong>{item.nome_exibicao}</strong> torceu por você!
              </p>
            ) : (
              <p style={styles.feedTexto}>
                <strong>{item.nome_exibicao}</strong> completou o devocional de hoje
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
function ListaAmigos({ usuarioId }) {
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
      setMensagem({ tipo: "sucesso", texto: "Pedido enviado!" });
    } else {
      setMensagem({ tipo: "erro", texto: resultado.erro });
    }
  }

  async function handleTorcer(amigoId) {
    const resultado = await torcer(amigoId);
    if (resultado.sucesso) {
      setTorcidaEnviada((atual) => ({ ...atual, [amigoId]: true }));
    } else {
      setMensagem({ tipo: "erro", texto: resultado.erro });
    }
  }

  return (
    <div>
      <div style={styles.card}>
        <p style={styles.cardLabel}>Seu código de amigo</p>
        <p style={styles.codigoGrande}>{meuCodigo ?? "..."}</p>
        <p style={styles.vazioTexto}>Compartilhe esse código com quem você quiser adicionar.</p>
        {meuCodigo && (
          <CompartilharBotoes compact texto={`Vamos ser amigos no Devocional Diário! Meu código: ${meuCodigo}`} />
        )}
      </div>

      <div style={{ ...styles.card, marginTop: 16 }}>
        <p style={styles.cardLabel}>Adicionar amigo</p>
        <form onSubmit={handleAdicionar} style={styles.formLinha}>
          <input
            type="text"
            value={codigoDigitado}
            onChange={(e) => setCodigoDigitado(e.target.value.toUpperCase())}
            placeholder="Código do amigo"
            style={styles.input}
            maxLength={6}
          />
          <button type="submit" className="action-btn chunky" style={styles.primaryBtnPequeno} disabled={enviando}>
            {enviando ? "..." : "Adicionar"}
          </button>
        </form>
        {mensagem && (
          <p style={{ ...styles.mensagem, color: mensagem.tipo === "erro" ? "#8A3A26" : "#2E5B37" }}>
            {mensagem.texto}
          </p>
        )}
      </div>

      {pedidos.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.sectionTitle}>Pedidos pendentes</h2>
          <div style={styles.lista}>
            {pedidos.map((p) => (
              <div key={p.amizade_id} style={styles.pedidoCard}>
                <span style={styles.pedidoNome}>{p.nome_exibicao}</span>
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

      <div style={{ marginTop: 20 }}>
        <h2 style={styles.sectionTitle}>Seus amigos {!carregando && `(${amigos.length})`}</h2>
        {carregando ? (
          <p style={styles.loadingText}>Carregando...</p>
        ) : amigos.length === 0 ? (
          <p style={styles.vazioTexto}>Você ainda não tem amigos por aqui. Compartilhe seu código!</p>
        ) : (
          <div style={styles.lista}>
            {amigos.map((amigo) => (
              <div key={amigo.amizade_id} style={styles.amigoCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.pedidoNome}>{amigo.nome_exibicao}</p>
                  <p style={styles.feedQuando}>🔥 {amigo.ofensiva_atual} dias · recorde {amigo.maior_ofensiva}</p>
                </div>
                <button
                  className="action-btn chunky"
                  style={styles.torcerBtn}
                  disabled={!!torcidaEnviada[amigo.amigo_id]}
                  onClick={() => handleTorcer(amigo.amigo_id)}
                >
                  {torcidaEnviada[amigo.amigo_id] ? "Torcido! ✓" : "🔥 Torcer"}
                </button>
                {confirmandoRemocao === amigo.amizade_id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="action-btn"
                      style={styles.recusarBtn}
                      onClick={() => {
                        removerAmigo(amigo.amizade_id);
                        setConfirmandoRemocao(null);
                      }}
                    >
                      Confirmar
                    </button>
                    <button className="action-btn" style={styles.linkBtnPequeno} onClick={() => setConfirmandoRemocao(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="action-btn"
                    style={styles.linkBtnPequeno}
                    title="Desfazer amizade"
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
// Desafios
// ---------------------------------------------------------------------------
function Desafios({ usuarioId }) {
  const { desafios, carregando, criarDesafio, entrarNoDesafio, sairDoDesafio, obterProgresso } = useDesafios(usuarioId);
  const [titulo, setTitulo] = useState("");
  const [metaDias, setMetaDias] = useState(7);
  const [codigoDesafio, setCodigoDesafio] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [progressos, setProgressos] = useState({});

  async function handleCriar(e) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const resultado = await criarDesafio(titulo.trim(), Number(metaDias));
    if (resultado.sucesso) {
      setTitulo("");
      setMensagem({ tipo: "sucesso", texto: "Desafio criado!" });
    } else {
      setMensagem({ tipo: "erro", texto: resultado.erro });
    }
  }

  async function handleEntrar(e) {
    e.preventDefault();
    if (!codigoDesafio.trim()) return;
    const resultado = await entrarNoDesafio(codigoDesafio.trim());
    if (resultado.sucesso) {
      setCodigoDesafio("");
      setMensagem({ tipo: "sucesso", texto: "Você entrou no desafio!" });
    } else {
      setMensagem({ tipo: "erro", texto: resultado.erro });
    }
  }

  async function toggleExpandir(desafioId) {
    if (expandido === desafioId) {
      setExpandido(null);
      return;
    }
    setExpandido(desafioId);
    if (!progressos[desafioId]) {
      const { dados } = await obterProgresso(desafioId);
      setProgressos((atual) => ({ ...atual, [desafioId]: dados }));
    }
  }

  return (
    <div>
      <div style={styles.card}>
        <p style={styles.cardLabel}>Criar desafio</p>
        <form onSubmit={handleCriar} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: 7 dias seguidos de devocional"
            style={styles.input}
            maxLength={80}
          />
          <div style={styles.formLinha}>
            <input
              type="number"
              min={1}
              max={90}
              value={metaDias}
              onChange={(e) => setMetaDias(e.target.value)}
              style={{ ...styles.input, maxWidth: 90 }}
            />
            <span style={styles.vazioTexto}>dias de meta</span>
            <button type="submit" className="action-btn chunky" style={styles.primaryBtnPequeno}>
              Criar
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.card, marginTop: 16 }}>
        <p style={styles.cardLabel}>Entrar em um desafio</p>
        <form onSubmit={handleEntrar} style={styles.formLinha}>
          <input
            type="text"
            value={codigoDesafio}
            onChange={(e) => setCodigoDesafio(e.target.value)}
            placeholder="Cole o código que seu amigo mandou"
            style={styles.input}
          />
          <button type="submit" className="action-btn chunky" style={styles.primaryBtnPequeno}>
            Entrar
          </button>
        </form>
        {mensagem && (
          <p style={{ ...styles.mensagem, color: mensagem.tipo === "erro" ? "#8A3A26" : "#2E5B37" }}>
            {mensagem.texto}
          </p>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h2 style={styles.sectionTitle}>Seus desafios</h2>
        {carregando ? (
          <p style={styles.loadingText}>Carregando...</p>
        ) : desafios.length === 0 ? (
          <p style={styles.vazioTexto}>Nenhum desafio ainda -- crie um ou entre com o código de um amigo.</p>
        ) : (
          <div style={styles.lista}>
            {desafios.map((d) => (
              <div key={d.desafio_id} style={styles.desafioCard}>
                <div style={styles.desafioTopo} onClick={() => toggleExpandir(d.desafio_id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.pedidoNome}>{d.titulo}</p>
                    <p style={styles.feedQuando}>
                      Meta: {d.meta_dias} dias · {d.total_participantes} participante(s) · até{" "}
                      {new Date(d.data_fim).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span style={styles.vazioTexto}>{expandido === d.desafio_id ? "▲" : "▼"}</span>
                </div>

                {expandido === d.desafio_id && (
                  <div style={{ marginTop: 12 }}>
                    {(progressos[d.desafio_id] ?? []).map((p) => (
                      <div key={p.user_id} style={{ marginBottom: 8 }}>
                        <p style={styles.feedQuando}>
                          {p.sou_eu ? "Você" : p.nome_exibicao} · {p.dias_completados}/{p.meta_dias}
                        </p>
                        <div style={styles.barraFundo}>
                          <div
                            style={{
                              ...styles.barraProgresso,
                              width: `${Math.min(100, Math.round((p.dias_completados / p.meta_dias) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <CompartilharBotoes
                        compact
                        texto={`🏆 Topa o desafio "${d.titulo}" comigo? Entra no Devocional Diário e usa esse código pra participar: ${d.desafio_id}`}
                      />
                      <button className="action-btn" style={styles.linkBtnPequeno} onClick={() => sairDoDesafio(d.desafio_id)}>
                        Sair do desafio
                      </button>
                    </div>
                  </div>
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
// Liga entre amigos
// ---------------------------------------------------------------------------
function LigaAmigos({ usuarioId }) {
  const { ranking, carregando } = useRankingAmigos(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando...</p>;

  if (ranking.length <= 1) {
    return <p style={styles.vazioTexto}>Adicione amigos pra formar sua liga.</p>;
  }

  return (
    <div style={styles.rankingCard}>
      {ranking.map((r) => (
        <div key={`${r.posicao}-${r.nome_exibicao}`} style={{ ...styles.rankingRow, ...(r.sou_eu ? styles.rankingRowEu : {}) }}>
          <span style={styles.rankingPosicao}>#{r.posicao}</span>
          <span style={styles.rankingNome}>{r.nome_exibicao}</span>
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
    gap: 12,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px 14px",
  },
  feedIcone: { fontSize: 20, flexShrink: 0 },
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
