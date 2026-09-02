/**
 * Quiz do versículo do dia -- 2 perguntas rápidas de interpretação, geradas
 * dinamicamente a partir de dados que já temos certeza que estão corretos
 * (os `moods`/`themes` que nós mesmos curamos em versiculos.js, e o texto
 * do versículo buscado ao vivo da Bíblia) -- assim não corremos o risco de
 * "inventar" uma pergunta de interpretação bíblica errada pra um dos 70+
 * versículos do pool. Fica mais parecido com "você prestou atenção no que
 * leu" do que uma prova de teologia.
 *
 *   1) Sentimento/situação: pra qual sentimento (ou, em datas
 *      comemorativas, qual data) esse versículo combina? -- 1 opção certa
 *      (tirada de moods/themes do próprio versículo) + 3 erradas.
 *   2) Lacuna: uma palavra do texto reaparece como lacuna pra completar --
 *      testa se a pessoa realmente leu o versículo.
 */
import { MOODS } from "./versiculos";
import { COMMEMORATIVE_LABELS } from "./datasComemorativas";

const PALAVRAS_ISCA = [
  "montanha", "deserto", "tempestade", "silêncio", "promessa", "aliança",
  "glória", "batalha", "jornada", "semente", "trovão", "estrela", "caminho",
  "sombra", "fogueira", "colheita", "muralha", "horizonte", "raiz", "ninho",
  "âncora", "farol", "trilha", "abrigo", "amanhecer", "vindima", "penhasco",
  "torrente", "vale", "planície",
];

const PALAVRAS_IGNORADAS = new Set([
  "para", "como", "mais", "muito", "quando", "porque", "porém", "então",
  "sobre", "entre", "ainda", "também", "sempre", "nunca", "onde", "quem",
  "aquele", "aquela", "aqueles", "aquelas", "todos", "todas", "outro",
  "outra", "certamente", "portanto", "assim", "mesmo", "mesma", "depois",
  "antes", "senhor", "deus", "cristo", "jesus",
]);

function embaralhar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function normalizar(palavra) {
  return palavra
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Pergunta 1: sentimento/situação (ou data comemorativa) associado. */
function montarPerguntaContexto(entrada) {
  if (entrada.moods?.length) {
    const idCorreto = entrada.moods[0];
    const correta = MOODS.find((m) => m.id === idCorreto);
    if (!correta) return null;
    const decoys = embaralhar(MOODS.filter((m) => !entrada.moods.includes(m.id))).slice(0, 3);
    if (decoys.length < 3) return null;
    const opcoes = embaralhar([correta, ...decoys]).map((m) => `${m.icon} ${m.label}`);
    return {
      id: "contexto",
      pergunta: "Esse versículo combina melhor com qual momento?",
      opcoes,
      respostaCorreta: `${correta.icon} ${correta.label}`,
    };
  }
  if (entrada.themes?.length) {
    const temaCorreto = entrada.themes[0];
    const labelCorreto = COMMEMORATIVE_LABELS[temaCorreto];
    if (!labelCorreto) return null;
    const outrosTemas = Object.keys(COMMEMORATIVE_LABELS).filter((t) => t !== temaCorreto);
    const decoys = embaralhar(outrosTemas).slice(0, 3).map((t) => COMMEMORATIVE_LABELS[t]);
    if (decoys.length < 3) return null;
    const opcoes = embaralhar([labelCorreto, ...decoys]);
    return {
      id: "contexto",
      pergunta: "Esse versículo está associado a qual data?",
      opcoes,
      respostaCorreta: labelCorreto,
    };
  }
  return null;
}

/** Pergunta 2: lacuna -- uma palavra do texto vira múltipla escolha. */
function montarPerguntaLacuna(texto) {
  if (!texto) return null;
  const palavras = texto.split(/\s+/).filter(Boolean);
  const candidatos = [];
  palavras.forEach((palavra, indice) => {
    const nucleo = palavra.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
    if (nucleo.length >= 6 && !PALAVRAS_IGNORADAS.has(normalizar(nucleo))) {
      candidatos.push({ indice, nucleo });
    }
  });
  if (!candidatos.length) return null;

  const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
  const textoNormalizado = normalizar(escolhido.nucleo);
  const palavrasNoTexto = new Set(palavras.map((p) => normalizar(p.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""))));

  const iscas = embaralhar(PALAVRAS_ISCA)
    .filter((isca) => normalizar(isca) !== textoNormalizado && !palavrasNoTexto.has(normalizar(isca)))
    .slice(0, 3);
  if (iscas.length < 3) return null;

  const frase = palavras
    .map((palavra, indice) => (indice === escolhido.indice ? palavra.replace(escolhido.nucleo, "_____") : palavra))
    .join(" ");

  const opcoes = embaralhar([escolhido.nucleo, ...iscas]);

  return {
    id: "lacuna",
    pergunta: "Qual palavra completa o versículo?",
    frase,
    opcoes,
    respostaCorreta: escolhido.nucleo,
  };
}

/** Pergunta 3: Ordenação de blocos de texto (estilo Duolingo). */
function montarPerguntaOrdenacao(texto) {
  if (!texto) return null;
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length < 5 || palavras.length > 25) return null;

  // Divide o texto em 4 a 6 blocos curtos de palavras
  const numBlocos = Math.min(6, Math.max(4, Math.floor(palavras.length / 3)));
  const tamanhoBloco = Math.ceil(palavras.length / numBlocos);
  const blocos = [];

  for (let i = 0; i < palavras.length; i += tamanhoBloco) {
    blocos.push(palavras.slice(i, i + tamanhoBloco).join(" "));
  }

  if (blocos.length < 3) return null;

  const blocosEmbaralhados = embaralhar(blocos);

  return {
    id: "ordenacao",
    pergunta: "Ordene os blocos para montar a mensagem do versículo:",
    blocos: blocosEmbaralhados,
    respostaCorreta: blocos, // Array de blocos na ordem original
  };
}

/** Pergunta 4: Testamento / Origem da passagem. */
function montarPerguntaOrigem(entrada) {
  if (!entrada || !entrada.ref) return null;
  const ref = entrada.ref;

  const ehNovoTestamento = /^(Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)/i.test(ref);

  const respostaCorreta = ehNovoTestamento ? "Novo Testamento" : "Antigo Testamento";
  const opcoes = ["Antigo Testamento", "Novo Testamento"];

  return {
    id: "origem",
    pergunta: "Este versículo pertence a qual parte da Bíblia?",
    opcoes,
    respostaCorreta,
  };
}

/**
 * Monta o quiz completo (com variação de perguntas) pro versículo do dia.
 */
export function montarQuizDoDia(entrada, texto) {
  const perguntasPossiveis = [
    montarPerguntaContexto(entrada),
    montarPerguntaLacuna(texto),
    montarPerguntaOrdenacao(texto),
    montarPerguntaOrigem(entrada),
  ].filter(Boolean);

  // Retorna até 2 ou 3 perguntas variadas a cada sessão
  return perguntasPossiveis.slice(0, 3);
}

