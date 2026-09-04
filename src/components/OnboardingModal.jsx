"use client";

import { useState, useEffect } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

export default function OnboardingModal({ usuario, perfilAtual, aoConcluir }) {
  const [salvando, setSalvando] = useState(false);
  const [nomeExibicao, setNomeExibicao] = useState(
    perfilAtual?.nome_exibicao || usuario?.user_metadata?.full_name || usuario?.email?.split("@")[0] || "Fiel"
  );
  const [username, setUsername] = useState(perfilAtual?.username || "");

  useEffect(() => {
    if (!username && (nomeExibicao || usuario?.email)) {
      const base = (nomeExibicao || usuario?.email?.split("@")[0] || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18);
      if (base) setUsername(base);
    }
  }, [nomeExibicao, usuario, username]);

  async function handleFinalizar() {
    setSalvando(true);
    try {
      const supabase = criarClienteSupabase();
      const uLimpo = username.trim().toLowerCase().replace("@", "") || `user_${usuario.id.slice(0, 6)}`;
      const nomeFinal = nomeExibicao.trim() || "Fiel";

      // Salva dados essenciais sem travar por erro de schema
      try {
        await supabase.from("profiles").upsert({
          id: usuario.id,
          nome_exibicao: nomeFinal,
          username: uLimpo,
        });
      } catch (eProf) {
        await supabase.from("profiles").upsert({
          id: usuario.id,
          nome_exibicao: nomeFinal,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Aviso ao salvar onboarding:", e);
    } finally {
      setSalvando(false);
      if (aoConcluir) aoConcluir();
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.glowIcon}>🕊️</div>
          <h2 style={styles.title}>Bem-vindo ao Devocional Diário!</h2>
          <p style={styles.subtitle}>
            Sua jornada diária de fé e momentos de reflexão começam agora.
          </p>
        </div>

        <div style={styles.body}>
          <label style={styles.label}>Como gostaria de ser chamado?</label>
          <input
            type="text"
            value={nomeExibicao}
            onChange={(e) => setNomeExibicao(e.target.value)}
            placeholder="Seu nome"
            style={styles.input}
          />

          {username && (
            <p style={styles.usernameTip}>
              Seu identificador único no app será: <strong style={{ color: "#B98B4E" }}>@{username.replace("@", "")}</strong>
            </p>
          )}
        </div>

        <div style={styles.footer}>
          <button
            style={styles.btnPrimary}
            onClick={handleFinalizar}
            disabled={salvando}
          >
            {salvando ? "Entrando..." : "Começar a Usar ✨"}
          </button>
          <button
            style={styles.btnSkip}
            onClick={() => aoConcluir && aoConcluir()}
          >
            Pular por enquanto
          </button>
        </div>
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
