"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import { useOfensiva } from "@/src/lib/hooks/useOfensiva";
import { useProgressoSemana } from "@/src/lib/hooks/useProgressoSemana";
import {
  BOOKS_PT,
  OLD_TESTAMENT_COUNT,
  buscarLivro,
  buscarCapitulo,
  buscarTextoReferencia,
  interpretarReferenciaPortugues,
} from "@/src/lib/biblia/getBibleApi";
import { MOODS, REFLECTIONS, VERSE_REFS, encontrarMood, escolherAleatorio } from "@/src/lib/devocional/versiculos";
import { COMMEMORATIVE_LABELS, obterVersiculoDoDia } from "@/src/lib/devocional/datasComemorativas";
import { calcularMissoes } from "@/src/lib/devocional/missoes";
import Mascote from "@/src/components/Mascote";
import ProgressoTab from "@/src/components/ProgressoTab";
import AmigosTab from "@/src/components/AmigosTab";
import ComunidadeTab from "@/src/components/ComunidadeTab";
import TrilhaFases from "@/src/components/TrilhaFases";
import MissoesCard from "@/src/components/MissoesCard";
import OfensivaCard from "@/src/components/OfensivaCard";
import QuizVersiculo from "@/src/components/QuizVersiculo";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";
import GuiaLeituraBiblia from "@/src/components/GuiaLeituraBiblia";
import AudioPlayer from "@/src/components/AudioPlayer";
import LembreteModal from "@/src/components/LembreteModal";
import CardDoacao from "@/src/components/CardDoacao";
import FavoritosTab from "@/src/components/FavoritosTab";
import { useFavoritos } from "@/src/lib/hooks/useFavoritos";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import PerfilModal from "@/src/components/PerfilModal";
import PerfilAmigoModal from "@/src/components/PerfilAmigoModal";
import CentralNotificacoesModal from "@/src/components/CentralNotificacoesModal";
import OnboardingModal from "@/src/components/OnboardingModal";
import { useNotificacoes } from "@/src/lib/hooks/useNotificacoes";

