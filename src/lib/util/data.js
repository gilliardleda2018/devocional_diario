/**
 * Data de hoje (AAAA-MM-DD) no fuso do aparelho. Antes o app usava
 * toISOString(), que é UTC: no Brasil, depois das 21h o app já achava que
 * era o dia seguinte. O banco agora também usa o fuso America/Sao_Paulo.
 */
export function dataLocalISO(data = new Date()) {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

/**
 * "Hoje" no Brasil como Date (meia-noite local), independente do fuso do
 * servidor -- a Amplify roda em UTC, e sem isso a página pública trocaria o
 * versículo do dia às 21h de Brasília.
 */
export function hojeNoBrasil(agora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora); // "2026-09-25"
  const [a, m, d] = partes.split("-").map(Number);
  return new Date(a, m - 1, d);
}
