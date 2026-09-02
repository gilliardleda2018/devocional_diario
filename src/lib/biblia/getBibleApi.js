/**
 * Wrapper para a bible-api.com -- fonte do texto completo da tradução
 * Almeida em português. Trocamos a fonte anterior (api.getbible.net, uma
 * reimpressão de 1911 de uma edição de 1900 com ortografia pré-reforma:
 * "valle", "oleo", "aguas" sem acento, etc.) por esta, que serve a mesma
 * tradução de Almeida só que com ortografia corrigida/acentuação moderna
 * ("vale", "óleo", "águas"), de domínio público, sem chave de API.
 *
 *   - DATA_API/{ID}            -> lista os capítulos do livro (sem o texto,
 *                                 pra não precisar baixar um livro inteiro
 *                                 -- ex: Salmos tem 150 capítulos -- só pra
 *                                 montar a grade de capítulos)
 *   - DATA_API/{ID}/{capitulo} -> texto completo de um capítulo específico,
 *                                 buscado sob demanda quando o usuário abre
 *                                 aquele capítulo
 *
 * Cada livro/capítulo fica cacheado em memória do processo depois da
 * primeira busca.
 */

const DATA_API = "https://bible-api.com/data/almeida";

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

// Códigos USFM usados pela bible-api.com, na MESMA ordem de BOOKS_PT (índice
// numeroDoLivro - 1 funciona pros dois arrays).
const BOOK_IDS = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT",
  "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH",
  "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA",
  "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA",
  "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO",
  "GAL", "EPH", "PHP", "COL", "1TH", "2TH",
  "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE",
  "1JN", "2JN", "3JN", "JUD", "REV",
];

// Nomes em inglês, na mesma ordem, usados só pra interpretar as referências
// de src/lib/devocional/versiculos.js (ex: "Psalms 23:1") -- essas
// referências continuam em inglês porque é o formato que a API de busca
// por referência entende melhor entre tradições/línguas.
const ENGLISH_BOOK_NAMES = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
  "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Songs", "Isaiah",
  "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
  "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation",
];

const cacheListaCapitulos = new Map();
const cacheCapitulos = new Map();
const cacheVersiculos = new Map();

function limparTexto(texto) {
  return texto.replace(/\s+/g, " ").trim();
}

/**
 * Lista os números de capítulo do livro (leve -- ainda sem o texto dos
 * versículos, só o necessário pra montar a grade de capítulos e saber
 * onde o livro termina).
 */
export async function buscarLivro(numeroDoLivro) {
  if (cacheListaCapitulos.has(numeroDoLivro)) {
    return cacheListaCapitulos.get(numeroDoLivro);
  }
  const bookId = BOOK_IDS[numeroDoLivro - 1];
  const resposta = await fetch(`${DATA_API}/${bookId}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar o livro ${numeroDoLivro} (status ${resposta.status})`);
  }
  const dados = await resposta.json();
  const chapters = (dados.chapters ?? []).map((c) => ({ chapter: c.chapter }));
  const resultado = { chapters };
  cacheListaCapitulos.set(numeroDoLivro, resultado);
  return resultado;
}

/**
 * Busca o texto de um capítulo específico, sob demanda (só quando o
 * usuário realmente abre aquele capítulo -- evita baixar livros inteiros
 * de uma vez, como Salmos com seus 150 capítulos).
 */
export async function buscarCapitulo(numeroDoLivro, capitulo) {
  const chave = `${numeroDoLivro}:${capitulo}`;
  if (cacheCapitulos.has(chave)) {
    return cacheCapitulos.get(chave);
  }
  const bookId = BOOK_IDS[numeroDoLivro - 1];
  const resposta = await fetch(`${DATA_API}/${bookId}/${capitulo}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar o capítulo ${capitulo} (status ${resposta.status})`);
  }
  const dados = await resposta.json();
  const verses = (dados.verses ?? []).map((v) => ({ verse: v.verse, text: limparTexto(v.text) }));
  const resultado = { chapter: capitulo, verses };
  cacheCapitulos.set(chave, resultado);
  return resultado;
}

/**
 * Busca o texto de uma referência específica em inglês (ex: "Psalms 23:1",
 * "Philippians 4:6-7") -- usado pelo versículo do dia e pelo devocional
 * guiado, que trabalham com um pool de referências curadas (ver
 * src/lib/devocional/versiculos.js). Sempre dentro de um único capítulo.
 */
export async function buscarTextoReferencia(referenciaEmIngles) {
  if (cacheVersiculos.has(referenciaEmIngles)) {
    return cacheVersiculos.get(referenciaEmIngles);
  }

  const match = referenciaEmIngles.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) {
    throw new Error(`Referência "${referenciaEmIngles}" em formato inesperado`);
  }
  const [, nomeLivro, capituloStr, versiculoInicioStr, versiculoFimStr] = match;
  const indice = ENGLISH_BOOK_NAMES.findIndex((nome) => nome === nomeLivro);
  if (indice === -1) {
    throw new Error(`Livro "${nomeLivro}" não reconhecido`);
  }
  const capitulo = parseInt(capituloStr, 10);
  const versiculoInicio = parseInt(versiculoInicioStr, 10);
  const versiculoFim = versiculoFimStr ? parseInt(versiculoFimStr, 10) : versiculoInicio;

  const dadosCapitulo = await buscarCapitulo(indice + 1, capitulo);
  const versiculos = dadosCapitulo.verses.filter((v) => v.verse >= versiculoInicio && v.verse <= versiculoFim);
  if (!versiculos.length) {
    throw new Error(`Referência "${referenciaEmIngles}" não encontrada`);
  }
  const texto = versiculos.map((v) => v.text).join(" ");
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
