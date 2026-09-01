/**
 * Conquistas com níveis, estilo jogo: em vez de uma conquista "tudo ou
 * nada", cada categoria (constância, ofensiva, exploração) tem 3-4
 * degraus -- Bronze, Prata, Ouro, Diamante -- e o usuário sobe de nível
 * conforme os números em `obter_estatisticas_usuario()` crescem. A
 * "Primeira Oração" continua como uma conquista única (não tem "níveis"
 * de dar o primeiro passo).
 */
export const NIVEIS_CONQUISTA = [
  { chave: "bronze", nome: "Bronze", medalha: "🥉", cor: "#B08D57" },
  { chave: "prata", nome: "Prata", medalha: "🥈", cor: "#9AA0A6" },
  { chave: "ouro", nome: "Ouro", medalha: "🥇", cor: "#D9A94C" },
  { chave: "diamante", nome: "Diamante", medalha: "💎", cor: "#5FBFD9" },
];

function encontrarNivel(chave) {
  return NIVEIS_CONQUISTA.find((n) => n.chave === chave) ?? null;
}

export const CATALOGO_CONQUISTAS = [
  {
    id: "constancia",
    nome: "Constância",
    icone: "📖",
    campo: "total_devocionais",
    descricaoBase: (meta) => `Complete ${meta} devocionais.`,
    tiers: [
      { nivel: "bronze", meta: 10 },
      { nivel: "prata", meta: 50 },
      { nivel: "ouro", meta: 150 },
      { nivel: "diamante", meta: 365 },
    ],
  },
  {
    id: "ofensiva",
    nome: "Ofensiva",
    icone: "🔥",
    campo: "maior_ofensiva",
    descricaoBase: (meta) => `Alcance ${meta} dias seguidos de ofensiva.`,
    tiers: [
      { nivel: "bronze", meta: 7 },
      { nivel: "prata", meta: 30 },
      { nivel: "ouro", meta: 100 },
      { nivel: "diamante", meta: 365 },
    ],
  },
  {
    id: "exploracao",
    nome: "Exploração",
    icone: "🧭",
    campo: "temas_distintos",
    descricaoBase: (meta) => `Experimente ${meta} temas de oração diferentes.`,
    tiers: [
      { nivel: "bronze", meta: 4 },
      { nivel: "prata", meta: 8 },
      { nivel: "ouro", meta: 12 },
    ],
  },
];

export const CONQUISTA_UNICA = {
  id: "primeira_oracao",
  nome: "Primeira Oração",
  descricao: "Complete seu primeiro devocional guiado.",
  icone: "🙏",
  verificar: (stats) => (stats?.total_devocionais ?? 0) >= 1,
};

function calcularConquistaTierada(conquista, stats) {
  const valor = stats?.[conquista.campo] ?? 0;
  let indiceAtual = -1;
  conquista.tiers.forEach((t, i) => {
    if (valor >= t.meta) indiceAtual = i;
  });
  const tierAtual = indiceAtual >= 0 ? conquista.tiers[indiceAtual] : null;
  const proximoTier = conquista.tiers[indiceAtual + 1] ?? null;

  return {
    ...conquista,
    valor,
    conquistada: indiceAtual >= 0,
    nivelMaximo: proximoTier === null,
    nivelAtual: tierAtual ? encontrarNivel(tierAtual.nivel) : null,
    proximoNivel: proximoTier ? encontrarNivel(proximoTier.nivel) : null,
    metaAtual: tierAtual?.meta ?? null,
    metaProxima: proximoTier?.meta ?? null,
    descricao: conquista.descricaoBase(proximoTier?.meta ?? tierAtual?.meta ?? conquista.tiers[0].meta),
    progresso: proximoTier ? Math.max(0, Math.min(1, valor / proximoTier.meta)) : 1,
  };
}

/** Retorna { tieradas, unica } prontos pra tela de Progresso. */
export function calcularConquistas(stats) {
  return {
    tieradas: CATALOGO_CONQUISTAS.map((c) => calcularConquistaTierada(c, stats)),
    unica: { ...CONQUISTA_UNICA, conquistada: CONQUISTA_UNICA.verificar(stats) },
  };
}
