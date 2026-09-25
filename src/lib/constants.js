/**
 * Constantes Globais e Configurações de Sistema para o Devocional Diário.
 */

export const DEFAULT_PAGE_SIZE = 20;

// Chave de localStorage onde /convite/[codigo] guarda o código pendente até
// a pessoa autenticar -- DevocionalApp.jsx lê e resgata (RPC resgatar_convite)
// assim que o usuário loga, e limpa a chave depois, com sucesso ou não.
export const CHAVE_CONVITE_PENDENTE = "codigo_convite_pendente";

// Como a pessoa entrou da última vez neste aparelho ({ metodo: "google" |
// "email", email }) -- gravado pelo DevocionalApp, lido na tela de login.
export const CHAVE_ULTIMO_LOGIN = "devocional_ultimo_login";

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "support",
  "suporte",
  "devocional",
  "devocionaldiario",
  "system",
  "sistema",
  "root",
  "api",
  "app",
  "auth",
  "help",
  "ajuda",
  "config",
  "settings",
  "official",
  "oficial",
  "god",
  "deus",
  "jesus",
  "espiritosanto",
];

export const RELATIONSHIP_STATES = {
  SELF: "SELF",
  NONE: "NONE",
  REQUEST_SENT: "REQUEST_SENT",
  REQUEST_RECEIVED: "REQUEST_RECEIVED",
  FRIENDS: "FRIENDS",
  BLOCKED_BY_ME: "BLOCKED_BY_ME",
  BLOCKED_BY_OTHER: "BLOCKED_BY_OTHER",
};

/**
 * Valida se um username atende às regras de negócio:
 * - 3 a 30 caracteres
 * - Apenas letras minúsculas, números e underlines (a-z0-9_)
 * - Não pode ser um nome reservado do sistema
 */
export function validarUsername(input) {
  if (!input || typeof input !== "string") {
    return { valido: false, erro: "Username é obrigatório." };
  }

  const limpo = input.trim().toLowerCase().replace("@", "");

  if (limpo.length < 3) {
    return { valido: false, erro: "O username deve ter no mínimo 3 caracteres." };
  }

  if (limpo.length > 30) {
    return { valido: false, erro: "O username deve ter no máximo 30 caracteres." };
  }

  if (!/^[a-z0-9_]+$/.test(limpo)) {
    return { valido: false, erro: "O username deve conter apenas letras, números e underlines." };
  }

  if (RESERVED_USERNAMES.includes(limpo)) {
    return { valido: false, erro: `O nome "${limpo}" é reservado pelo sistema.` };
  }

  return { valido: true, usernameLimpo: limpo };
}
