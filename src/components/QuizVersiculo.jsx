"use client";

import { useEffect, useMemo, useState } from "react";
import { montarQuizDoDia } from "@/src/lib/devocional/quiz";

/**
 * Quiz rápido (1-2 perguntas de múltipla escolha) sobre o versículo do
 * dia -- reforça o que a pessoa acabou de ler, com feedback imediato.
 * Conta como a missão "Quiz do dia" (ver src/lib/devocional/missoes.js);
 * `onProgresso` avisa o componente pai quantas perguntas já foram
 * respondidas, pra alimentar essa missão.
 */
export default function QuizVersiculo({ entrada, texto, onProgresso }) {
  const perguntas = useMemo(() => montarQuizDoDia(entrada, texto), [entrada, texto]);
  const [respostas, setRespostas] = useState({});

  const totalRespondidas = Object.keys(respostas).length;

  useEffect(() => {
    onProgresso?.(totalRespondidas);
  }, [totalRespondidas, onProgresso]);

  // Reseta as respostas quando o versículo muda (ex: entra em outro dia).
  useEffect(() => {
    setRespostas({});
  }, [entrada?.ref]);

  if (!perguntas.length) return null;

  const acertos = perguntas.filter((p) => respostas[p.id] === p.respostaCorreta).length;

  return (
    <div style={estilos.card}>
      <p style={estilos.titulo}>🧠 Quiz do versículo</p>
      <p style={estilos.subtitulo}>Responda e veja se prestou atenção no que acabou de ler.</p>

      <div style={estilos.lista}>
        {perguntas.map((p, indice) => {
          const respondida = respostas[p.id] !== undefined;
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
            ? "🎉 Você acertou tudo! Boa leitura."
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
