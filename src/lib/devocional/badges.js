/**
 * Catálogo de conquistas (badges). São derivadas dos números que já
 * vivem no banco (total de devocionais, temas distintos usados, maior
 * ofensiva) em vez de guardadas numa tabela à parte -- assim uma
 * conquista nunca se "perde" mesmo que a sequência atual quebre, e não
 * precisamos de lógica extra pra concedê-las: elas são só uma função
 * pura de `obter_estatisticas_usuario()`.
 */
export const CATALOGO_BADGES = [
  {
    id: "primeira_oracao",
    nome: "Primeira Oração",
    descricao: "Complete seu primeiro devocional guiado.",
    icone: "🙏",
    verificar: (stats) => stats.total_devocionais >= 1,
  },
  {
    id: "dez_devocionais",
    nome: "Constância",
    descricao: "Complete 10 devocionais.",
    icone: "📖",
    verificar: (stats) => stats.total_devocionais >= 10,
  },
  {
    id: "cinquenta_devocionais",
    nome: "Enraizado",
    descricao: "Complete 50 devocionais.",
    icone: "🌳",
    verificar: (stats) => stats.total_devocionais >= 50,
  },
  {
    id: "ofensiva_7",
    nome: "Semana de Fé",
    descricao: "Alcance 7 dias seguidos de ofensiva.",
    icone: "🔥",
    verificar: (stats) => stats.maior_ofensiva >= 7,
  },
  {
    id: "ofensiva_30",
    nome: "Um Mês Inteiro",
    descricao: "Alcance 30 dias seguidos de ofensiva.",
    icone: "🏆",
    verificar: (stats) => stats.maior_ofensiva >= 30,
  },
  {
    id: "ofensiva_100",
    nome: "Cem Dias",
    descricao: "Alcance 100 dias seguidos de ofensiva.",
    icone: "💎",
    verificar: (stats) => stats.maior_ofensiva >= 100,
  },
  {
    id: "todos_os_temas",
    nome: "Explorador(a)",
    descricao: "Experimente todos os 12 temas de oração ao menos uma vez.",
    icone: "🧭",
    verificar: (stats) => stats.temas_distintos >= 12,
  },
];

/** Retorna o catálogo com um campo extra `conquistada: boolean` por item. */
export function calcularBadges(stats) {
  if (!stats) return CATALOGO_BADGES.map((b) => ({ ...b, conquistada: false }));
  return CATALOGO_BADGES.map((b) => ({ ...b, conquistada: b.verificar(stats) }));
}
