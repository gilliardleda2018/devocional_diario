/**
 * Níveis de XP, estilo Duolingo -- cada devocional concluído dá 20 XP
 * (ver supabase/schema.sql, função registrar_devocional_hoje). Os
 * limiares abaixo dão ~1 nível por semana de uso constante no início,
 * ficando mais espaçados depois.
 */
export const NIVEIS = [
  { min: 0, titulo: "Semente" },
  { min: 100, titulo: "Broto" },
  { min: 260, titulo: "Raiz Firme" },
  { min: 500, titulo: "Fiel" },
  { min: 900, titulo: "Guardião da Palavra" },
  { min: 1500, titulo: "Luz que Não se Apaga" },
  { min: 2500, titulo: "Andarilho da Fé" },
];

/**
 * Retorna { indice, titulo, xpAtual, xpProximoNivel, progresso (0-1) }
 * para o XP total dado.
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

  return {
    indice,
    titulo: nivelAtual.titulo,
    xp,
    xpMinimoNivel: nivelAtual.min,
    xpProximoNivel: proximoNivel?.min ?? null,
    proximoTitulo: proximoNivel?.titulo ?? null,
    progresso: Math.max(0, Math.min(1, progresso)),
    nivelMaximo: proximoNivel === null,
  };
}
