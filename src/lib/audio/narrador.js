/**
 * Utilitário de narração por voz (Text-to-Speech) usando a Web Speech API
 * nativa, que funciona perfeitamente sem custo nos navegadores modernos
 * e no WebView do Android via Capacitor.
 */

let sintese = null;
let vozSelecionada = null;

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  sintese = window.speechSynthesis;
}

function obterVozPortugues() {
  if (!sintese) return null;
  if (vozSelecionada) return vozSelecionada;

  const vozes = sintese.getVoices();
  // Busca preferencialmente vozes pt-BR nativas
  vozSelecionada =
    vozes.find((v) => v.lang === "pt-BR" || v.lang === "pt_BR") ||
    vozes.find((v) => v.lang.startsWith("pt")) ||
    null;

  return vozSelecionada;
}

if (typeof window !== "undefined" && sintese) {
  sintese.onvoiceschanged = () => {
    obterVozPortugues();
  };
}

export function estaSuportadoAudio() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function falarTexto(texto, { velocidade = 1.0, aoIniciar, aoFim, aoErro } = {}) {
  if (!estaSuportadoAudio()) {
    if (aoErro) aoErro("Áudio não suportado neste navegador.");
    return false;
  }

  sintese.cancel(); // Cancela falas anteriores pendentes

  const mensagem = new SpeechSynthesisUtterance(texto);
  mensagem.lang = "pt-BR";
  mensagem.rate = velocidade;
  mensagem.pitch = 1.0;

  const voz = obterVozPortugues();
  if (voz) {
    mensagem.voice = voz;
  }

  if (aoIniciar) mensagem.onstart = aoIniciar;
  if (aoFim) mensagem.onend = aoFim;
  if (aoErro) mensagem.onerror = (e) => aoErro(e);

  sintese.speak(mensagem);
  return true;
}

export function pausarAudio() {
  if (sintese && sintese.speaking) {
    sintese.pause();
  }
}

export function retomarAudio() {
  if (sintese && sintese.paused) {
    sintese.resume();
  }
}

export function pararAudio() {
  if (sintese) {
    sintese.cancel();
  }
}
