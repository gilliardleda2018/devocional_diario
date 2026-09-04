/**
 * Motor de Cálculo Heurístico e Explicável do Faith Graph
 * Implementa Jaccard Similarity, Adamic-Adar Index e Recomendação Ponderada.
 */

// Pesos Padrão Configuráveis (SocialRecommendationWeights)
export const DEFAULT_WEIGHTS = {
  weightMutualFriends: 0.25,
  weightJaccard: 0.15,
  weightAdamicAdar: 0.10,
  weightSameCommunity: 0.10,
  weightSharedInterest: 0.10,
  weightSharedDevotional: 0.10,
  weightInteractionAffinity: 0.08,
  weightReadingPlan: 0.05,
  weightPrayerAffinity: 0.04,
  weightLocationAffinity: 0.03,
};

/**
 * Calcula a Similaridade de Jaccard entre as redes de dois usuários A e B.
 * J(A,B) = |N(A) ∩ N(B)| / |N(A) ∪ N(B)|
 */
export function calcularJaccard(vizinhosA = [], vizinhosB = []) {
  if (!vizinhosA.length || !vizinhosB.length) return 0;

  const setA = new Set(vizinhosA);
  const setB = new Set(vizinhosB);

  let intersecao = 0;
  setA.forEach((elem) => {
    if (setB.has(elem)) intersecao++;
  });

  const uniao = new Set([...vizinhosA, ...vizinhosB]).size;
  return uniao === 0 ? 0 : intersecao / uniao;
}

/**
 * Calcula o Índice Adamic-Adar entre dois usuários A e B.
 * AA(A,B) = ∑ 1 / log(degree(z)) para cada vizinho z em comum.
 */
export function calcularAdamicAdar(vizinhosEmComum = [], grausVizinhosMap = {}) {
  if (!vizinhosEmComum.length) return 0;

  return vizinhosEmComum.reduce((acc, zId) => {
    const grau = grausVizinhosMap[zId] || 2;
    if (grau <= 1) return acc;
    return acc + 1 / Math.log(grau);
  }, 0);
}

/**
 * Converte códigos de motivo (Reason Codes) em texto legível para o usuário final.
 * NUNCA expõe pontuações numéricas brutas na interface.
 */
export function formatarReasonCode(code, meta = {}) {
  switch (code) {
    case "MUTUAL_FRIENDS":
      return meta.count > 1
        ? `Vocês têm ${meta.count} amigos em comum.`
        : `Vocês têm 1 amigo em comum.`;
    case "SAME_COMMUNITY":
      return meta.nomeComunidade
        ? `Também participa da ${meta.nomeComunidade}.`
        : `Vocês participam da mesma comunidade.`;
    case "SHARED_INTEREST":
      return `Vocês acompanham temas bíblicos semelhantes.`;
    case "SHARED_READING_PLAN":
      return `Vocês estão no mesmo plano de leitura.`;
    case "SAME_CHURCH":
      return `Frequenta a mesma igreja.`;
    default:
      return `Conexão recomendada com base na sua jornada de fé.`;
  }
}
