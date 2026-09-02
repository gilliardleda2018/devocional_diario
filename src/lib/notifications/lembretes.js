/**
 * Gerenciador de lembretes diários e notificações locais para o Devocional Diário.
 */

const CHAVE_CONFIG = "devocional_lembrete_config";

export function obterConfigLembrete() {
  if (typeof window === "undefined") return { ativo: false, horario: "07:00" };
  try {
    const salvo = localStorage.getItem(CHAVE_CONFIG);
    return salvo ? JSON.parse(salvo) : { ativo: false, horario: "07:00" };
  } catch {
    return { ativo: false, horario: "07:00" };
  }
}

export function salvarConfigLembrete(config) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error("Erro ao salvar configuração de lembrete", e);
  }
}

export async function solicitarPermissaoNotificacao() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const resultado = await Notification.requestPermission();
    return resultado === "granted";
  }
  return false;
}

export function dispararNotificacaoTeste() {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification("🕊️ Devocional Diário", {
      body: "Hora de renovar sua fé e manter sua sequência ativa de hoje! 🔥",
      icon: "/icone-app-1024.png",
    });
    return true;
  }
  return false;
}
