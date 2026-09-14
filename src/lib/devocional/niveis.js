/**
 * Regra oficial da Trilha da Fé: cada devocional concluído dá 20 XP (ver
 * supabase/schema.sql, função registrar_devocional_hoje). A cada 250 XP
 * o usuário ganha 1 Semente de Fé (a moeda oficial do jogo -- mesma
 * moeda usada na Loja de Sementes, ver useSementes.js), e a cada 5
 * Sementes ganhas ele avança de fase. Ou seja, cada fase custa 1250 XP,
 * o equivalente a 62-63 devocionais.
 */
export const XP_POR_SEMENTE = 250;
export const SEMENTES_POR_FASE = 5;
export const XP_POR_FASE = XP_POR_SEMENTE * SEMENTES_POR_FASE;

export const NIVEIS = [
  { min: XP_POR_FASE * 0, titulo: "Semente" },
  { min: XP_POR_FASE * 1, titulo: "Broto" },
  { min: XP_POR_FASE * 2, titulo: "Raiz Firme" },
  { min: XP_POR_FASE * 3, titulo: "Fiel" },
  { min: XP_POR_FASE * 4, titulo: "Guardião da Palavra" },
  { min: XP_POR_FASE * 5, titulo: "Luz que Não se Apaga" },
  { min: XP_POR_FASE * 6, titulo: "Andarilho da Fé" },
];

/**
 * Retorna { indice, titulo, xp, progresso (0-1), sementesTotais,
 * sementesNaFase, sementesFaltantes, ... } para o XP total dado.
 */
export function obterNivel(xpTotal) {
  const xp = xpTotal ?? 0;
  let indice = 0;
  for (let i = NIVEIS.length - 1; i >= 0; i -= 1) {
    if (xp >= NIVEIS[i].min) {
      indice = i;
      break;
    }
  }

  const nivelAtual = NIVEIS[indice];
  const proximoNivel = NIVEIS[indice + 1] ?? null;

  const progresso = proximoNivel
    ? (xp - nivelAtual.min) / (proximoNivel.min - nivelAtual.min)
    : 1;

  const sementesTotais = Math.floor(xp / XP_POR_SEMENTE);
  const sementesNaFase = proximoNivel ? sementesTotais % SEMENTES_POR_FASE : SEMENTES_POR_FASE;

  return {
    indice,
    titulo: nivelAtual.titulo,
    xp,
    xpMinimoNivel: nivelAtual.min,
    xpProximoNivel: proximoNivel?.min ?? null,
    proximoTitulo: proximoNivel?.titulo ?? null,
    progresso: Math.max(0, Math.min(1, progresso)),
    nivelMaximo: proximoNivel === null,
    sementesTotais,
    sementesNaFase,
    sementesFaltantes: proximoNivel ? SEMENTES_POR_FASE - sementesNaFase : 0,
    sementesPorFase: SEMENTES_POR_FASE,
  };
}
