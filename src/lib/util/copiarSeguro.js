/**
 * Copia um texto para a área de transferência de forma 100% segura,
 * prevenindo erros do tipo "TypeError: Cannot read properties of undefined (reading 'writeText')"
 * no Next.js/React.
 */
export async function copiarTextoSeguro(texto) {
  if (!texto) return false;

  // 1. Tenta a API moderna navigator.clipboard se disponível
  try {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (err) {
    console.warn("[copiarTextoSeguro] navigator.clipboard falhou:", err);
  }

  // 2. Fallback usando textarea temporária no DOM
  try {
    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = texto;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Suporte para mobile
      const sucesso = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (sucesso) return true;
    }
  } catch (err) {
    console.warn("[copiarTextoSeguro] fallback execCommand falhou:", err);
  }

  // 3. Caso tudo falhe, abre um prompt para o usuário copiar manualmente
  try {
    if (typeof window !== "undefined" && window.prompt) {
      window.prompt("Copie o texto abaixo:", texto);
      return true;
    }
  } catch (err) {
    console.warn("[copiarTextoSeguro] prompt falhou:", err);
  }

  return false;
}
