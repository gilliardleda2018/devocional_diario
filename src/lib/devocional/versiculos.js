/**
 * Banco de versículos do devocional guiado e do versículo do dia.
 *
 * Portado da versão anterior do app (que já rodava em produção como
 * artifact do Claude.ai) sem alteração de conteúdo -- cada entrada tem:
 *   - ref: referência em inglês, usada para buscar o texto ao vivo via
 *     buscarTextoReferencia() (a query API da getBible usa nomes de livro
 *     em inglês)
 *   - label: a mesma referência em português, para exibição
 *   - moods: temas de oração do devocional guiado que podem sortear este
 *     versículo (pickRandom entre as combinações -- dá variedade)
 *   - themes: datas comemorativas em que este versículo pode aparecer como
 *     versículo do dia (opcional -- nem todo versículo tem)
 */
export const VERSE_REFS = [
  { ref: "Psalms 23:1", label: "Salmos 23:1", moods: ["ansioso", "cansado", "em_paz"] },
  { ref: "Philippians 4:6-7", label: "Filipenses 4:6-7", moods: ["ansioso", "com_medo"] },
  { ref: "Isaiah 41:10", label: "Isaías 41:10", moods: ["com_medo", "ansioso", "precisando_de_forca"] },
  { ref: "Matthew 11:28", label: "Mateus 11:28", moods: ["cansado", "triste"] },
  { ref: "Psalms 34:18", label: "Salmos 34:18", moods: ["triste", "solitario"] },
  { ref: "Proverbs 3:5-6", label: "Provérbios 3:5-6", moods: ["buscando_direcao", "ansioso"] },
  { ref: "Romans 8:28", label: "Romanos 8:28", moods: ["sem_esperanca", "buscando_direcao"] },
  { ref: "Psalms 46:1", label: "Salmos 46:1", moods: ["com_medo", "cansado"] },
  { ref: "Jeremiah 29:11", label: "Jeremias 29:11", moods: ["sem_esperanca", "buscando_direcao"] },
  { ref: "Psalms 27:1", label: "Salmos 27:1", moods: ["com_medo"] },
  { ref: "1 Peter 5:7", label: "1 Pedro 5:7", moods: ["ansioso", "cansado"] },
  { ref: "Psalms 121:1-2", label: "Salmos 121:1-2", moods: ["ansioso", "buscando_direcao"] },
  { ref: "Galatians 6:9", label: "Gálatas 6:9", moods: ["cansado", "sem_esperanca"] },
  { ref: "Joshua 1:9", label: "Josué 1:9", moods: ["com_medo", "precisando_de_forca"] },
  { ref: "Psalms 30:5", label: "Salmos 30:5", moods: ["triste", "sem_esperanca"] },
  { ref: "Lamentations 3:22-23", label: "Lamentações 3:22-23", moods: ["sem_esperanca", "grato"], themes: ["ano_novo"] },
  { ref: "Philippians 4:13", label: "Filipenses 4:13", moods: ["precisando_de_forca", "cansado"] },
  { ref: "Isaiah 40:31", label: "Isaías 40:31", moods: ["cansado", "precisando_de_forca"] },
  { ref: "Matthew 6:34", label: "Mateus 6:34", moods: ["ansioso"] },
  { ref: "Psalms 55:22", label: "Salmos 55:22", moods: ["cansado", "ansioso"] },
  { ref: "2 Corinthians 12:9", label: "2 Coríntios 12:9", moods: ["cansado", "sem_esperanca"] },
  { ref: "Proverbs 17:22", label: "Provérbios 17:22", moods: ["triste", "alegre"] },
  { ref: "Ecclesiastes 3:1", label: "Eclesiastes 3:1", moods: ["buscando_direcao", "triste"] },
  { ref: "Psalms 37:4", label: "Salmos 37:4", moods: ["alegre", "buscando_direcao"] },
  { ref: "Hebrews 13:5", label: "Hebreus 13:5", moods: ["solitario", "com_medo"] },
  { ref: "Romans 15:13", label: "Romanos 15:13", moods: ["sem_esperanca", "triste"] },
  { ref: "Psalms 91:1-2", label: "Salmos 91:1-2", moods: ["com_medo", "cansado"] },
  { ref: "James 1:2-4", label: "Tiago 1:2-4", moods: ["sem_esperanca", "precisando_de_forca"] },
  { ref: "Philippians 4:19", label: "Filipenses 4:19", moods: ["ansioso", "grato"] },
  { ref: "Matthew 5:4", label: "Mateus 5:4", moods: ["triste"] },
  { ref: "Isaiah 26:3", label: "Isaías 26:3", moods: ["ansioso", "em_paz"] },
  { ref: "Psalms 139:23-24", label: "Salmos 139:23-24", moods: ["buscando_direcao"] },
  { ref: "1 Corinthians 13:4-7", label: "1 Coríntios 13:4-7", moods: ["solitario", "alegre"], themes: ["namorados"] },
  { ref: "Ephesians 2:8-9", label: "Efésios 2:8-9", moods: ["grato", "sem_esperanca"] },
  { ref: "Psalms 23:4", label: "Salmos 23:4", moods: ["com_medo", "triste"] },
  { ref: "Revelation 21:4", label: "Apocalipse 21:4", moods: ["triste", "sem_esperanca"] },
  { ref: "Psalms 118:24", label: "Salmos 118:24", moods: ["alegre", "grato"] },
  { ref: "Proverbs 16:3", label: "Provérbios 16:3", moods: ["buscando_direcao", "ansioso"] },
  { ref: "Colossians 3:15", label: "Colossenses 3:15", moods: ["em_paz", "grato"] },
  { ref: "Psalms 103:2-3", label: "Salmos 103:2-3", moods: ["grato"] },
  { ref: "Matthew 6:33", label: "Mateus 6:33", moods: ["buscando_direcao", "ansioso"] },
  { ref: "Psalms 42:11", label: "Salmos 42:11", moods: ["triste", "sem_esperanca"] },
  { ref: "Nahum 1:7", label: "Naum 1:7", moods: ["com_medo", "cansado"] },
  { ref: "Psalms 34:8", label: "Salmos 34:8", moods: ["grato", "em_paz"] },
  { ref: "Ruth 1:16", label: "Rute 1:16", moods: ["solitario"] },
  { ref: "Psalms 30:11", label: "Salmos 30:11", moods: ["triste", "alegre"] },
  { ref: "Psalms 4:8", label: "Salmos 4:8", moods: ["ansioso", "em_paz"] },

  // Cura (pedido explícito de oração por cura)
  { ref: "Jeremiah 17:14", label: "Jeremias 17:14", moods: ["cura"] },
  { ref: "Psalms 147:3", label: "Salmos 147:3", moods: ["cura", "triste"] },
  { ref: "James 5:15", label: "Tiago 5:15", moods: ["cura"] },
  { ref: "Exodus 15:26", label: "Êxodo 15:26", moods: ["cura"] },
  { ref: "Isaiah 53:5", label: "Isaías 53:5", moods: ["cura"], themes: ["sexta_santa"] },
  { ref: "3 John 1:2", label: "3 João 1:2", moods: ["cura", "grato"] },

  // Datas comemorativas
  { ref: "Proverbs 31:28", label: "Provérbios 31:28", themes: ["maes"] },
  { ref: "Isaiah 66:13", label: "Isaías 66:13", themes: ["maes"] },
  { ref: "Proverbs 31:25", label: "Provérbios 31:25", themes: ["maes"] },
  { ref: "Proverbs 22:6", label: "Provérbios 22:6", themes: ["pais"] },
  { ref: "Psalms 103:13", label: "Salmos 103:13", themes: ["pais"] },
  { ref: "Ephesians 6:4", label: "Efésios 6:4", themes: ["pais"] },
  { ref: "Song of Songs 8:7", label: "Cantares de Salomão 8:7", themes: ["namorados"] },
  { ref: "1 John 4:7-8", label: "1 João 4:7-8", themes: ["namorados"] },
  { ref: "Psalms 127:3", label: "Salmos 127:3", themes: ["criancas"] },
  { ref: "Mark 10:14", label: "Marcos 10:14", themes: ["criancas"] },
  { ref: "Isaiah 43:19", label: "Isaías 43:19", themes: ["ano_novo"] },
  { ref: "2 Corinthians 5:17", label: "2 Coríntios 5:17", themes: ["ano_novo"] },
  { ref: "1 Peter 2:24", label: "1 Pedro 2:24", themes: ["sexta_santa"] },
  { ref: "1 Corinthians 15:55", label: "1 Coríntios 15:55", themes: ["pascoa"] },
  { ref: "John 11:25", label: "João 11:25", themes: ["pascoa"] },
  { ref: "Luke 2:11", label: "Lucas 2:11", themes: ["natal"] },
  { ref: "Isaiah 9:6", label: "Isaías 9:6", themes: ["natal"] },
  { ref: "John 3:16", label: "João 3:16", themes: ["natal"] },
];

