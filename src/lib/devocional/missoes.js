/**
 * Missões, estilo jogo: metas curtas e recorrentes (diárias e semanais)
 * que complementam as conquistas (badges, que são pra sempre). Os números
 * vêm da função RPC obter_progresso_semana() (ver supabase/schema.sql) e
 * do `jaFezHoje` que já existe no hook useOfensiva.
 */
export function calcularMissoes({ jaFezHoje, progresso }) {
  const devocionaisSemana = progresso?.devocionais_semana ?? 0;
  const temasSemana = progresso?.temas_semana ?? 0;
  const refletiuHoje = progresso?.refletiu_hoje ?? false;

  return [
    {
      id: "devocional_hoje",
      tipo: "diaria",
      icone: "📖",
      titulo: "Devocional de hoje",
      descricao: "Complete o devocional do dia.",
      atual: jaFezHoje ? 1 : 0,
      meta: 1,
    },
    {
      id: "reflexao_hoje",
      tipo: "diaria",
      icone: "✍️",
      titulo: "Reflexão de hoje",
      descricao: "Escreva uma reflexão no devocional de hoje.",
      atual: refletiuHoje ? 1 : 0,
      meta: 1,
    },
    {
      id: "semana_constante",
      tipo: "semanal",
      icone: "🔥",
      titulo: "Semana de constância",
      descricao: "Complete o devocional em 5 dos últimos 7 dias.",
      atual: Math.min(devocionaisSemana, 5),
      meta: 5,
    },
    {
      id: "temas_variados",
      tipo: "semanal",
      icone: "🧭",
      titulo: "Diversifique os temas",
      descricao: "Ore sobre 3 temas diferentes nos últimos 7 dias.",
      atual: Math.min(temasSemana, 3),
      meta: 3,
    },
  ];
}
