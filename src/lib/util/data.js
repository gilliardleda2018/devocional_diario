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
