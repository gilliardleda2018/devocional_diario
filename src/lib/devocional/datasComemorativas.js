/**
 * Datas comemorativas (calendário brasileiro), portado da versão anterior
 * do app. Datas móveis (Páscoa, Dia das Mães/Pais) são calculadas para o
 * ano corrente em vez de fixadas.
 */
import { VERSE_REFS } from "./versiculos";

export const COMMEMORATIVE_LABELS = {
  ano_novo: "Ano Novo",
  maes: "Dia das Mães",
  namorados: "Dia dos Namorados",
  pais: "Dia dos Pais",
  criancas: "Dia das Crianças",
  sexta_santa: "Sexta-feira Santa",
  pascoa: "Páscoa",
  natal: "Natal",
};

function nEsimoDiaSemanaDoMes(ano, mes, diaSemana, n) {
  const primeiro = new Date(ano, mes, 1);
  const deslocamento = (7 + diaSemana - primeiro.getDay()) % 7;
  return new Date(ano, mes, 1 + deslocamento + (n - 1) * 7);
}

function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function somarDias(data, n) {
  const d = new Date(data);
  d.setDate(d.getDate() + n);
  return d;
}

function mesmoDiaEMes(a, b) {
  return a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Retorna { theme } se `data` cair numa data comemorativa, senão null. */
export function obterTemaComemorativo(data) {
  const ano = data.getFullYear();
  const pascoa = calcularPascoa(ano);
  const candidatos = [
    { theme: "ano_novo", data: new Date(ano, 0, 1) },
    { theme: "maes", data: nEsimoDiaSemanaDoMes(ano, 4, 0, 2) },
    { theme: "namorados", data: new Date(ano, 5, 12) },
    { theme: "pais", data: nEsimoDiaSemanaDoMes(ano, 7, 0, 2) },
    { theme: "criancas", data: new Date(ano, 9, 12) },
    { theme: "sexta_santa", data: somarDias(pascoa, -2) },
    { theme: "pascoa", data: pascoa },
    { theme: "natal", data: new Date(ano, 11, 25) },
  ];
  return candidatos.find((c) => mesmoDiaEMes(c.data, data)) ?? null;
}

function diaDoAno(d) {
  const inicio = new Date(d.getFullYear(), 0, 0);
  const diff = d - inicio;
  return Math.floor(diff / 86400000);
}

/**
 * Escolhe o versículo do dia: se hoje é comemorativa, sorteia (de forma
 * determinística pelo dia do ano) entre as referências daquele tema;
 * senão, sorteia entre todo o pool -- mesmo dia = mesmo versículo pra
 * todo mundo, sem precisar de banco de dados pra isso.
 */
export function obterVersiculoDoDia(data) {
  const comemorativa = obterTemaComemorativo(data);
  if (comemorativa) {
    const pool = VERSE_REFS.filter((v) => v.themes?.includes(comemorativa.theme));
    if (pool.length) {
      return { ...pool[diaDoAno(data) % pool.length], comemorativa: comemorativa.theme };
    }
  }
  return { ...VERSE_REFS[diaDoAno(data) % VERSE_REFS.length], comemorativa: null };
}
