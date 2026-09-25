import { dataLocalISO } from "@/src/lib/util/data";

/**
 * Devocional feito por um visitante (sem conta) na página de entrada.
 * Fica guardado no aparelho até a pessoa criar a conta ou entrar -- aí o
 * DevocionalApp registra esse devocional como o de hoje, e a ofensiva já
 * começa em 1 dia. Só vale no mesmo dia: um devocional de ontem não conta.
 */
const CHAVE = "devocional_visitante_pendente";

export function guardarDevocionalVisitante({ temaOracao, referenciaVersiculo, reflexao }) {
  try {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({ dia: dataLocalISO(), temaOracao, referenciaVersiculo, reflexao: reflexao || null })
    );
  } catch {}
}

/** Lê e apaga o devocional pendente; devolve null se não houver ou se não for de hoje. */
export function consumirDevocionalVisitante() {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (!salvo) return null;
    window.localStorage.removeItem(CHAVE);
    const dados = JSON.parse(salvo);
    return dados?.dia === dataLocalISO() ? dados : null;
  } catch {
    return null;
  }
}
