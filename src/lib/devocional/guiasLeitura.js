/**
 * Guias de leitura personalizados: "por onde eu começo a ler a Bíblia,
 * dado o que estou enfrentando agora?" -- reaproveita os mesmos temas
 * (MOODS) do devocional guiado em src/lib/devocional/versiculos.js, mas
 * aqui a recomendação é de LIVROS/capítulos inteiros pra ler na aba
 * "Bíblia completa", não um único versículo avulso.
 *
 * `nome` precisa bater exatamente com uma entrada de BOOKS_PT
 * (src/lib/biblia/getBibleApi.js) -- é assim que o número do livro é
 * resolvido em tempo de execução.
 */
export const GUIAS_LEITURA = {
  ansioso: {
    titulo: "Para acalmar a ansiedade",
    descricao: "Textos sobre confiança e cuidado de Deus em meio à preocupação.",
    livros: [
      { nome: "Salmos", capitulo: 23, motivo: "Cuidado e provisão em meio à dificuldade." },
      { nome: "Filipenses", capitulo: 4, motivo: "Como entregar a ansiedade em oração." },
      { nome: "Mateus", capitulo: 6, motivo: "Jesus ensina a não se preocupar com o amanhã." },
    ],
  },
  triste: {
    titulo: "Para os dias tristes",
    descricao: "Passagens de consolo para quem está de coração pesado.",
    livros: [
      { nome: "Salmos", capitulo: 34, motivo: "Deus perto dos que têm o coração quebrantado." },
      { nome: "Lamentações", capitulo: 3, motivo: "Esperança e fidelidade renovadas a cada manhã." },
      { nome: "João", capitulo: 14, motivo: "Palavras de consolo de Jesus aos discípulos." },
    ],
  },
  cansado: {
    titulo: "Para quando falta força",
    descricao: "Textos sobre descanso e renovação para quem está exausto(a).",
    livros: [
      { nome: "Mateus", capitulo: 11, motivo: "“Vinde a mim todos os que estais cansados...”" },
      { nome: "Isaías", capitulo: 40, motivo: "Os que esperam no Senhor renovam as forças." },
      { nome: "Salmos", capitulo: 62, motivo: "Descanso só em Deus." },
    ],
  },
  com_medo: {
    titulo: "Para enfrentar o medo",
    descricao: "Promessas de coragem e presença de Deus em situações difíceis.",
    livros: [
      { nome: "Josué", capitulo: 1, motivo: "“Sê forte e corajoso... o Senhor está contigo.”" },
      { nome: "Salmos", capitulo: 27, motivo: "O Senhor como luz e defesa." },
      { nome: "Isaías", capitulo: 41, motivo: "“Não temas, porque eu sou contigo.”" },
    ],
  },
  solitario: {
    titulo: "Para quando bate a solidão",
    descricao: "Lembretes de que você não está, de fato, sozinho(a).",
    livros: [
      { nome: "Salmos", capitulo: 68, motivo: "Deus como pai e companhia dos solitários." },
      { nome: "Hebreus", capitulo: 13, motivo: "“Nunca te deixarei, nunca te abandonarei.”" },
      { nome: "Rute", capitulo: 1, motivo: "Uma história de lealdade e companhia inesperada." },
    ],
  },
  sem_esperanca: {
    titulo: "Para recuperar a esperança",
    descricao: "Textos sobre um recomeço possível, mesmo quando tudo parece perdido.",
    livros: [
      { nome: "Romanos", capitulo: 8, motivo: "Todas as coisas cooperam para o bem." },
      { nome: "Jeremias", capitulo: 29, motivo: "“Planos de paz, e não de mal... um futuro e uma esperança.”" },
      { nome: "Lamentações", capitulo: 3, motivo: "Misericórdias que se renovam a cada manhã." },
    ],
  },
  grato: {
    titulo: "Para cultivar a gratidão",
    descricao: "Passagens que colocam em palavras o que é agradecer a Deus.",
    livros: [
      { nome: "Salmos", capitulo: 100, motivo: "Um convite direto à gratidão e à alegria." },
      { nome: "1 Tessalonicenses", capitulo: 5, motivo: "“Em tudo dai graças.”" },
      { nome: "Salmos", capitulo: 103, motivo: "Uma lista de motivos para louvar." },
    ],
  },
  em_paz: {
    titulo: "Para aprofundar essa paz",
    descricao: "Textos para sustentar e entender de onde vem a paz verdadeira.",
    livros: [
      { nome: "Filipenses", capitulo: 4, motivo: "A paz que excede todo entendimento." },
      { nome: "Colossenses", capitulo: 3, motivo: "Deixar a paz de Cristo governar o coração." },
      { nome: "João", capitulo: 14, motivo: "“A minha paz vos dou.”" },
    ],
  },
  alegre: {
    titulo: "Para celebrar essa alegria",
    descricao: "Textos que convidam a louvar e compartilhar o que está bom.",
    livros: [
      { nome: "Salmos", capitulo: 100, motivo: "Louvor com alegria." },
      { nome: "Filipenses", capitulo: 4, motivo: "“Alegrai-vos sempre no Senhor.”" },
      { nome: "Neemias", capitulo: 8, motivo: "“A alegria do Senhor é a vossa força.”" },
    ],
  },
  buscando_direcao: {
    titulo: "Para buscar direção",
    descricao: "Textos sobre discernimento e confiança na hora de decidir.",
    livros: [
      { nome: "Provérbios", capitulo: 3, motivo: "Confiar no Senhor de todo o coração." },
      { nome: "Tiago", capitulo: 1, motivo: "Pedir sabedoria a Deus sem hesitar." },
      { nome: "Salmos", capitulo: 32, motivo: "“Eu te instruirei... o caminho que deves seguir.”" },
    ],
  },
  precisando_de_forca: {
    titulo: "Para renovar as forças",
    descricao: "Textos sobre onde buscar força quando a sua já não é suficiente.",
    livros: [
      { nome: "Isaías", capitulo: 40, motivo: "Forças renovadas para os que esperam no Senhor." },
      { nome: "Filipenses", capitulo: 4, motivo: "“Tudo posso naquele que me fortalece.”" },
      { nome: "Efésios", capitulo: 6, motivo: "A armadura de Deus para os dias difíceis." },
    ],
  },
  cura: {
    titulo: "Para pedir cura",
    descricao: "Textos sobre cura do corpo, da mente e do coração.",
    livros: [
      { nome: "Salmos", capitulo: 103, motivo: "Deus que perdoa e cura todas as enfermidades." },
      { nome: "Tiago", capitulo: 5, motivo: "A oração de fé e a cura." },
      { nome: "Isaías", capitulo: 53, motivo: "“Pelas suas pisaduras fomos sarados.”" },
    ],
  },
};
