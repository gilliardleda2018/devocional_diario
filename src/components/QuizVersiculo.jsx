"use client";

import { useEffect, useMemo, useState } from "react";
import { montarQuizDoDia } from "@/src/lib/devocional/quiz";

/**
 * Quiz rápido (múltipla escolha, lacunas e ordenação de blocos) sobre o
 * versículo do dia -- reforça o aprendizado com feedback imediato.
 */
export default function QuizVersiculo({ entrada, texto, onProgresso }) {
  const perguntas = useMemo(() => montarQuizDoDia(entrada, texto), [entrada, texto]);
  const [respostas, setRespostas] = useState({});
  const [selecoesOrdenacao, setSelecoesOrdenacao] = useState({});

  const totalRespondidas = Object.keys(respostas).length;

  useEffect(() => {
    onProgresso?.(totalRespondidas);
  }, [totalRespondidas, onProgresso]);

  // Reseta as respostas quando o versículo muda.
  useEffect(() => {
    setRespostas({});
    setSelecoesOrdenacao({});
  }, [entrada?.ref]);

  if (!perguntas.length) return null;

  function verificarAcerto(p) {
    if (p.id === "ordenacao") {
      const selecao = selecoesOrdenacao[p.id] || [];
      if (selecao.length !== p.respostaCorreta.length) return false;
      return selecao.every((bloco, idx) => bloco === p.respostaCorreta[idx]);
    }
    return respostas[p.id] === p.respostaCorreta;
  }

  const acertos = perguntas.filter((p) => verificarAcerto(p)).length;

  function handleCliqueBloco(p, bloco) {
    if (respostas[p.id] !== undefined) return;
    const atual = selecoesOrdenacao[p.id] || [];
    if (atual.includes(bloco)) return;
    const nova = [...atual, bloco];
    setSelecoesOrdenacao((prev) => ({ ...prev, [p.id]: nova }));

    // Se completou todos os blocos, avalia a resposta
    if (nova.length === p.respostaCorreta.length) {
      const correto = nova.every((b, idx) => b === p.respostaCorreta[idx]);
      setRespostas((prev) => ({ ...prev, [p.id]: correto ? "correto" : "errado" }));
    }
  }

  function handleResetBlocos(pId) {
    if (respostas[pId] !== undefined) return;
    setSelecoesOrdenacao((prev) => ({ ...prev, [pId]: [] }));
  }

  return (
    <div style={estilos.card}>
      <p style={estilos.titulo}>🧠 Quiz do versículo</p>
      <p style={estilos.subtitulo}>Responda e veja se prestou atenção no que acabou de ler.</p>

      <div style={estilos.lista}>
        {perguntas.map((p, indice) => {
          const respondida = respostas[p.id] !== undefined;

          if (p.id === "ordenacao") {
            const selecao = selecoesOrdenacao[p.id] || [];
            const ehCorreto = respostas[p.id] === "correto";

            return (
              <div key={p.id} style={estilos.pergunta}>
                <p style={estilos.perguntaTexto}>
                  {indice + 1}. {p.pergunta}
                </p>
                {/* Área de montagem */}
                <div style={estilos.areaMontagem}>
                  {selecao.length === 0 ? (
                    <span style={{ fontSize: 12, color: "#9AA79C", fontStyle: "italic" }}>
                      Clique nos blocos abaixo na ordem correta...
                    </span>
                  ) : (
                    selecao.map((b, i) => (
                      <span key={i} style={estilos.blocoSelecionado}>
                        {b}
                      </span>
                    ))
                  )}
                </div>

                {/* Blocos disponíveis para escolha */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {p.blocos.map((bloco, idx) => {
                    const jaUsado = selecao.includes(bloco);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="action-btn"
                        style={{
                          ...estilos.blocoOpcao,
                          opacity: jaUsado ? 0.35 : 1,
                          pointerEvents: jaUsado || respondida ? "none" : "auto",
                        }}
                        onClick={() => handleCliqueBloco(p, bloco)}
                      >
                        {bloco}
                      </button>
                    );
                  })}
                </div>

                {!respondida && selecao.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleResetBlocos(p.id)}
                    style={estilos.btnLimpar}
                  >
                    🔄 Recomeçar ordem
                  </button>
                )}

                {respondida && (
                  <p style={ehCorreto ? estilos.feedbackSucesso : estilos.feedbackErro}>
                    {ehCorreto ? "✓ Parabéns! Frase ordenada corretamente." : "✕ Que pena! A ordem dos blocos não ficou exata."}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={p.id} style={estilos.pergunta}>
              <p style={estilos.perguntaTexto}>
                {indice + 1}. {p.pergunta}
              </p>
              {p.frase && <p style={estilos.frase}>&ldquo;{p.frase}&rdquo;</p>}
              <div style={estilos.opcoes}>
                {p.opcoes.map((opcao) => {
                  const selecionada = respostas[p.id] === opcao;
                  const ehCorreta = opcao === p.respostaCorreta;
                  let estiloOpcao = estilos.opcao;
                  if (respondida && ehCorreta) estiloOpcao = { ...estilos.opcao, ...estilos.opcaoCorreta };
                  else if (respondida && selecionada) estiloOpcao = { ...estilos.opcao, ...estilos.opcaoErrada };
                  return (
                    <button
                      key={opcao}
                      type="button"
                      className="action-btn"
                      style={estiloOpcao}
                      disabled={respondida}
                      onClick={() => setRespostas((atual) => ({ ...atual, [p.id]: opcao }))}
                    >
                      {opcao}
                      {respondida && ehCorreta && " ✓"}
                      {respondida && selecionada && !ehCorreta && " ✕"}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {totalRespondidas === perguntas.length && (
        <p style={estilos.resultado}>
          {acertos === perguntas.length
            ? "🎉 Você acertou tudo! Excelente memorização."
            : `Você acertou ${acertos} de ${perguntas.length}. Vale reler o versículo com calma.`}
        </p>
      )}
    </div>
  );
}

const estilos = {
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "18px 18px 20px",
    marginBottom: 20,
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
  },
  titulo: { fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 18, margin: "0 0 4px", color: "#33422F" },
  subtitulo: { fontSize: 12.5, color: "#7A8A7F", margin: "0 0 16px" },
  lista: { display: "flex", flexDirection: "column", gap: 18 },
  pergunta: {},
  perguntaTexto: { fontSize: 13.5, fontWeight: 700, color: "#33422F", margin: "0 0 6px" },
  frase: { fontSize: 12.5, color: "#5C6B5F", fontStyle: "italic", margin: "0 0 10px", lineHeight: 1.4 },
  opcoes: { display: "flex", flexDirection: "column", gap: 8 },
  opcao: {
    textAlign: "left",
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderBottom: "2px solid #D8CFB8",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#3C4A3F",
    cursor: "pointer",
  },
  opcaoCorreta: {
    background: "#E9F5EA",
    border: "1px solid #A9D9B0",
    borderBottom: "2px solid #7FB88A",
    color: "#2E5B37",
  },
  opcaoErrada: {
    background: "#FBEAE6",
    border: "1px solid #F0B8A9",
    borderBottom: "2px solid #E08F78",
    color: "#8A3A26",
  },
  areaMontagem: {
    minHeight: 46,
    background: "#FFFFFF",
    border: "1.5px dashed #D8CEBB",
    borderRadius: 10,
    padding: "8px 12px",
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  blocoSelecionado: {
    background: "#EAF0EC",
    border: "1px solid #B4C7BA",
    color: "#2D3B33",
    fontSize: 12.5,
    fontWeight: 700,
    padding: "4px 9px",
    borderRadius: 6,
  },
  blocoOpcao: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderBottom: "2px solid #D8CFB8",
    borderRadius: 8,
    padding: "6px 11px",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#33422F",
    cursor: "pointer",
  },
  btnLimpar: {
    marginTop: 8,
    background: "none",
    border: "none",
    fontSize: 11.5,
    color: "#8A7656",
    cursor: "pointer",
    textDecoration: "underline",
  },
  feedbackSucesso: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#2E5B37",
    marginTop: 8,
    margin: 0,
  },
  feedbackErro: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#8A3A26",
    marginTop: 8,
    margin: 0,
  },
  resultado: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #EFEAD9",
    fontSize: 13,
    fontWeight: 700,
    color: "#33422F",
    textAlign: "center",
  },
};