export const MOODS = [
  { id: "ansioso", label: "Ansioso(a)", icon: "🌬️" },
  { id: "triste", label: "Triste", icon: "🌧️" },
  { id: "cansado", label: "Cansado(a)", icon: "🕯️" },
  { id: "com_medo", label: "Com medo", icon: "🌑" },
  { id: "solitario", label: "Sozinho(a)", icon: "🌙" },
  { id: "sem_esperanca", label: "Sem esperança", icon: "🍂" },
  { id: "grato", label: "Grato(a)", icon: "🌾" },
  { id: "em_paz", label: "Em paz", icon: "🌊" },
  { id: "alegre", label: "Alegre", icon: "🌻" },
  { id: "buscando_direcao", label: "Buscando direção", icon: "🧭" },
  { id: "precisando_de_forca", label: "Precisando de força", icon: "🔥" },
  { id: "cura", label: "Pedindo cura", icon: "🙏" },
];

export const REFLECTIONS = {
  ansioso: ["O que, especificamente, está pesando na sua mente agora?", "Existe algo nessa preocupação que você pode entregar hoje, em vez de carregar sozinho(a)?"],
  triste: ["O que você sente que precisa ser dito, mesmo que só a Deus?", "Há algum consolo pequeno, de hoje, que você pode reconhecer?"],
  cansado: ["Onde, na sua rotina, você tem se esquecido de descansar?", "O que significaria, na prática, 'descarregar' algo hoje?"],
  com_medo: ["Nomeie o medo. Ele fica menor quando é dito com clareza?", "O que mudaria se você acreditasse, por um instante, que não está sozinho(a) nisso?"],
  solitario: ["Quem você sente falta de ouvir hoje — e o que gostaria de dizer a essa pessoa?", "Como seria buscar companhia, mesmo pequena, ainda hoje?"],
  sem_esperanca: ["Que 'manhã' você está esperando ver de novo?", "Há algum sinal, por menor que seja, de que as coisas podem mudar?"],
  grato: ["O que de bom aconteceu hoje que quase passou despercebido?", "A quem você poderia agradecer, hoje, por algo específico?"],
  em_paz: ["O que trouxe essa paz — e como sustentá-la amanhã?", "Como essa paz pode se tornar um presente para alguém ao seu redor hoje?"],
  alegre: ["O que está alimentando essa alegria?", "Como você pode compartilhar isso com alguém hoje?"],
  buscando_direcao: ["Qual decisão está pedindo clareza agora?", "Se você tirasse o medo da equação, o que faria a seguir?"],
  precisando_de_forca: ["De onde você tem tirado força até agora?", "O que 'um passo' pareceria hoje, sem precisar resolver tudo de uma vez?"],
  cura: ["Que cura você está pedindo hoje — do corpo, da mente ou do coração?", "Há alguém que você também gostaria de levar a Deus em oração por cura?"],
};

export function encontrarMood(id) {
  return MOODS.find((m) => m.id === id) ?? null;
}

export function escolherAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}
