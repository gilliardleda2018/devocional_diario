"use client";

/**
 * Imagem vertical (1080x1920) da Palavra do dia para compartilhar -- o
 * formato do Status do WhatsApp e dos Stories do Instagram, e que também
 * aparece bem dentro de uma conversa. Diferente do card quadrado dos
 * Favoritos (gerarImagemCard.js), esta traz a chamada para o app embaixo:
 * a imagem precisa convidar quem vê, não só mostrar o versículo.
 *
 * As faixas de 250px no topo e no rodapé ficam livres de texto importante,
 * porque os Stories cobrem essas áreas com a barra de progresso e a caixa
 * de resposta.
 */

const W = 1080;
const H = 1920;

const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS = "'Karla', 'Helvetica Neue', Arial, sans-serif";

function quebrarLinhas(ctx, texto, larguraMax) {
  const palavras = texto.split(" ");
  const linhas = [];
  let atual = "";
  for (const palavra of palavras) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > larguraMax && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function retanguloArredondado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function carregarFontes() {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load("italic 500 64px Fraunces"),
      document.fonts.load("500 64px Fraunces"),
      document.fonts.load("700 40px Karla"),
      document.fonts.load("600 40px Karla"),
    ]);
  } catch {}
}

/**
 * @returns {Promise<Blob|null>} PNG pronto para compartilhar ou baixar.
 */
export async function gerarCardPalavraDoDia({ texto, referencia, rotuloData, nomeAutor, enderecoSite }) {
  if (typeof document === "undefined") return null;
  await carregarFontes();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Fundo de pergaminho, com um brilho suave atrás do versículo.
  const fundo = ctx.createLinearGradient(0, 0, W, H);
  fundo.addColorStop(0, "#FBF4E0");
  fundo.addColorStop(1, "#EBD9A6");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, W, H);
  const brilho = ctx.createRadialGradient(W / 2, 900, 60, W / 2, 900, 760);
  brilho.addColorStop(0, "rgba(255, 252, 240, 0.85)");
  brilho.addColorStop(1, "rgba(255, 252, 240, 0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Topo: nome do app e data.
  ctx.fillStyle = "#33422F";
  ctx.font = `500 50px ${SERIF}`;
  ctx.fillText("Devocional Diário", W / 2, 300);
  ctx.fillStyle = "#A07A3E";
  ctx.font = `700 30px ${SANS}`;
  const rotulo = `PALAVRA PARA HOJE${rotuloData ? `  ·  ${rotuloData.toUpperCase()}` : ""}`;
  ctx.fillText(rotulo, W / 2, 370);
  ctx.fillRect(W / 2 - 40, 420, 80, 4);

  // Versículo: diminui a letra até caber em no máximo 11 linhas.
  const larguraMax = W - 2 * 120;
  const textoComAspas = `“${texto}”`;
  let tamanho = 74;
  let linhas;
  do {
    ctx.font = `italic 500 ${tamanho}px ${SERIF}`;
    linhas = quebrarLinhas(ctx, textoComAspas, larguraMax);
    if (linhas.length <= 11) break;
    tamanho -= 4;
  } while (tamanho > 36);

  const alturaLinha = tamanho * 1.42;
  const centroVersiculo = 900;
  let y = centroVersiculo - ((linhas.length - 1) * alturaLinha) / 2;
  ctx.fillStyle = "#2D3B33";
  for (const linha of linhas) {
    ctx.fillText(linha, W / 2, y);
    y += alturaLinha;
  }

  ctx.fillStyle = "#8A6224";
  ctx.font = `700 44px ${SANS}`;
  ctx.fillText(`— ${referencia}`, W / 2, y + 40);

  // Rodapé: chamada para o app.
  const painelY = 1430;
  const painelH = 250;
  if (nomeAutor) {
    ctx.fillStyle = "#6B5A38";
    ctx.font = `600 32px ${SANS}`;
    ctx.fillText(`Compartilhado por ${nomeAutor}`, W / 2, painelY - 50);
  }
  retanguloArredondado(ctx, 110, painelY, W - 220, painelH, 36);
  ctx.fillStyle = "#33422F";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 52px ${SERIF}`;
  ctx.fillText("Faça seu devocional de hoje", W / 2, painelY + 90);
  ctx.fillStyle = "#EAD9A8";
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText("5 minutos  ·  grátis  ·  com áudio", W / 2, painelY + 160);

  // Endereço do site, só se for curto o bastante para ser lido e digitado.
  if (enderecoSite && enderecoSite.length <= 30) {
    ctx.fillStyle = "#6B5A38";
    ctx.font = `700 34px ${SANS}`;
    ctx.fillText(enderecoSite, W / 2, painelY + painelH + 60);
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
