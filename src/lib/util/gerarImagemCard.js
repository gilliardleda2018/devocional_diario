"use client";

function quebrarLinhas(ctx, texto, maxWidth) {
  const palavras = texto.split(" ");
  const linhas = [];
  let linhaAtual = "";
  for (const palavra of palavras) {
    const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > maxWidth && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = teste;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);
  return linhas;
}

/**
 * Desenha o card do versículo num canvas e devolve um Blob PNG -- gerado no
 * cliente via Canvas 2D (sem depender de libs externas tipo html2canvas) pra
 * poder ser baixado ou compartilhado como imagem de verdade, não só texto.
 */
export async function gerarImagemCardVersiculo({ texto, referencia, stops, textColor }) {
  if (typeof document === "undefined") return null;
  await document.fonts?.ready?.catch(() => {});

  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  stops.forEach(([offset, cor]) => grad.addColorStop(offset, cor));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const paddingX = 110;
  const maxWidth = W - paddingX * 2;
  const textoComAspas = `“${texto}”`;

  let fontSize = 56;
  let linhas;
  do {
    ctx.font = `italic 600 ${fontSize}px Georgia, "Times New Roman", serif`;
    linhas = quebrarLinhas(ctx, textoComAspas, maxWidth);
    if (linhas.length <= 8) break;
    fontSize -= 4;
  } while (fontSize > 28);

  const lineHeight = fontSize * 1.5;
  const totalTextHeight = linhas.length * lineHeight;
  let y = H / 2 - totalTextHeight / 2 - 30;
  linhas.forEach((linha) => {
    ctx.fillText(linha, W / 2, y);
    y += lineHeight;
  });

  ctx.font = 'bold 34px Georgia, "Times New Roman", serif';
  ctx.fillText(referencia, W / 2, H - 160);

  ctx.globalAlpha = 0.85;
  ctx.font = '24px Georgia, "Times New Roman", serif';
  ctx.fillText("Devocional Diário • Almeida 1911", W / 2, H - 112);
  ctx.globalAlpha = 1;

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export function baixarImagem(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function compartilharImagem(blob, nomeArquivo, { title, text } = {}) {
  const arquivo = new File([blob], nomeArquivo, { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], title, text });
    return "compartilhado";
  }
  baixarImagem(blob, nomeArquivo);
  return "baixado";
}
