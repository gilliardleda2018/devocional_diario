"use client";

import { useEffect, useState } from "react";
import AudioPlayer from "@/src/components/AudioPlayer";
import { buscarTextoReferencia } from "@/src/lib/biblia/getBibleApi";
import { MOODS, REFLECTIONS, VERSE_REFS, encontrarMood, escolherAleatorio } from "@/src/lib/devocional/versiculos";
import { guardarDevocionalVisitante } from "@/src/lib/devocional/visitante";
import { registrarEvento } from "@/src/lib/util/eventos";

/**
 * Página de entrada para quem ainda não tem conta.
 *
 * Antes, abrir o site sem estar logado levava direto ao formulário de login:
 * quem chegava por um link compartilhado não via nada do app antes de ter que
 * se cadastrar. Agora a pessoa vê a Palavra do dia e faz o devocional
 * completo sem conta; o cadastro só é oferecido no fim, para salvar o que ela
 * acabou de fazer (ver src/lib/devocional/visitante.js).
 */
export default function PaginaEntrada({ versiculoDoDia, textoDoDia, rotuloData }) {
  const [mood, setMood] = useState(null);
  const [devocional, setDevocional] = useState(null);
  const [erro, setErro] = useState(false);
  const [passo, setPasso] = useState(0);
  const [reflexao, setReflexao] = useState("");
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    registrarEvento("entrada_visita", { origem: document.referrer ? new URL(document.referrer).hostname : null });
  }, []);

  async function escolherMood(moodId) {
    const opcoes = VERSE_REFS.filter((v) => v.moods?.includes(moodId));
    const escolhido = escolherAleatorio(opcoes.length ? opcoes : VERSE_REFS);
    const [q1, q2] = REFLECTIONS[moodId];
    setMood(moodId);
    registrarEvento("entrada_devocional_iniciado", { tema: moodId });
    setPasso(0);
    setErro(false);
    setDevocional({ ...escolhido, texto: null, q1, q2 });
    try {
      const texto = await buscarTextoReferencia(escolhido.ref);
      setDevocional({ ...escolhido, texto, q1, q2 });
    } catch {
      setErro(true);
    }
  }

  function concluir() {
    guardarDevocionalVisitante({
      temaOracao: mood,
      referenciaVersiculo: devocional?.label ?? null,
      reflexao: reflexao.trim() || null,
    });
    setConcluido(true);
    registrarEvento("entrada_devocional_concluido", { tema: mood, escreveu: !!reflexao.trim() });
  }

  const moodInfo = encontrarMood(mood);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topo}>
          <span style={s.marca}>🕊️ Devocional Diário</span>
          <a href="/login" style={s.linkEntrar}>Entrar</a>
        </div>

        <p style={s.data}>{rotuloData}</p>
        <h1 style={s.titulo}>5 minutos com Deus, todos os dias</h1>
        <p style={s.subtitulo}>Um versículo, uma reflexão e uma oração para o momento que você está vivendo.</p>

        <div style={{ ...s.card, ...s.pergaminho }}>
          <p style={s.rotulo}>Palavra para hoje</p>
          {textoDoDia ? (
            <p style={s.versiculo}>&ldquo;{textoDoDia}&rdquo;</p>
          ) : (
            <p style={s.versiculo}>Abra seu coração: a Palavra de hoje já vai carregar.</p>
          )}
          <p style={s.referencia}>— {versiculoDoDia.label}</p>
          {textoDoDia && <AudioPlayer texto={`"${textoDoDia}" — ${versiculoDoDia.label}`} rotulo="Ouvir versículo" />}
        </div>

        <div id="devocional" style={s.card}>
          {!devocional && (
            <>
              <h2 style={s.tituloSecao}>Como você está hoje?</h2>
              <p style={s.textoSecao}>Toque no que mais combina com você e faça seu devocional agora. Não precisa criar conta.</p>
              <div style={s.gradeMoods}>
                {MOODS.map((m) => (
                  <button key={m.id} className="action-btn chunky" style={s.botaoMood} onClick={() => escolherMood(m.id)}>
                    <span style={{ fontSize: 22 }}>{m.icon}</span>
                    <span style={s.rotuloMood}>{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {devocional && !concluido && (
            <div style={{ textAlign: "left" }}>
              <p style={s.cabecalhoDevocional}>
                {moodInfo?.icon} Devocional — {moodInfo?.label.toLowerCase()} · passo {passo + 1} de 3
              </p>

              {passo === 0 && (
                <>
                  <p style={s.rotuloPasso}>1. Leia com calma</p>
                  {erro ? (
                    <p style={s.versiculoMenor}>Não foi possível carregar o texto agora. Escolha o tema de novo em instantes.</p>
                  ) : devocional.texto ? (
                    <p style={s.versiculoMenor}>&ldquo;{devocional.texto}&rdquo;</p>
                  ) : (
                    <p style={s.carregando}>Buscando o versículo...</p>
                  )}
                  <p style={s.referenciaEsq}>— {devocional.label}</p>
                  {devocional.texto && <AudioPlayer texto={`"${devocional.texto}" — ${devocional.label}`} rotulo="Ouvir leitura" />}
                  <div style={s.linhaBotoes}>
                    <button className="action-btn chunky" style={s.botaoSecundario} onClick={() => setDevocional(null)}>
                      Trocar tema
                    </button>
                    <button className="action-btn chunky" style={s.botaoPrimario} onClick={() => setPasso(1)} disabled={!devocional.texto}>
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {passo === 1 && (
                <>
                  <p style={s.rotuloPasso}>2. Reflita</p>
                  <p style={s.pergunta}>{devocional.q1}</p>
                  <p style={s.pergunta}>{devocional.q2}</p>
                  <textarea
                    style={s.textarea}
                    rows={4}
                    placeholder="Escreva livremente aqui, se quiser..."
                    value={reflexao}
                    onChange={(e) => setReflexao(e.target.value)}
                  />
                  <div style={s.linhaBotoes}>
                    <button className="action-btn chunky" style={s.botaoSecundario} onClick={() => setPasso(0)}>Voltar</button>
                    <button className="action-btn chunky" style={s.botaoPrimario} onClick={() => setPasso(2)}>Continuar</button>
                  </div>
                </>
              )}

              {passo === 2 && (
                <>
                  <p style={s.rotuloPasso}>3. Ore</p>
                  <p style={s.pergunta}>
                    Leve o que você escreveu diante de Deus, em silêncio ou em voz alta. Não precisa de palavras perfeitas — só sinceridade.
                  </p>
                  <div style={s.caixaOracao}>
                    <p style={s.oracao}>
                      &ldquo;Senhor, hoje eu trago a Ti o que sinto. Ajuda-me a confiar na Tua Palavra e a encontrar, nela, o que eu preciso agora. Amém.&rdquo;
                    </p>
                  </div>
                  <button className="action-btn chunky" style={{ ...s.botaoPrimario, width: "100%" }} onClick={concluir}>
                    Amém — concluir devocional
                  </button>
                </>
              )}
            </div>
          )}

          {concluido && (
            <div style={s.fim}>
              <p style={{ fontSize: 34, margin: "0 0 4px" }}>🔥</p>
              <h2 style={s.tituloSecao}>Você concluiu seu primeiro devocional!</h2>
              <p style={s.textoSecao}>
                Crie sua conta grátis para salvar este momento: ele vira o dia 1 da sua ofensiva, e sua reflexão fica
                guardada no seu diário.
              </p>
              <a href="/login?modo=cadastro" className="action-btn chunky" style={s.botaoCta} onClick={() => registrarEvento("entrada_cadastro_clicado", { local: "fim_devocional" })}>
                Salvar e criar minha conta grátis
              </a>
              <a href="/login" style={s.linkSecundario}>Já tenho conta — entrar</a>
            </div>
          )}
        </div>

        <div style={s.beneficios}>
          <div style={s.beneficio}><span style={s.iconeBeneficio}>📖</span><span>Devocional guiado de 5 minutos, pelo que você está sentindo</span></div>
          <div style={s.beneficio}><span style={s.iconeBeneficio}>⏰</span><span>Lembrete diário no horário que você escolher</span></div>
          <div style={s.beneficio}><span style={s.iconeBeneficio}>🙏</span><span>Pedidos de oração e amigos orando com você</span></div>
          <div style={s.beneficio}><span style={s.iconeBeneficio}>📜</span><span>Bíblia completa em Almeida, com áudio</span></div>
        </div>

        {!concluido && (
          <a href="/login?modo=cadastro" className="action-btn chunky" style={{ ...s.botaoCta, marginBottom: 10 }} onClick={() => registrarEvento("entrada_cadastro_clicado", { local: "rodape" })}>
            Criar conta grátis
          </a>
        )}
        <p style={s.rodape}>Gratuito. Versículos da tradução de Almeida (domínio público).</p>
      </div>
    </div>
  );
}

const serif = "'Fraunces', serif";

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EAF0EC 0%, #F1EEE3 55%, #F6EFE1 100%)",
    fontFamily: "'Karla', sans-serif",
    color: "#2D3B33",
    padding: "20px 16px 40px",
  },
  container: { maxWidth: 480, margin: "0 auto" },
  topo: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  marca: { fontWeight: 700, fontSize: 15, color: "#33422F" },
  linkEntrar: {
    fontWeight: 700,
    fontSize: 14,
    color: "#8A6224",
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #D9C48A",
    background: "#FFFDF6",
  },
  data: { textAlign: "center", fontSize: 13, color: "#7A8A7F", margin: "0 0 6px", textTransform: "capitalize" },
  titulo: { fontFamily: serif, fontWeight: 500, fontSize: 30, lineHeight: 1.2, textAlign: "center", margin: "0 0 10px", color: "#33422F" },
  subtitulo: { textAlign: "center", fontSize: 15, lineHeight: 1.5, color: "#5E6E63", margin: "0 0 24px" },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "24px 20px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
    textAlign: "center",
    marginBottom: 20,
  },
  pergaminho: {
    background: "linear-gradient(160deg, #F8EFD6 0%, #EFDFAF 100%)",
    border: "1px solid #D9C48A",
    boxShadow: "0 8px 22px rgba(139, 108, 46, 0.16)",
  },
  rotulo: { fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#A07A3E", margin: "0 0 12px" },
  versiculo: { fontFamily: serif, fontStyle: "italic", fontSize: 20, lineHeight: 1.55, margin: "0 0 10px" },
  referencia: { fontSize: 13, fontWeight: 700, color: "#8A7455", margin: "0 0 12px" },
  tituloSecao: { fontFamily: serif, fontWeight: 500, fontSize: 22, margin: "0 0 6px", color: "#33422F" },
  textoSecao: { fontSize: 14, lineHeight: 1.5, color: "#6B7A70", margin: "0 0 16px" },
  gradeMoods: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  botaoMood: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 6px",
    borderRadius: 14,
    border: "1px solid #E7E0D0",
    borderBottom: "3px solid #D8CFB8",
    background: "#FFFFFF",
    cursor: "pointer",
  },
  rotuloMood: { fontSize: 12, fontWeight: 600, color: "#4F5E54", textAlign: "center" },
  cabecalhoDevocional: { fontSize: 13, fontWeight: 700, color: "#7A8A7F", margin: "0 0 14px" },
  rotuloPasso: { fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#B98B4E", margin: "0 0 10px" },
  versiculoMenor: { fontFamily: serif, fontStyle: "italic", fontSize: 18, lineHeight: 1.55, margin: "0 0 8px" },
  carregando: { fontSize: 14, color: "#9AA79C", margin: "0 0 8px" },
  referenciaEsq: { fontSize: 13, fontWeight: 700, color: "#8A7455", margin: "0 0 10px" },
  pergunta: { fontSize: 15, lineHeight: 1.55, color: "#3E4D43", margin: "0 0 10px" },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    padding: 12,
    fontFamily: "'Karla', sans-serif",
    fontSize: 15,
    color: "#2D3B33",
    resize: "vertical",
  },
  caixaOracao: { background: "#F1EEE3", borderRadius: 12, padding: 16, margin: "12px 0 4px" },
  oracao: { fontFamily: serif, fontStyle: "italic", fontSize: 15, lineHeight: 1.6, color: "#4F6D5C", margin: 0 },
  linhaBotoes: { display: "flex", gap: 10 },
  botaoPrimario: {
    flex: 1,
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "4px solid #8A6224",
    borderRadius: 12,
    padding: "13px 18px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 16,
  },
  botaoSecundario: {
    background: "#FFFFFF",
    color: "#6B7A70",
    border: "1px solid #E7E0D0",
    borderBottom: "4px solid #D8CFB8",
    borderRadius: 12,
    padding: "13px 16px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 16,
  },
  fim: { padding: "4px 0" },
  botaoCta: {
    display: "block",
    width: "100%",
    textAlign: "center",
    background: "#D9A94C",
    color: "#2D2410",
    borderRadius: 12,
    borderBottom: "4px solid #A87A22",
    padding: "15px 18px",
    fontWeight: 800,
    fontSize: 16,
  },
  linkSecundario: { display: "block", marginTop: 14, fontSize: 14, fontWeight: 700, color: "#8A6224" },
  beneficios: { display: "grid", gap: 10, margin: "8px 0 24px" },
  beneficio: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.4,
    color: "#3E4D43",
  },
  iconeBeneficio: { fontSize: 20 },
  rodape: { textAlign: "center", fontSize: 12, color: "#9AA79C", margin: "8px 0 0" },
};
