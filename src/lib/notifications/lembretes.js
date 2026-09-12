/**
 * Gerenciador de lembretes diários e notificações locais para o Devocional Diário.
 *
 * No Android (Capacitor), o lembrete é agendado de verdade no sistema
 * operacional via @capacitor/local-notifications -- funciona mesmo com o
 * app fechado. Isso só entra em vigor depois de gerar um novo APK/AAB com
 * `npx cap sync android` e recompilar no Android Studio (veja
 * COMO_GERAR_O_APK.md); até lá, o app instalado continua usando a versão
 * anterior.
 *
 * No navegador (web/PWA), não existe like agendamento em segundo plano sem
 * um Service Worker + push do servidor -- então usamos um checador que roda
 * enquanto o app está aberto (ver iniciarChecadorWeb), best-effort.
 */

const CHAVE_CONFIG = "devocional_lembrete_config";
const CHAVE_ULTIMO_DISPARO = "devocional_lembrete_ultimo_disparo";
const ID_NOTIFICACAO_NATIVA = 9001;

export function obterConfigLembrete() {
  if (typeof window === "undefined") return { ativo: false, horario: "07:00" };
  try {
    const salvo = localStorage.getItem(CHAVE_CONFIG);
    return salvo ? JSON.parse(salvo) : { ativo: false, horario: "07:00" };
  } catch {
    return { ativo: false, horario: "07:00" };
  }
}

async function ehPlataformaNativa() {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function salvarConfigLembrete(config) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error("Erro ao salvar configuração de lembrete", e);
  }

  if (await ehPlataformaNativa()) {
    await agendarLembreteNativo(config);
  }
}

async function agendarLembreteNativo(config) {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: ID_NOTIFICACAO_NATIVA }] });

    if (!config.ativo || !config.horario) return;

    const [hora, minuto] = config.horario.split(":").map(Number);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_NOTIFICACAO_NATIVA,
          title: "🕊️ Devocional Diário",
          body: "Hora de renovar sua fé e manter sua sequência ativa de hoje! 🔥",
          schedule: { on: { hour: hora, minute: minuto }, every: "day", allowWhileIdle: true },
        },
      ],
    });
  } catch (e) {
    console.error("Erro ao agendar lembrete nativo:", e);
  }
}

export async function solicitarPermissaoNotificacao() {
  if (typeof window === "undefined") return false;

  if (await ehPlataformaNativa()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const resultado = await LocalNotifications.requestPermissions();
      return resultado.display === "granted";
    } catch (e) {
      console.error("Erro ao pedir permissão de notificação nativa:", e);
      return false;
    }
  }

  if (!("Notification" in window)) return false;
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

/**
 * Best-effort pra web: como não há Service Worker + push aqui, o lembrete só
 * dispara enquanto o app está aberto (ainda que em segundo plano). Chame uma
 * vez no mount do app e limpe o intervalo no unmount.
 */
export function iniciarChecadorWeb() {
  if (typeof window === "undefined" || !("Notification" in window)) return () => {};

  function verificar() {
    const config = obterConfigLembrete();
    if (!config.ativo || !config.horario || Notification.permission !== "granted") return;

    const agora = new Date();
    const horarioAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    if (horarioAtual < config.horario) return;

    const hojeISO = agora.toISOString().slice(0, 10);
    const ultimoDisparo = localStorage.getItem(CHAVE_ULTIMO_DISPARO);
    if (ultimoDisparo === hojeISO) return;

    dispararNotificacaoTeste();
    localStorage.setItem(CHAVE_ULTIMO_DISPARO, hojeISO);
  }

  verificar();
  const intervalo = setInterval(verificar, 60_000);
  return () => clearInterval(intervalo);
}
