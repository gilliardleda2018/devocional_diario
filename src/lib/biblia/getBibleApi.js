/**
 * Wrapper para a getBible API -- fonte do texto completo da tradução
 * Almeida (reimpressão de 1911 de uma edição de 1900 de João Ferreira de
 * Almeida, domínio público, licença GPL). Endpoints e formato verificados
 * na versão anterior do app (artifact do Claude.ai) que já rodava em
 * produção -- portados aqui sem alteração de comportamento.
 *
 *   - BIBLE_API/{numeroDoLivro}.json      -> livro inteiro (todos os capítulos)
 *   - QUERY_API/{referencia em inglês}    -> um versículo ou intervalo específico
 *
 * Não embutimos os ~31 mil versículos no projeto: cada livro é buscado sob
 * demanda quando o usuário abre ele (ou quando o devocional/versículo do
 * dia precisa de um texto específico), e fica cacheado em memória do
 * processo.
 */

const BIBLE_API = "https://api.getbible.net/v2/almeida";
const QUERY_API = "https://query.getbible.net/v2/almeida";

export const BOOKS_PT = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute",
  "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias",
  "Ester", "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cantares de Salomão", "Isaías",
  "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Obadias",
  "Jonas", "Miqueias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias",
  "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios",
  "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses",
  "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro",
  "1 João", "2 João", "3 João", "Judas", "Apocalipse",
];
export const OLD_TESTAMENT_COUNT = 39;

const cacheLivros = new Map();
const cacheVersiculos = new Map();

/** Busca o livro inteiro (todos os capítulos) pelo número (1-66). */
export async function buscarLivro(numeroDoLivro) {
  if (cacheLivros.has(numeroDoLivro)) {
    return cacheLivros.get(numeroDoLivro);
  }
  const resposta = await fetch(`${BIBLE_API}/${numeroDoLivro}.json`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar o livro ${numeroDoLivro} (status ${resposta.status})`);
  }
  const dados = await resposta.json();
  cacheLivros.set(numeroDoLivro, dados);
  return dados;
}

/**
 * Busca o texto de uma referência específica em inglês (ex: "Psalms 23:1",
 * "Philippians 4:6-7") -- usado pelo versículo do dia e pelo devocional
 * guiado, que trabalham com um pool de referências curadas (ver
 * src/lib/devocional/versiculos.js).
 */
export async function buscarTextoReferencia(referenciaEmIngles) {
  if (cacheVersiculos.has(referenciaEmIngles)) {
    return cacheVersiculos.get(referenciaEmIngles);
  }
  const url = `${QUERY_API}/${encodeURIComponent(referenciaEmIngles)}`;
  const resposta = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar "${referenciaEmIngles}" (status ${resposta.status})`);
  }
  const dados = await resposta.json();
  const grupo = Object.values(dados)[0];
  if (!grupo || !grupo.verses || !grupo.verses.length) {
    throw new Error(`Referência "${referenciaEmIngles}" não encontrada`);
  }
  const texto = grupo.verses.map((v) => v.text.trim()).join(" ");
  cacheVersiculos.set(referenciaEmIngles, texto);
  return texto;
}

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Interpreta uma referência livre em português (ex: "João 3:16", "Salmos
 * 23") digitada na busca da leitura livre -> { numeroDoLivro, capitulo }.
 * Não usa versículo (a leitura livre sempre abre o capítulo inteiro).
 */
export function interpretarReferenciaPortugues(entrada) {
  const texto = entrada.trim();
  const match = texto.match(/^(.*?)\s*(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const nomeLivro = match[1].trim();
  const capitulo = parseInt(match[2], 10);
  if (!nomeLivro || !capitulo) return null;

  const alvo = normalizar(nomeLivro);
  const indice = BOOKS_PT.findIndex((nome) => normalizar(nome) === alvo);
  if (indice === -1) return null;

  return { numeroDoLivro: indice + 1, capitulo };
}