export default function DevocionalApp({ usuario }) {
  const router = useRouter();
  const hoje = useMemo(() => new Date(), []);
  const rotuloData = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const [aba, setAba] = useState("inicio");
  const [gatilhoRecarga, setGatilhoRecarga] = useState(0);
  const [modalLembreteAberto, setModalLembreteAberto] = useState(false);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [modalNotificacoesAberto, setModalNotificacoesAberto] = useState(false);
  const [modalOnboardingAberto, setModalOnboardingAberto] = useState(false);
  const [perfilAmigoId, setPerfilAmigoId] = useState(null);

  const { unreadNotificationsCount } = useNotificacoes(usuario?.id);

  const [perfil, setPerfil] = useState({
    nome_exibicao: usuario?.user_metadata?.full_name || usuario?.email || "Fiel",
    foto_url: usuario?.user_metadata?.avatar_url || usuario?.user_metadata?.picture || null,
    username: null,
  });

  useEffect(() => {
    let vivo = true;
    async function carregarPerfil() {
      if (!usuario?.id) return;
      try {
        const supabase = criarClienteSupabase();
        const { data } = await supabase.from("profiles").select("*").eq("id", usuario.id).maybeSingle();
        if (vivo && data) {
          setPerfil({
            id: data.id,
            nome_exibicao: data.nome_exibicao || usuario?.user_metadata?.full_name || usuario?.email || "Fiel",
            foto_url: data.foto_url || usuario?.user_metadata?.avatar_url || usuario?.user_metadata?.picture || null,
            username: data.username || null,
            nome_completo: data.nome_completo || null,
            cidade: data.cidade || null,
            igreja: data.igreja || null,
            bio: data.bio || null,
          });

          // Se novo usuário sem username configurado, abre OnboardingModal
          if (!data.username && !localStorage.getItem(`onboarding_concluido_${usuario.id}`)) {
            setModalOnboardingAberto(true);
          }
        } else if (vivo && !data) {
          setModalOnboardingAberto(true);
        }
      } catch (e) {
        console.error("Erro ao carregar perfil:", e);
      }
    }
    carregarPerfil();
    return () => { vivo = false; };
  }, [usuario]);

  const { ofensiva, jaFezHoje, registrarHoje } = useOfensiva(usuario?.id);
  const { favoritos = [], carregando: carregandoFavoritos, eFavorito, alternarFavorito } = useFavoritos(usuario?.id);
  const [tamanhoFonte, setTamanhoFonte] = useState(16);
  const estadoMascote = jaFezHoje ? "feliz" : (ofensiva?.ofensiva_atual ?? 0) === 0 && (ofensiva?.maior_ofensiva ?? 0) > 0 ? "triste" : "neutro";

  // --- Missões (metas curtas, estilo quest de jogo) ----------------------
  const { progresso: progressoSemana } = useProgressoSemana(usuario?.id, gatilhoRecarga);
  const [quizRespondidas, setQuizRespondidas] = useState(0);
  const missoes = useMemo(
    () => calcularMissoes({ jaFezHoje, progresso: progressoSemana, quizRespondidas }),
    [jaFezHoje, progressoSemana, quizRespondidas]
  );

  // --- Versículo do dia -----------------------------------------------
  const versiculoDoDia = useMemo(() => obterVersiculoDoDia(hoje), [hoje]);
  const [textoDoDia, setTextoDoDia] = useState(null);
  const [erroDoDia, setErroDoDia] = useState(false);

  useEffect(() => {
    let vivo = true;
    setTextoDoDia(null);
    setErroDoDia(false);
    buscarTextoReferencia(versiculoDoDia.ref)
      .then((texto) => vivo && setTextoDoDia(texto))
      .catch(() => vivo && setErroDoDia(true));
    return () => {
      vivo = false;
    };
  }, [versiculoDoDia]);

  // --- Devocional guiado por sentimento ---------------------------------
  const [moodSelecionado, setMoodSelecionado] = useState(null);
  const [devocional, setDevocional] = useState(null);
  const [carregandoDevocional, setCarregandoDevocional] = useState(false);
  const [erroDevocional, setErroDevocional] = useState(false);
  const [diario, setDiario] = useState("");
  const [passo, setPasso] = useState(0);
  const [concluido, setConcluido] = useState(false);

  async function iniciarDevocional(moodId) {
    const combinacoes = VERSE_REFS.filter((v) => v.moods?.includes(moodId));
    const escolhido = escolherAleatorio(combinacoes.length ? combinacoes : VERSE_REFS);
    const [q1, q2] = REFLECTIONS[moodId];
    setMoodSelecionado(moodId);
    setDiario("");
    setPasso(0);
    setConcluido(false);
    setErroDevocional(false);
    setCarregandoDevocional(true);
    setDevocional({ ...escolhido, texto: null, q1, q2 });
    try {
      const texto = await buscarTextoReferencia(escolhido.ref);
      setDevocional({ ...escolhido, texto, q1, q2 });
    } catch {
      setErroDevocional(true);
    } finally {
      setCarregandoDevocional(false);
    }
  }

  function reiniciarDevocional() {
    setMoodSelecionado(null);
    setDevocional(null);
    setDiario("");
    setPasso(0);
    setConcluido(false);
  }

  async function concluirDevocional() {
    setConcluido(true);
    await registrarHoje({
      temaOracao: moodSelecionado,
      referenciaVersiculo: devocional?.label ?? null,
      reflexao: diario || null,
    });
    setGatilhoRecarga((n) => n + 1);
  }

  const moodInfo = encontrarMood(moodSelecionado);

  // Trilha de fases do devocional de hoje, estilo Duolingo: cada fase só
  // "libera" quando a anterior é concluída.
  const fasesDevocional = [
    { id: "ler", label: "Ler", icone: "📖", status: passo > 0 || concluido ? "completo" : "atual" },
    {
      id: "refletir",
      label: "Refletir",
      icone: "✍️",
      status: passo > 1 || concluido ? "completo" : passo === 1 ? "atual" : "bloqueado",
    },
    { id: "orar", label: "Orar", icone: "🙏", status: concluido ? "completo" : passo === 2 ? "atual" : "bloqueado" },
  ];

  // --- Leitor da Bíblia completa -----------------------------------------
  const [numeroLivroSelecionado, setNumeroLivroSelecionado] = useState(null);
  const [dadosLivro, setDadosLivro] = useState(null);
  const [carregandoLivro, setCarregandoLivro] = useState(false);
  const [erroLivro, setErroLivro] = useState(false);
  const [capituloSelecionado, setCapituloSelecionado] = useState(null);
  const [capituloPendente, setCapituloPendente] = useState(null);
  const [buscaTexto, setBuscaTexto] = useState("");
  const [erroBusca, setErroBusca] = useState(false);
  const [versiculosDoCapitulo, setVersiculosDoCapitulo] = useState(null);
  const [carregandoCapitulo, setCarregandoCapitulo] = useState(false);
  const [erroCapitulo, setErroCapitulo] = useState(false);

  async function abrirLivro(numero, capituloInicial) {
    setNumeroLivroSelecionado(numero);
    setCapituloSelecionado(null);
    setDadosLivro(null);
    setErroLivro(false);
    setCapituloPendente(capituloInicial || null);
    setCarregandoLivro(true);
    try {
      const dados = await buscarLivro(numero);
      setDadosLivro(dados);
    } catch {
      setErroLivro(true);
    } finally {
      setCarregandoLivro(false);
    }
  }

  useEffect(() => {
    if (dadosLivro && capituloPendente != null) {
      if (capituloPendente === -1) {
        setCapituloSelecionado(dadosLivro.chapters[dadosLivro.chapters.length - 1].chapter);
      } else {
        const existe = dadosLivro.chapters.some((c) => c.chapter === capituloPendente);
        setCapituloSelecionado(existe ? capituloPendente : dadosLivro.chapters[0]?.chapter ?? 1);
      }
      setCapituloPendente(null);
    }
  }, [dadosLivro, capituloPendente]);

  // Busca o texto do capítulo só quando o usuário realmente abre ele --
  // cada capítulo vem sob demanda da API agora (em vez do livro inteiro de
  // uma vez), então isso substitui o que antes era só um `.find()` síncrono
  // dentro de `dadosLivro.chapters`.
  useEffect(() => {
    if (numeroLivroSelecionado == null || capituloSelecionado == null) {
      setVersiculosDoCapitulo(null);
      return;
    }
    let vivo = true;
    setVersiculosDoCapitulo(null);
    setErroCapitulo(false);
    setCarregandoCapitulo(true);
    buscarCapitulo(numeroLivroSelecionado, capituloSelecionado)
      .then((dados) => {
        if (vivo) setVersiculosDoCapitulo(dados);
      })
      .catch(() => {
        if (vivo) setErroCapitulo(true);
      })
      .finally(() => {
        if (vivo) setCarregandoCapitulo(false);
      });
    return () => {
      vivo = false;
    };
  }, [numeroLivroSelecionado, capituloSelecionado]);

  function fecharLivro() {
    setNumeroLivroSelecionado(null);
    setDadosLivro(null);
    setCapituloSelecionado(null);
    setErroLivro(false);
  }

  function proximoCapitulo() {
    if (!dadosLivro || capituloSelecionado == null) return;
    const ultimo = dadosLivro.chapters[dadosLivro.chapters.length - 1].chapter;
    if (capituloSelecionado < ultimo) {
      setCapituloSelecionado(capituloSelecionado + 1);
    } else if (numeroLivroSelecionado < BOOKS_PT.length) {
      abrirLivro(numeroLivroSelecionado + 1, 1);
    }
  }

  function capituloAnterior() {
    if (!dadosLivro || capituloSelecionado == null) return;
    if (capituloSelecionado > 1) {
      setCapituloSelecionado(capituloSelecionado - 1);
    } else if (numeroLivroSelecionado > 1) {
      abrirLivro(numeroLivroSelecionado - 1, -1);
    }
  }

  const ehPrimeiroCapituloDaBiblia = numeroLivroSelecionado === 1 && capituloSelecionado === 1;
  const ehUltimoCapituloDaBiblia =
    numeroLivroSelecionado === BOOKS_PT.length &&
    dadosLivro &&
    capituloSelecionado === dadosLivro.chapters[dadosLivro.chapters.length - 1].chapter;

  function handleBusca(e) {
    e.preventDefault();
    const interpretada = interpretarReferenciaPortugues(buscaTexto);
    if (!interpretada) {
      setErroBusca(true);
      return;
    }
    setErroBusca(false);
    abrirLivro(interpretada.numeroDoLivro, interpretada.capitulo);
  }

  // Usado pelo guia de leitura quando ele aparece na aba Início: além de
  // abrir o livro/capítulo, precisa levar o usuário pra aba Bíblia completa
  // pra ele realmente ver o resultado (na aba Bíblia o guia já está lá, não
  // precisa trocar de aba).
  function abrirLivroDoGuiaNaInicio(numero, capitulo) {
    abrirLivro(numero, capitulo);
    setAba("biblia");
  }

  async function sair() {
    const supabase = criarClienteSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nomeExibicao = usuario.user_metadata?.full_name || usuario.email;

  return (
    <div style={styles.page}>
      <style>{`
        .glow { animation: breathe 5s ease-in-out infinite; }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.12); opacity: 0.9; }
        }
        .flame-icon { animation: flicker 1.8s ease-in-out infinite; display: inline-block; }
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
        .mood-btn, .book-btn, .chap-btn, .tab-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .mood-btn:hover, .book-btn:hover, .chap-btn:hover { transform: translateY(-2px); }
        .mood-btn:focus-visible, .action-btn:focus-visible, .textarea-field:focus-visible,
        .book-btn:focus-visible, .chap-btn:focus-visible, .tab-btn:focus-visible {
          outline: 2px solid #B98B4E; outline-offset: 2px;
        }
        .action-btn { transition: transform 0.1s ease, opacity 0.15s ease, box-shadow 0.1s ease; }
        .action-btn:hover { transform: translateY(-1px); opacity: 0.92; }
        .action-btn.chunky:active, .mood-btn:active, .book-btn:active, .chap-btn:active {
          transform: translateY(3px); filter: brightness(0.97);
        }
        @media (prefers-reduced-motion: reduce) { .glow, .flame-icon { animation: none; } }
      `}</style>

      <div style={styles.horizon} />

      <div style={styles.container}>
        {/* CABEÇALHO: pílula de usuário + lembrete + ofensiva + sair */}
        <div style={styles.topBar}>
          <button
            onClick={() => setModalPerfilAberto(true)}
            style={styles.profileChipBtn}
            title="Editar perfil e foto"
          >
            <AvatarUsuario nome={perfil.nome_exibicao} fotoUrl={perfil.foto_url} tamanho={26} moldura={true} />
            <span style={styles.topBarUser}>{perfil.nome_exibicao}</span>
            <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 1 }} title="Editar Perfil">✏️</span>
          </button>

          <div style={styles.topBarRight}>
            {/* Ícone de Notificações com Badge */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <button
                className="action-btn"
                style={{ ...styles.linkBtn, padding: "4px 8px", fontSize: 17 }}
                onClick={() => setModalNotificacoesAberto(true)}
                title="Central de Notificações"
              >
                🔔
              </button>
              {unreadNotificationsCount > 0 && (
                <span style={styles.bellBadge}>{unreadNotificationsCount}</span>
              )}
            </div>

            <button
              className="action-btn"
              style={{ ...styles.linkBtn, padding: "4px 8px", fontSize: 16 }}
              onClick={() => setModalLembreteAberto(true)}
              title="Configurar Lembrete Diário"
            >
              ⏰
            </button>
            <span style={styles.ofensivaChip} title={`Maior sequência: ${ofensiva?.maior_ofensiva ?? 0} dias`}>
              <span className="flame-icon">🔥</span> {ofensiva?.ofensiva_atual ?? 0}
            </span>
            <button className="action-btn" style={styles.linkBtn} onClick={sair}>
              Sair
            </button>
          </div>
        </div>

        <LembreteModal aberto={modalLembreteAberto} aoFechar={() => setModalLembreteAberto(false)} />
        
        <PerfilModal
          usuario={usuario}
          perfilAtual={perfil}
          aberto={modalPerfilAberto}
          aoFechar={() => setModalPerfilAberto(false)}
          aoSalvar={(novosDados) => setPerfil((antigo) => ({ ...antigo, ...novosDados }))}
        />

        {modalNotificacoesAberto && (
          <CentralNotificacoesModal
            usuarioId={usuario?.id}
            aoFechar={() => setModalNotificacoesAberto(false)}
            aoAbrirPerfilAmigo={(actorId) => {
              setModalNotificacoesAberto(false);
              setPerfilAmigoId(actorId);
            }}
          />
        )}

        {modalOnboardingAberto && (
          <OnboardingModal
            usuario={usuario}
            perfilAtual={perfil}
            aoConcluir={() => {
              setModalOnboardingAberto(false);
              if (usuario?.id) {
                localStorage.setItem(`onboarding_concluido_${usuario.id}`, "true");
                criarClienteSupabase()
                  .from("profiles")
                  .select("*")
                  .eq("id", usuario.id)
                  .maybeSingle()
                  .then(({ data }) => {
                    if (data) setPerfil((p) => ({ ...p, ...data }));
                  });
              }
            }}
          />
        )}

        {perfilAmigoId && (
          <PerfilAmigoModal
            aberto={!!perfilAmigoId}
            aoFechar={() => setPerfilAmigoId(null)}
            amigo={{ id: perfilAmigoId }}
            usuarioAtualId={usuario?.id}
          />
        )}

        {/* HERO */}
        <div style={styles.hero}>
          <Mascote estado={estadoMascote} />
          <p style={styles.eyebrow}>{rotuloData}</p>
          <h1 style={styles.title}>Devocional do dia</h1>
          {versiculoDoDia.comemorativa && (
            <p style={styles.commemorativeBadge}>✦ Hoje é {COMMEMORATIVE_LABELS[versiculoDoDia.comemorativa]}</p>
          )}
          {jaFezHoje && (
            <p style={styles.jaFezBadge}>✓ Devocional de hoje concluído — volte amanhã para manter a ofensiva</p>
          )}
        </div>

        {/* TABS */}
        <div style={styles.tabRow} className="no-scrollbar">
          <button
            className="tab-btn"
            style={aba === "inicio" ? styles.tabActive : styles.tabInactive}
            onClick={() => setAba("inicio")}
          >
            Início
          </button>
          <button
            className="tab-btn"
            style={aba === "biblia" ? styles.tabActive : styles.tabInactive}
            onClick={() => setAba("biblia")}
          >
            Bíblia
          </button>
          <button
            className="tab-btn"
            style={aba === "favoritos" ? styles.tabActive : styles.tabInactive}
            onClick={() => setAba("favoritos")}
          >
            ⭐ Favoritos {favoritos.length > 0 && `(${favoritos.length})`}
          </button>
          <button
            className="tab-btn"
            style={aba === "progresso" ? styles.tabActive : styles.tabInactive}
            onClick={() => setAba("progresso")}
          >
            Progresso
          </button>
          <button
            className="tab-btn"
            style={aba === "comunidade" ? styles.tabActive : styles.tabInactive}
            onClick={() => setAba("comunidade")}
          >
            🌐 Comunidade
          </button>
          <button
            className="tab-btn"
            style={aba === "amigos" ? styles.tabActive : styles.tabInactive}
            onClick={() => setAba("amigos")}
          >
            🤝 Conexões
          </button>
        </div>

        {aba === "inicio" && (
          <>
            {/* OFENSIVA: reforça a chama da oração diária, incentiva a não perder a sequência */}
            <OfensivaCard ofensiva={ofensiva} jaFezHoje={jaFezHoje} />

            {/* VERSÍCULO DO DIA */}
            <div style={styles.card}>
              <p style={styles.cardLabel}>
                {versiculoDoDia.comemorativa
                  ? `Palavra para ${COMMEMORATIVE_LABELS[versiculoDoDia.comemorativa]}`
                  : "Palavra para hoje"}
              </p>
              {textoDoDia ? (
                <p style={styles.verseText}>&ldquo;{textoDoDia}&rdquo;</p>
              ) : erroDoDia ? (
                <p style={styles.verseText}>Não foi possível carregar o texto agora. Tente novamente em instantes.</p>
              ) : (
                <p style={styles.loadingText}>Carregando...</p>
              )}
              <p style={styles.verseRef}>— {versiculoDoDia.label}</p>
              {textoDoDia && (
                <>
                  <AudioPlayer texto={`"${textoDoDia}" — ${versiculoDoDia.label}`} rotulo="Ouvir versículo" />
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="action-btn"
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        borderRadius: 10,
                        border: "1px solid #E7E0D0",
                        background: eFavorito(versiculoDoDia.label) ? "#FEF3C7" : "#FFFFFF",
                        color: eFavorito(versiculoDoDia.label) ? "#92400E" : "#4B5563",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      onClick={() => alternarFavorito(versiculoDoDia.label, textoDoDia)}
                    >
                      {eFavorito(versiculoDoDia.label) ? "⭐ Salvo nos Favoritos" : "☆ Salvar nos Favoritos"}
                    </button>
                    <CompartilharBotoes texto={`"${textoDoDia}" — ${versiculoDoDia.label}`} />
                  </div>
                </>
              )}
            </div>

            {textoDoDia && (
              <div style={{ marginTop: 20 }}>
                <QuizVersiculo entrada={versiculoDoDia} texto={textoDoDia} onProgresso={setQuizRespondidas} />
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <MissoesCard missoes={missoes} />
            </div>

            <div style={{ marginTop: 20 }}>
              <GuiaLeituraBiblia onAbrirLivro={abrirLivroDoGuiaNaInicio} />
            </div>

            {!devocional && (
              <>
                <div style={styles.divider} />
                <div style={styles.moodSection}>
                  <h2 style={styles.sectionTitle}>Qual o tema da sua oração hoje?</h2>
                  <p style={styles.sectionSubtitle}>Escolha o que mais combina com este momento e vamos refletir juntos.</p>
                  <div style={styles.moodGrid}>
                    {MOODS.map((m) => (
                      <button key={m.id} className="mood-btn" style={styles.moodBtn} onClick={() => iniciarDevocional(m.id)}>
                        <span style={{ fontSize: 22 }}>{m.icon}</span>
                        <span style={styles.moodLabel}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {devocional && (
              <div style={styles.devotionalCard}>
                <div style={styles.devotionalHeader}>
                  <span style={{ fontSize: 20 }}>{moodInfo.icon}</span>
                  <span style={styles.devotionalHeaderText}>Devocional — {moodInfo.label.toLowerCase()}</span>
                </div>

                <TrilhaFases orientation="horizontal" fases={fasesDevocional} />

                {passo === 0 && (
                  <div style={styles.stepBlock}>
                    <p style={styles.stepLabel}>1. Leia com calma</p>
                    {carregandoDevocional ? (
                      <p style={styles.loadingText}>Buscando o versículo...</p>
                    ) : erroDevocional ? (
                      <p style={styles.verseTextSmall}>Não foi possível carregar o texto agora. Tente escolher o tema novamente.</p>
                    ) : (
                      <p style={styles.verseTextSmall}>&ldquo;{devocional.texto}&rdquo;</p>
                    )}
                    <p style={styles.verseRef}>— {devocional.label}</p>
                    {devocional.texto && (
                      <>
                        <AudioPlayer texto={`"${devocional.texto}" — ${devocional.label}`} rotulo="Ouvir leitura" />
                        <div style={{ marginTop: 4 }}>
                          <CompartilharBotoes texto={`"${devocional.texto}" — ${devocional.label}`} />
                        </div>
                      </>
                    )}
                    <button className="action-btn chunky" style={styles.primaryBtn} onClick={() => setPasso(1)} disabled={carregandoDevocional}>
                      Continuar
                    </button>
                  </div>
                )}

                {passo === 1 && (
                  <div style={styles.stepBlock}>
                    <p style={styles.stepLabel}>2. Reflita</p>
                    <p style={styles.reflectionQ}>{devocional.q1}</p>
                    <p style={styles.reflectionQ}>{devocional.q2}</p>
                    <textarea
                      className="textarea-field"
                      style={styles.textarea}
                      placeholder="Escreva livremente aqui, se quiser..."
                      value={diario}
                      onChange={(e) => setDiario(e.target.value)}
                      rows={4}
                    />
                    <div style={styles.btnRow}>
                      <button className="action-btn chunky" style={styles.secondaryBtn} onClick={() => setPasso(0)}>
                        Voltar
                      </button>
                      <button className="action-btn chunky" style={styles.primaryBtn} onClick={() => setPasso(2)}>
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {passo === 2 && !concluido && (
                  <div style={styles.stepBlock}>
                    <p style={styles.stepLabel}>3. Ore</p>
                    <p style={styles.reflectionQ}>
                      Leve o que você escreveu diante de Deus, em silêncio ou em voz alta. Não precisa de palavras
                      perfeitas — só sinceridade.
                    </p>
                    <div style={styles.prayerBox}>
                      <p style={styles.prayerText}>
                        &ldquo;Senhor, hoje eu trago a Ti o que sinto. Ajuda-me a confiar na Tua Palavra e a encontrar,
                        nela, o que eu preciso agora. Amém.&rdquo;
                      </p>
                    </div>
                    <button className="action-btn chunky" style={styles.primaryBtn} onClick={concluirDevocional}>
                      Concluir devocional
                    </button>
                  </div>
                )}

                {passo === 2 && concluido && (
                  <div style={{ ...styles.stepBlock, textAlign: "center" }}>
                    <p style={{ fontSize: 32, margin: "8px 0" }}>
                      <span className="flame-icon">🔥</span>
                    </p>
                    <p style={styles.sectionTitle}>Ofensiva de {ofensiva?.ofensiva_atual ?? 1} {ofensiva?.ofensiva_atual === 1 ? "dia" : "dias"}!</p>
                    <p style={styles.sectionSubtitle}>Volte amanhã para manter sua sequência viva.</p>
                    <button className="action-btn chunky" style={styles.primaryBtn} onClick={reiniciarDevocional}>
                      Voltar ao início
                    </button>
                  </div>
                )}
              </div>
            )}

            <CardDoacao />

            <p style={styles.footnote}>
              Os versículos deste devocional são buscados ao vivo da tradução de Almeida (domínio público) — a mesma fonte
              da aba &quot;Bíblia completa&quot;. Em datas comemorativas (Dia das Mães, dos Pais, Páscoa, Natal...), a
              palavra do dia muda automaticamente para um versículo relacionado.
            </p>
          </>
        )}

        {aba === "biblia" && (
          <div style={styles.bibleSection}>
            <form onSubmit={handleBusca} style={styles.searchRow}>
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => {
                  setBuscaTexto(e.target.value);
                  setErroBusca(false);
                }}
                placeholder="Ir direto para... ex: João 3:16"
                style={styles.searchInput}
              />
              <button type="submit" className="action-btn" style={styles.searchBtn}>
                Ir
              </button>
            </form>
            {erroBusca && (
              <p style={styles.searchErrorText}>
                Não encontrei essa referência. Tente algo como &quot;Salmos 23&quot; ou &quot;1 Coríntios 13&quot;.
              </p>
            )}

            {!numeroLivroSelecionado && (
              <>
                <GuiaLeituraBiblia onAbrirLivro={abrirLivro} />

                <h2 style={styles.sectionTitle}>Escolha um livro</h2>
                <p style={styles.sectionSubtitle}>
                  Texto completo em português (tradução de Almeida, domínio público), buscado ao vivo.
                </p>
                <p style={styles.testamentLabel}>Antigo Testamento</p>
                <div style={styles.bookGrid}>
                  {BOOKS_PT.slice(0, OLD_TESTAMENT_COUNT).map((nome, i) => (
                    <button key={nome} className="book-btn" style={styles.bookBtn} onClick={() => abrirLivro(i + 1)}>
                      {nome}
                    </button>
                  ))}
                </div>
                <p style={styles.testamentLabel}>Novo Testamento</p>
                <div style={styles.bookGrid}>
                  {BOOKS_PT.slice(OLD_TESTAMENT_COUNT).map((nome, i) => (
                    <button
                      key={nome}
                      className="book-btn"
                      style={styles.bookBtn}
                      onClick={() => abrirLivro(OLD_TESTAMENT_COUNT + i + 1)}
                    >
                      {nome}
                    </button>
                  ))}
                </div>
              </>
            )}

            {numeroLivroSelecionado && !capituloSelecionado && (
              <>
                <button className="action-btn" style={styles.backBtn} onClick={fecharLivro}>
                  ← Livros
                </button>
                <h2 style={styles.sectionTitle}>{BOOKS_PT[numeroLivroSelecionado - 1]}</h2>
                {carregandoLivro && <p style={styles.loadingText}>Carregando capítulos...</p>}
                {erroLivro && <p style={styles.loadingText}>Não foi possível carregar este livro agora. Tente novamente.</p>}
                {dadosLivro && (
                  <div style={styles.chapterGrid}>
                    {dadosLivro.chapters.map((c) => (
                      <button
                        key={c.chapter}
                        className="chap-btn"
                        style={styles.chapBtn}
                        onClick={() => setCapituloSelecionado(c.chapter)}
                      >
                        {c.chapter}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {numeroLivroSelecionado && capituloSelecionado && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <button className="action-btn" style={styles.backBtn} onClick={() => setCapituloSelecionado(null)}>
                    ← Capítulos
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#7A8A7F", fontWeight: 600 }}>Tamanho:</span>
                    <button
                      className="action-btn"
                      style={{ padding: "3px 8px", fontSize: 12, background: "#FFFFFF", border: "1px solid #E7E0D0", borderRadius: 8, fontWeight: 700 }}
                      onClick={() => setTamanhoFonte((f) => Math.max(13, f - 2))}
                      title="Diminuir fonte"
                    >
                      A-
                    </button>
                    <button
                      className="action-btn"
                      style={{ padding: "3px 8px", fontSize: 12, background: "#FFFFFF", border: "1px solid #E7E0D0", borderRadius: 8, fontWeight: 700 }}
                      onClick={() => setTamanhoFonte((f) => Math.min(24, f + 2))}
                      title="Aumentar fonte"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <h2 style={styles.sectionTitle}>
                  {BOOKS_PT[numeroLivroSelecionado - 1]} {capituloSelecionado}
                </h2>

                <div style={styles.readerCard}>
                  {versiculosDoCapitulo ? (
                    versiculosDoCapitulo.verses.map((v) => {
                      const refVersiculo = `${BOOKS_PT[numeroLivroSelecionado - 1]} ${capituloSelecionado}:${v.verse}`;
                      const salvo = eFavorito(refVersiculo);
                      return (
                        <div
                          key={v.verse}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 8,
                            marginBottom: 4,
                            background: salvo ? "rgba(254, 243, 199, 0.45)" : "transparent",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <p style={{ ...styles.readerVerse, fontSize: tamanhoFonte, margin: 0, flex: 1, lineHeight: 1.6 }}>
                            <span style={styles.readerVerseNum}>{v.verse}</span> {v.text}
                          </p>
                          <button
                            onClick={() => alternarFavorito(refVersiculo, v.text)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "2px 4px",
                              opacity: salvo ? 1 : 0.35,
                              transition: "transform 0.15s ease, opacity 0.15s ease",
                            }}
                            title={salvo ? "Remover dos favoritos" : "Salvar versículo"}
                          >
                            {salvo ? "⭐" : "☆"}
                          </button>
                        </div>
                      );
                    })
                  ) : erroCapitulo ? (
                    <p style={styles.loadingText}>Não foi possível carregar este capítulo agora. Tente novamente.</p>
                  ) : carregandoCapitulo ? (
                    <p style={styles.loadingText}>Carregando...</p>
                  ) : null}
                </div>
                <div style={styles.navRow}>
                  <button
                    className="action-btn"
                    style={{ ...styles.secondaryBtn, marginTop: 0, opacity: ehPrimeiroCapituloDaBiblia ? 0.4 : 1 }}
                    onClick={capituloAnterior}
                    disabled={ehPrimeiroCapituloDaBiblia}
                  >
                    ← Capítulo anterior
                  </button>
                  <button
                    className="action-btn"
                    style={{ ...styles.primaryBtn, marginTop: 0, opacity: ehUltimoCapituloDaBiblia ? 0.4 : 1 }}
                    onClick={proximoCapitulo}
                    disabled={ehUltimoCapituloDaBiblia}
                  >
                    Próximo capítulo →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {aba === "favoritos" && (
          <FavoritosTab
            favoritos={favoritos}
            carregando={carregandoFavoritos}
            alternarFavorito={alternarFavorito}
          />
        )}

        {aba === "progresso" && (
          <ProgressoTab
            usuarioId={usuario?.id}
            nomeExibicao={perfil?.nome_exibicao}
            gatilhoRecarga={gatilhoRecarga}
          />
        )}

        {aba === "comunidade" && (
          <ComunidadeTab usuarioId={usuario?.id} nomeUsuario={perfil?.nome_exibicao} />
        )}

        {aba === "amigos" && <AmigosTab usuarioId={usuario?.id} />}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EAF0EC 0%, #F1EEE3 55%, #F6EFE1 100%)",
    fontFamily: "'Karla', sans-serif",
    color: "#2D3B33",
    position: "relative",
    overflow: "hidden",
    padding: "0 0 48px",
  },
  horizon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "linear-gradient(90deg, transparent, #B98B4E, transparent)",
    opacity: 0.6,
  },
  container: {
    maxWidth: 520,
    width: "100%",
    margin: "0 auto",
    padding: "20px 16px 0",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
    width: "100%",
  },
  profileChipBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 999,
    padding: "3px 10px 3px 4px",
    cursor: "pointer",
    textAlign: "left",
    maxWidth: "52%",
    flexShrink: 1,
    boxShadow: "0 2px 6px rgba(80,70,40,0.06)",
  },
  topBarUser: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#33422F",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 110,
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  iconChipBtn: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ofensivaChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 13,
    fontWeight: 700,
    color: "#8A6224",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#7A8A7F",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  hero: { textAlign: "center", marginBottom: 20 },
  glowCircle: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(185,139,78,0.35) 0%, rgba(185,139,78,0) 70%)",
  },
  glowIcon: {
    position: "relative",
    width: 64,
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  },
  eyebrow: {
    textTransform: "capitalize",
    fontSize: 13,
    letterSpacing: 1,
    color: "#7A8A7F",
    margin: "0 0 6px",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 30,
    margin: 0,
    color: "#33422F",
  },
  commemorativeBadge: {
    display: "inline-block",
    marginTop: 12,
    padding: "6px 14px",
    borderRadius: 999,
    background: "#F1E2C4",
    color: "#8A6224",
    fontSize: 12.5,
    fontWeight: 700,
  },
  jaFezBadge: {
    display: "inline-block",
    marginTop: 12,
    padding: "6px 14px",
    borderRadius: 999,
    background: "#DDE8DE",
    color: "#3F5642",
    fontSize: 12,
    fontWeight: 700,
  },
  tabRow: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
    background: "#EFEAD9",
    borderRadius: 12,
    padding: 4,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  tabActive: {
    flexShrink: 0,
    background: "#FFFFFF",
    color: "#33422F",
    border: "none",
    borderRadius: 9,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(80,70,40,0.08)",
    whiteSpace: "nowrap",
  },
  tabInactive: {
    flexShrink: 0,
    background: "transparent",
    color: "#8A9184",
    border: "none",
    borderRadius: 9,
    padding: "8px 14px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "26px 24px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
    textAlign: "center",
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#B98B4E",
    fontWeight: 700,
    margin: "0 0 12px",
  },
  verseText: {
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 19,
    lineHeight: 1.55,
    color: "#2D3B33",
    margin: "0 0 10px",
  },
  verseTextSmall: {
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 1.55,
    color: "#2D3B33",
    margin: "0 0 8px",
  },
  verseRef: {
    fontSize: 13,
    color: "#7A8A7F",
    fontWeight: 600,
    margin: 0,
  },
  loadingText: {
    fontSize: 14,
    color: "#9AA79C",
    fontStyle: "italic",
    margin: "0 0 10px",
  },
  divider: {
    height: 1,
    background: "linear-gradient(90deg, transparent, #D8CFB8, transparent)",
    margin: "32px 0 24px",
  },
  moodSection: { textAlign: "center" },
  sectionTitle: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 21,
    margin: "0 0 6px",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#7A8A7F",
    margin: "0 0 20px",
  },
  moodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  moodBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 6px",
    borderRadius: 14,
    border: "1px solid #E7E0D0",
    borderBottom: "3px solid #D8CFB8",
    background: "#FBF9F3",
    cursor: "pointer",
  },
  moodLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: "#3C4A3F",
    textAlign: "center",
    lineHeight: 1.2,
  },
  devotionalCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 20,
    padding: "24px 22px",
    boxShadow: "0 10px 28px rgba(80, 70, 40, 0.08)",
  },
  devotionalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  devotionalHeaderText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#4F6D5C",
  },
  stepBlock: { textAlign: "left" },
  stepLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#B98B4E",
    fontWeight: 700,
    margin: "0 0 12px",
  },
  reflectionQ: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#3C4A3F",
    margin: "0 0 10px",
  },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    padding: 12,
    fontFamily: "'Karla', sans-serif",
    fontSize: 14,
    color: "#2D3B33",
    resize: "vertical",
    marginTop: 6,
  },
  prayerBox: {
    background: "#F1EEE3",
    borderRadius: 12,
    padding: "16px 16px",
    margin: "14px 0 20px",
  },
  prayerText: {
    fontFamily: "'Fraunces', serif",
    fontStyle: "italic",
    fontSize: 14.5,
    lineHeight: 1.6,
    color: "#4F6D5C",
    margin: 0,
  },
  btnRow: { display: "flex", gap: 10, marginTop: 16 },
  primaryBtn: {
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "4px solid #8A6224",
    borderRadius: 12,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 16,
  },
  secondaryBtn: {
    background: "#FBF9F3",
    color: "#7A8A7F",
    border: "1px solid #E7E0D0",
    borderBottom: "4px solid #D8CFB8",
    borderRadius: 12,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 16,
  },
  footnote: {
    fontSize: 11.5,
    color: "#9AA79C",
    textAlign: "center",
    lineHeight: 1.5,
    marginTop: 32,
  },
  bibleSection: { textAlign: "left" },
  searchRow: {
    display: "flex",
    gap: 8,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    padding: "12px 14px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 14,
    color: "#2D3B33",
  },
  searchBtn: {
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "0 18px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  searchErrorText: {
    fontSize: 12.5,
    color: "#B15A4A",
    margin: "-10px 0 16px",
  },
  navRow: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },
  testamentLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#B98B4E",
    fontWeight: 700,
    margin: "18px 0 10px",
  },
  bookGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  },
  bookBtn: {
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    color: "#33422F",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#B98B4E",
    fontWeight: 700,
    fontSize: 13.5,
    cursor: "pointer",
    padding: 0,
    marginBottom: 14,
  },
  chapterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 8,
    marginTop: 8,
  },
  chapBtn: {
    padding: "10px 0",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    color: "#33422F",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  readerCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    padding: "20px 20px",
    marginTop: 8,
  },
  readerVerse: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    lineHeight: 1.7,
    color: "#2D3B33",
    margin: "0 0 12px",
  },
  readerVerseNum: {
    fontSize: 11,
    fontWeight: 700,
    color: "#B98B4E",
    verticalAlign: "super",
    marginRight: 2,
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    background: "#B98B4E",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 999,
    padding: "1px 5px",
    lineHeight: 1,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    pointerEvents: "none",
  },
};
