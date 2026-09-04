"use client";

import { useState, useEffect } from "react";
import { useAmigos } from "@/src/lib/hooks/useAmigos";
import { useFeedAmigos } from "@/src/lib/hooks/useFeedAmigos";
import { useDesafios } from "@/src/lib/hooks/useDesafios";
import { useRankingAmigos } from "@/src/lib/hooks/useRankingAmigos";
import { MOODS } from "@/src/lib/devocional/versiculos";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import PerfilAmigoModal from "@/src/components/PerfilAmigoModal";

const SUBABAS_PRINCIPAIS = [
  { id: "feed", label: "Feed" },
  { id: "conexoes", label: "Conexões" },
  { id: "desafios", label: "Desafios" },
  { id: "liga", label: "Liga" },
];

const SUBABAS_CONEXOES = [
  { id: "amigos", label: "Amigos" },
  { id: "pedidos", label: "Pedidos" },
  { id: "enviados", label: "Enviados" },
  { id: "sugestoes", label: "Sugestões" },
];

function formatarQuando(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function rotuloMood(moodId) {
  return MOODS.find((m) => m.id === moodId)?.label ?? null;
}

export default function AmigosTab({ usuarioId }) {
  const [subaba, setSubaba] = useState("feed");
  const [abaConexao, setAbaConexao] = useState("amigos");
  const [amigoSelecionado, setAmigoSelecionado] = useState(null);

  const { amigos, enviarPedido, torcer } = useAmigos(usuarioId);

  return (
    <div style={styles.wrap}>
      {/* Navegação Principal */}
      <div style={styles.subtabRow}>
        {SUBABAS_PRINCIPAIS.map((s) => (
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
          irParaConexoes={() => { setSubaba("conexoes"); setAbaConexao("sugestoes"); }}
          onAbrirPerfil={(item) => setAmigoSelecionado(item)}
        />
      )}

      {subaba === "conexoes" && (
        <div>
          {/* Navegação Secundária de Conexões */}
          <div style={styles.conexoesTabRow}>
            {SUBABAS_CONEXOES.map((c) => (
              <button
                key={c.id}
                style={abaConexao === c.id ? styles.conexaoAtiva : styles.conexaoInativa}
                onClick={() => setAbaConexao(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <CentralConexoes
            usuarioId={usuarioId}
            abaAtiva={abaConexao}
            onAbrirPerfil={(item) => setAmigoSelecionado(item)}
          />
        </div>
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
// Feed dos Amigos
// ---------------------------------------------------------------------------
function FeedAmigos({ usuarioId, irParaConexoes, onAbrirPerfil }) {
  const { feed, carregando, novoItemAlert } = useFeedAmigos(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando o feed...</p>;

  if (!feed.length) {
    return (
      <div style={styles.vazio}>
        <p style={styles.vazioTitulo}>Seu feed está quieto por aqui. 🕊️</p>
        <p style={styles.vazioTexto}>Conecte-se com irmãos em fé para acompanhar as leituras e mandar torcidas em tempo real!</p>
        <button className="action-btn chunky" style={styles.primaryBtnPequeno} onClick={irParaConexoes}>
          Encontrar Conexões
        </button>
      </div>
    );
  }

  return (
    <div style={styles.lista}>
      {novoItemAlert && (
        <div style={styles.alertRealtime}>
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
            <AvatarUsuario nome={item.nome_exibicao} fotoUrl={item.foto_url} tamanho={36} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {item.tipo === "torcida" ? (
              <p style={styles.feedTexto}>
                <strong onClick={() => onAbrirPerfil(item)} style={styles.nomeClicavel}>
                  {item.nome_exibicao}
                </strong>{" "}
                torceu por você! 🔥
              </p>
            ) : (
              <p style={styles.feedTexto}>
                <strong onClick={() => onAbrirPerfil(item)} style={styles.nomeClicavel}>
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
// Card para Conectar com Contatos do WhatsApp & Instagram
// ---------------------------------------------------------------------------
function CardConectarRedes({ meuCodigo }) {
  const [copiado, setCopiado] = useState(false);
  const [copiadoInstagram, setCopiadoInstagram] = useState(false);

  const urlApp = typeof window !== "undefined" ? window.location.origin : "https://main.d357ab4gel6chc.amplifyapp.com";
  const mensagemConvite = `Olá! Estou usando o aplicativo Devocional Diário para minhas leituras e orações bíblicas. Venha se conectar comigo e acompanhar devocionais juntos! 📖✨\n\nAcesse aqui: ${urlApp}`;

  async function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagemConvite)}`, "_blank", "noopener,noreferrer");
  }

  async function handleInstagram() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Devocional Diário",
          text: mensagemConvite,
          url: urlApp,
        });
        return;
      } catch (err) {
        // Usuário fechou a janela de compartilhamento
      }
    }
    try {
      await navigator.clipboard.writeText(mensagemConvite);
      setCopiadoInstagram(true);
      setTimeout(() => setCopiadoInstagram(false), 3500);
    } catch {
      // ignore
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(mensagemConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div style={styles.redesCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.redesTitulo}>Conectar Amigos do WhatsApp & Instagram</h3>
          <p style={styles.redesSubtitulo}>Convide seus contatos para acompanhar devocionais e torcerem juntos!</p>
        </div>
      </div>

      <div style={styles.redesBotoesGrid}>
        <button onClick={handleWhatsApp} style={styles.btnWhatsapp} title="Convidar contatos do WhatsApp">
          📲 Contatos WhatsApp
        </button>

        <button onClick={handleInstagram} style={styles.btnInstagram} title="Compartilhar no Instagram / Redes">
          📷 Instagram / Redes
        </button>

        <button onClick={handleCopiar} style={styles.btnCopiarLink} title="Copiar link de convite">
          {copiado ? "✓ Link Copiado! ✨" : "📋 Copiar Convite"}
        </button>
      </div>

      {copiadoInstagram && (
        <p style={styles.feedbackInstagram}>
          ✨ Convite copiado! Abra o Direct ou Stories do Instagram para enviar aos seus amigos.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Central de Conexões (Amigos, Pedidos, Enviados, Sugestões)
// ---------------------------------------------------------------------------
function CentralConexoes({ usuarioId, abaAtiva, onAbrirPerfil }) {
  const {
    amigos,
    pedidos,
    pedidosEnviados,
    meuCodigo,
    carregando,
    recarregar,
    removerAmigo,
    enviarPedido,
    responderPedido,
    cancelarPedido,
    buscarUsuarios,
    torcer,
  } = useAmigos(usuarioId);

  const [buscaTermo, setBuscaTermo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [torcidaEnviada, setTorcidaEnviada] = useState({});
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(null);
  const [sugestoesIgnoradas, setSugestoesIgnoradas] = useState({});

  // Busca em tempo real
  useEffect(() => {
    if (!buscaTermo.trim() || buscaTermo.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      const res = await buscarUsuarios(buscaTermo.trim());
      setResultadosBusca(res);
      setBuscando(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaTermo, buscarUsuarios]);

  async function handleTorcer(amigoId) {
    setTorcidaEnviada((prev) => ({ ...prev, [amigoId]: true }));
    await torcer(amigoId);
  }

  if (carregando) return <p style={styles.loadingText}>Carregando conexões...</p>;

  // ABA 1: AMIGOS
  if (abaAtiva === "amigos") {
    const listaAmigosExibida = buscaTermo.trim().length >= 2 ? resultadosBusca : amigos;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Banner Redes Sociais */}
        <CardConectarRedes meuCodigo={meuCodigo} />

        {/* Input de Busca de Amigos */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Buscar amigos por nome ou @username..."
            value={buscaTermo}
            onChange={(e) => setBuscaTermo(e.target.value)}
            style={styles.inputBusca}
          />
          {buscando && <span style={styles.spinnerBusca}>🔍...</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={styles.sectionTitle}>Seus Amigos ({amigos.length})</h3>
          <button onClick={recarregar} style={styles.refreshBtn}>🔄 Atualizar</button>
        </div>

        {listaAmigosExibida.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.emptyTitle}>Suas conexões aparecerão aqui. 🤝</p>
            <p style={styles.emptySub}>Você ainda não adicionou amigos ou nenhum resultado foi encontrado.</p>
          </div>
        ) : (
          <div style={styles.lista}>
            {listaAmigosExibida.map((amigo) => (
              <div key={amigo.amizade_id || amigo.id} style={styles.itemCard}>
                <button onClick={() => onAbrirPerfil(amigo)} style={styles.avatarBtn}>
                  <AvatarUsuario nome={amigo.nome_exibicao} fotoUrl={amigo.foto_url} tamanho={36} />
                </button>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onAbrirPerfil(amigo)}>
                  <p style={styles.itemNome}>{amigo.nome_exibicao}</p>
                  <p style={styles.itemSub}>
                    {amigo.username ? `@${amigo.username} · ` : ""}
                    🔥 {amigo.ofensiva_atual || 0} dias
                  </p>
                </div>
                <button
                  style={styles.torcerBtn}
                  disabled={!!torcidaEnviada[amigo.amigo_id || amigo.id]}
                  onClick={() => handleTorcer(amigo.amigo_id || amigo.id)}
                >
                  {torcidaEnviada[amigo.amigo_id || amigo.id] ? "🔥 Torceu!" : "🔥 Torcer"}
                </button>
                {confirmandoRemocao === (amigo.amizade_id || amigo.id) ? (
                  <button
                    style={styles.btnConfirmarRemocao}
                    onClick={async () => {
                      await removerAmigo(amigo.amigo_id || amigo.id);
                      setConfirmandoRemocao(null);
                    }}
                  >
                    Confirmar?
                  </button>
                ) : (
                  <button
                    style={styles.btnRemoverIcone}
                    title="Remover amigo"
                    onClick={() => setConfirmandoRemocao(amigo.amizade_id || amigo.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ABA 2: PEDIDOS RECEBIDOS
  if (abaAtiva === "pedidos") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={styles.sectionTitle}>Solicitações Recebidas ({pedidos.length})</h3>
        {pedidos.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.emptyTitle}>Nenhum pedido novo por aqui. 🕊️</p>
            <p style={styles.emptySub}>Quando alguém te adicionar como amigo, o pedido aparecerá nesta aba.</p>
          </div>
        ) : (
          <div style={styles.lista}>
            {pedidos.map((p) => (
              <div key={p.amizade_id || p.id} style={styles.itemCard}>
                <button onClick={() => onAbrirPerfil(p)} style={styles.avatarBtn}>
                  <AvatarUsuario nome={p.nome_exibicao} fotoUrl={p.foto_url} tamanho={36} />
                </button>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onAbrirPerfil(p)}>
                  <p style={styles.itemNome}>{p.nome_exibicao}</p>
                  <p style={styles.itemSub}>{p.username ? `@${p.username}` : "Quer se conectar com você"}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnAceitar} onClick={() => responderPedido(p.amizade_id || p.id, true)}>
                    ACEITAR
                  </button>
                  <button style={styles.btnRemover} onClick={() => responderPedido(p.amizade_id || p.id, false)}>
                    REMOVER
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ABA 3: PEDIDOS ENVIADOS
  if (abaAtiva === "enviados") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={styles.sectionTitle}>Solicitações Enviadas ({pedidosEnviados.length})</h3>
        {pedidosEnviados.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.emptyTitle}>Nenhuma solicitação pendente.</p>
            <p style={styles.emptySub}>As pessoas a quem você enviou um pedido de amizade aparecerão aqui.</p>
          </div>
        ) : (
          <div style={styles.lista}>
            {pedidosEnviados.map((p) => (
              <div key={p.amizade_id || p.id} style={styles.itemCard}>
                <button onClick={() => onAbrirPerfil(p)} style={styles.avatarBtn}>
                  <AvatarUsuario nome={p.nome_exibicao} fotoUrl={p.foto_url} tamanho={36} />
                </button>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onAbrirPerfil(p)}>
                  <p style={styles.itemNome}>{p.nome_exibicao}</p>
                  <p style={styles.itemSub}>Aguardando resposta...</p>
                </div>
                <button style={styles.btnCancelar} onClick={() => cancelarPedido(p.amizade_id || p.id)}>
                  Cancelar pedido
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ABA 4: SUGESTÕES
  if (abaAtiva === "sugestoes") {
    return (
      <SugestoesTab
        usuarioId={usuarioId}
        sugestoesIgnoradas={sugestoesIgnoradas}
        onIgnorar={(candId) => setSugestoesIgnoradas((prev) => ({ ...prev, [candId]: true }))}
        onAdicionar={enviarPedido}
        onAbrirPerfil={onAbrirPerfil}
      />
    );
  }

  return null;
}

// Componente para a aba de sugestões explicáveis
function SugestoesTab({ usuarioId, sugestoesIgnoradas, onIgnorar, onAdicionar, onAbrirPerfil }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [adicionados, setAdicionados] = useState({});

  useEffect(() => {
    let vivo = true;
    async function carregarSugestoes() {
      setCarregando(true);
      try {
        const { criarClienteSupabase } = await import("@/src/lib/supabase/client");
        const supabase = criarClienteSupabase();
        const { data } = await supabase.rpc("obter_recomendacoes_pessoas", { p_limite: 15 });
        if (vivo && data) setSugestoes(data);
      } catch (e) {
        console.error("Erro ao carregar sugestões:", e);
      } finally {
        if (vivo) setCarregando(false);
      }
    }
    carregarSugestoes();
    return () => { vivo = false; };
  }, [usuarioId]);

  if (carregando) return <p style={styles.loadingText}>Buscando pessoas recomendadas...</p>;

  const listaFiltrada = sugestoes.filter((s) => !sugestoesIgnoradas[s.candidate_id]);

  if (listaFiltrada.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <CardConectarRedes meuCodigo={null} />
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>Sem mais sugestões no momento. 🌿</p>
          <p style={styles.emptySub}>Convide seus amigos do WhatsApp e Instagram para se juntarem a você!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CardConectarRedes meuCodigo={null} />
      <h3 style={styles.sectionTitle}>Pessoas que Você Pode Conhecer</h3>
      <div style={styles.lista}>
        {listaFiltrada.map((item) => (
          <div key={item.candidate_id} style={styles.itemCard}>
            <button onClick={() => onAbrirPerfil({ id: item.candidate_id, nome_exibicao: item.nome_exibicao, foto_url: item.foto_url })} style={styles.avatarBtn}>
              <AvatarUsuario nome={item.nome_exibicao} fotoUrl={item.foto_url} tamanho={38} />
            </button>
            <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onAbrirPerfil({ id: item.candidate_id, nome_exibicao: item.nome_exibicao, foto_url: item.foto_url })}>
              <p style={styles.itemNome}>{item.nome_exibicao}</p>
              <p style={styles.itemSub}>{item.reason_text || "Recomendado para você"}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={adicionados[item.candidate_id] ? styles.btnAdicionado : styles.btnAdicionar}
                disabled={adicionados[item.candidate_id]}
                onClick={async () => {
                  setAdicionados((prev) => ({ ...prev, [item.candidate_id]: true }));
                  await onAdicionar(item.candidate_id);
                }}
              >
                {adicionados[item.candidate_id] ? "Enviado" : "Adicionar"}
              </button>
              <button style={styles.btnIgnorar} onClick={() => onIgnorar(item.candidate_id)}>
                Ignorar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desafios
// ---------------------------------------------------------------------------
function Desafios({ usuarioId }) {
  const { desafios = [], concluidos = [], carregando } = useDesafios(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando desafios...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={styles.sectionTitle}>Desafios Ativos ({desafios.length})</h3>
      {desafios.length === 0 ? (
        <p style={styles.vazioTexto}>Adicione amigos para desbloquear desafios em grupo ou complete os devocionais do dia!</p>
      ) : (
        desafios.map((d) => (
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
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Liga / Ranking
// ---------------------------------------------------------------------------
function LigaAmigos({ usuarioId, onAbrirPerfil }) {
  const { ranking, carregando } = useRankingAmigos(usuarioId);

  if (carregando) return <p style={styles.loadingText}>Carregando liga de amigos...</p>;

  if (ranking.length <= 1) {
    return <p style={styles.vazioTexto}>Adicione amigos pra formar sua liga e comparar devocionais.</p>;
  }

  return (
    <div style={styles.rankingCard}>
      {ranking.map((r) => (
        <div key={`${r.posicao}-${r.nome_exibicao}`} style={{ ...styles.rankingRow, ...(r.sou_eu ? styles.rankingRowEu : {}) }}>
          <span style={styles.rankingPosicao}>#{r.posicao}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onAbrirPerfil(r)}>
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
    marginBottom: 14,
  },
  subtabAtiva: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 9,
    border: "none",
    background: "#FFFFFF",
    color: "#33422F",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(80,70,40,0.08)",
  },
  subtabInativa: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    color: "#8A8069",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  conexoesTabRow: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #E7E0D0",
    marginBottom: 16,
    paddingBottom: 4,
  },
  conexaoAtiva: {
    flex: 1,
    padding: "8px 6px",
    background: "#B98B4E",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 12.5,
    borderRadius: 8,
    border: "none",
    textAlign: "center",
    cursor: "pointer",
  },
  conexaoInativa: {
    flex: 1,
    padding: "8px 6px",
    background: "transparent",
    color: "#7A8A7F",
    fontWeight: 600,
    fontSize: 12.5,
    borderRadius: 8,
    border: "none",
    textAlign: "center",
    cursor: "pointer",
  },
  redesCard: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "14px 16px",
    boxShadow: "0 4px 12px rgba(80,70,40,0.05)",
  },
  redesTitulo: { fontSize: 14.5, fontWeight: 700, margin: "0 0 2px", color: "#33422F" },
  redesSubtitulo: { fontSize: 12, color: "#7A8A7F", margin: 0, lineHeight: 1.3 },
  redesBotoesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  btnWhatsapp: {
    flex: "1 1 130px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 12.5,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)",
  },
  btnInstagram: {
    flex: "1 1 130px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    borderRadius: 10,
    background: "linear-gradient(45deg, #F9CE34, #EE2A7B 55%, #6228D7)",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 12.5,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(238, 42, 123, 0.25)",
  },
  btnCopiarLink: {
    flex: "1 1 120px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    borderRadius: 10,
    background: "#FFFFFF",
    color: "#B98B4E",
    fontWeight: 700,
    fontSize: 12.5,
    border: "1px solid #E7E0D0",
    borderBottom: "2px solid #D8CFB8",
    cursor: "pointer",
  },
  feedbackInstagram: {
    fontSize: 11.5,
    color: "#B98B4E",
    fontWeight: 600,
    margin: "8px 0 0",
    textAlign: "center",
  },
  inputBusca: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    fontSize: 13.5,
    color: "#33422F",
    outline: "none",
    boxSizing: "border-box",
  },
  spinnerBusca: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#8A9184" },
  sectionTitle: { fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 17, margin: 0, color: "#33422F" },
  refreshBtn: { background: "#FBF9F3", color: "#8A6224", border: "1px solid #E7E0D0", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" },
  lista: { display: "flex", flexDirection: "column", gap: 8 },
  itemCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 12,
    padding: "10px 14px",
  },
  avatarBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" },
  itemNome: { fontSize: 13.5, fontWeight: 700, color: "#33422F", margin: 0 },
  itemSub: { fontSize: 11.5, color: "#7A8A7F", margin: "2px 0 0" },
  torcerBtn: { background: "#F2A65A", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  btnRemoverIcone: { background: "none", border: "none", color: "#9AA79C", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "4px 6px" },
  btnConfirmarRemocao: { background: "#B15A4A", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  btnAceitar: { background: "#B98B4E", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnRemover: { background: "#EAF0EC", color: "#5C7060", border: "1px solid #E7E0D0", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnCancelar: { background: "transparent", color: "#B15A4A", border: "1px solid #E7E0D0", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnAdicionar: { background: "#B98B4E", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnAdicionado: { background: "#EAF0EC", color: "#4F6D5C", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700 },
  btnIgnorar: { background: "transparent", color: "#7A8A7F", border: "none", padding: "6px 8px", fontSize: 12, cursor: "pointer" },
  emptyCard: { background: "#FBF9F3", border: "1px dashed #E7E0D0", borderRadius: 14, padding: "28px 16px", textAlign: "center" },
  emptyTitle: { fontSize: 14, fontWeight: 700, color: "#33422F", margin: "0 0 4px" },
  emptySub: { fontSize: 12.5, color: "#7A8A7F", margin: 0 },
  loadingText: { fontSize: 13, color: "#9AA79C", fontStyle: "italic" },
  vazio: { background: "#FBF9F3", border: "1px solid #E7E0D0", borderRadius: 18, padding: "26px 20px", textAlign: "center" },
  vazioTitulo: { fontSize: 15, fontWeight: 700, color: "#33422F", margin: "0 0 6px" },
  vazioTexto: { fontSize: 12.5, color: "#7A8A7F", margin: "0 0 10px" },
  alertRealtime: { padding: 10, background: "#FEF3C7", color: "#92400E", borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: "center", marginBottom: 10 },
  feedCard: { display: "flex", alignItems: "center", gap: 12, background: "#FBF9F3", border: "1px solid #E7E0D0", borderRadius: 14, padding: "12px 14px" },
  nomeClicavel: { cursor: "pointer", color: "#2D3B33", textDecoration: "underline text-decoration-color: #B98B4E" },
  feedTexto: { fontSize: 13, color: "#3C4A3F", margin: 0, lineHeight: 1.4 },
  feedQuando: { fontSize: 11, color: "#9AA79C", fontWeight: 600, margin: "4px 0 0" },
  primaryBtnPequeno: { background: "#B98B4E", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  desafioCard: { background: "#FBF9F3", border: "1px solid #E7E0D0", borderRadius: 14, padding: "12px 14px" },
  desafioTopo: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  barraFundo: { height: 7, borderRadius: 999, background: "#EFEAD9", overflow: "hidden", marginTop: 3 },
  barraProgresso: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #D9A94C, #B98B4E)", transition: "width 0.4s ease" },
  rankingCard: { background: "#FFFFFF", border: "1px solid #E7E0D0", borderRadius: 16, overflow: "hidden" },
  rankingRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #F1EEE3", fontSize: 13.5 },
  rankingRowEu: { background: "#F1E2C4", fontWeight: 700 },
  rankingPosicao: { width: 32, color: "#B98B4E", fontWeight: 700 },
  rankingNome: { flex: 1, color: "#2D3B33", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rankingXp: { color: "#7A8A7F", fontWeight: 700 },
};
