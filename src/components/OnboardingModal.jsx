"use client";

import { useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

/**
 * Onboarding enxuto: só pergunta o NOME, e só quando ele está faltando
 * (vazio, "Fiel" ou parecido com e-mail). Username, cidade e igreja ficam
 * para depois, no Perfil -- pedir tudo isso antes do primeiro devocional
 * era um dos pontos em que as pessoas desistiam.
 *
 * O @username é gerado automaticamente a partir do nome, se ainda não existir.
 */
export function nomePrecisaDeAjuste(nome) {
  const n = (nome || "").trim();
  return !n || n.toLowerCase() === "fiel" || n.includes("@");
}

function gerarUsername(nome) {
  const base = (nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 14);
  const sufixo = Math.floor(100 + Math.random() * 900);
  return `${base || "fiel"}_${sufixo}`;
}

export default function OnboardingModal({ usuario, perfilAtual, aoConcluir }) {
  const nomeInicial = nomePrecisaDeAjuste(perfilAtual?.nome_exibicao)
    ? (usuario?.user_metadata?.full_name || "")
    : perfilAtual?.nome_exibicao;
  const [nome, setNome] = useState(nomeInicial || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar(e) {
    if (e) e.preventDefault();
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    if (nomeLimpo.length < 2 || nomeLimpo.includes("@")) {
      setErro("Digite seu nome (pelo menos 2 letras, sem e-mail).");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const supabase = criarClienteSupabase();
      const alteracoes = { nome_exibicao: nomeLimpo, atualizado_em: new Date().toISOString() };
      if (!perfilAtual?.nome_completo) alteracoes.nome_completo = nomeLimpo;
      if (!perfilAtual?.username) alteracoes.username = gerarUsername(nomeLimpo);
      const { error } = await supabase.from("profiles").update(alteracoes).eq("id", usuario.id);
      if (error) throw error;
      // Mantém o nome também nos metadados da conta (usado como reserva em alguns pontos do app).
      await supabase.auth.updateUser({ data: { full_name: nomeLimpo } }).catch(() => {});
      if (aoConcluir) aoConcluir();
    } catch (e2) {
      console.warn("Erro ao salvar nome:", e2);
      setErro("Não foi possível salvar agora. Verifique sua conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.glowIcon}>🕊️</div>
          <h2 style={styles.title}>Que bom ter você aqui!</h2>
          <p style={styles.subtitle}>Como podemos te chamar? É assim que seus amigos vão te ver no app.</p>
        </div>

        <form onSubmit={salvar} style={styles.body}>
          <input
            type="text"
            required
            autoFocus
            value={nome}
            onChange={(e) => { setNome(e.target.value); setErro(null); }}
            placeholder="Seu nome (ex: Maria Souza)"
            style={styles.input}
          />
          {erro && <p style={styles.errorText}>{erro}</p>}
          <div style={styles.footer}>
            <button type="submit" style={styles.btnPrimary} disabled={salvando}>
              {salvando ? "Salvando..." : "Continuar ✨"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30, 40, 35, 0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    background: "#FBF9F3",
    borderRadius: 20,
    maxWidth: 380,
    width: "100%",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    overflow: "hidden",
    border: "1px solid #E7E0D0",
    textAlign: "center",
    padding: "26px 22px",
  },
  header: {
    marginBottom: 16,
  },
  glowIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 21,
    color: "#33422F",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: 13,
    color: "#7A8A7F",
    margin: 0,
    lineHeight: 1.4,
  },
  body: {
    margin: "16px 0",
    textAlign: "left",
  },
  label: {
    display: "block",
    fontSize: 12.5,
    fontWeight: 700,
    color: "#33422F",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    padding: "11px 13px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 14,
    background: "#FFFFFF",
    color: "#2D3B33",
    boxSizing: "border-box",
  },
  usernameTip: {
    fontSize: 12,
    color: "#7A8A7F",
    marginTop: 8,
    textAlign: "center",
  },
  atSymbol: {
    position: "absolute",
    left: 12,
    top: 11,
    fontSize: 14,
    fontWeight: 700,
    color: "#B98B4E",
    pointerEvents: "none",
  },
  errorText: {
    fontSize: 12.5,
    color: "#B15A4A",
    marginTop: 8,
    marginBottom: 0,
  },
  footer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 20,
  },
  btnPrimary: {
    width: "100%",
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSkip: {
    background: "transparent",
    color: "#7A8A7F",
    border: "none",
    fontSize: 12.5,
    cursor: "pointer",
    padding: "4px",
    textDecoration: "underline",
  },
};
