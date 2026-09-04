"use client";

import { useState, useEffect } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import { validarUsername } from "@/src/lib/constants";

export default function OnboardingModal({ usuario, perfilAtual, aoConcluir }) {
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const [nomeExibicao, setNomeExibicao] = useState(
    perfilAtual?.nome_exibicao || usuario?.user_metadata?.full_name || usuario?.email?.split("@")[0] || "Fiel"
  );
  const [username, setUsername] = useState(perfilAtual?.username || "");
  const [cidade, setCidade] = useState(perfilAtual?.cidade || "");
  const [igreja, setIgreja] = useState(perfilAtual?.igreja || "");

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

  async function handleAvancarEtapa1(e) {
    if (e) e.preventDefault();
    setErro(null);

    const val = validarUsername(username);
    if (!val.valido) {
      setErro(val.erro);
      return;
    }

    setPasso(2);
  }

  async function handleFinalizar() {
    setSalvando(true);
    setErro(null);
    try {
      const supabase = criarClienteSupabase();
      const val = validarUsername(username);
      const uLimpo = val.valido ? val.usernameLimpo : `user_${usuario.id.slice(0, 6)}`;
      const nomeFinal = nomeExibicao.trim() || "Fiel";

      try {
        await supabase.from("profiles").upsert({
          id: usuario.id,
          nome_exibicao: nomeFinal,
          username: uLimpo,
          cidade: cidade.trim() || null,
          igreja: igreja.trim() || null,
        });
      } catch {
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
            {passo === 1
              ? "Escolha seu nome de exibição e seu @username exclusivo."
              : "Conecte-se com sua cidade e comunidade espiritual."}
          </p>
        </div>

        {passo === 1 && (
          <form onSubmit={handleAvancarEtapa1} style={styles.body}>
            <label style={styles.label}>Como gostaria de ser chamado?</label>
            <input
              type="text"
              required
              value={nomeExibicao}
              onChange={(e) => setNomeExibicao(e.target.value)}
              placeholder="Seu nome (ex: João Silva)"
              style={styles.input}
            />

            <label style={{ ...styles.label, marginTop: 12 }}>Seu @username único:</label>
            <div style={{ position: "relative" }}>
              <span style={styles.atSymbol}>@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErro(null);
                }}
                placeholder="seu_username"
                style={{ ...styles.input, paddingLeft: 28 }}
              />
            </div>

            {erro && <p style={styles.errorText}>{erro}</p>}

            <div style={styles.footer}>
              <button type="submit" style={styles.btnPrimary}>
                Avançar →
              </button>
              <button type="button" style={styles.btnSkip} onClick={() => aoConcluir && aoConcluir()}>
                Pular por enquanto
              </button>
            </div>
          </form>
        )}

        {passo === 2 && (
          <div style={styles.body}>
            <label style={styles.label}>Cidade (opcional):</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Sua cidade (ex: São Paulo - SP)"
              style={styles.input}
            />

            <label style={{ ...styles.label, marginTop: 12 }}>Sua Igreja ou Comunidade (opcional):</label>
            <input
              type="text"
              value={igreja}
              onChange={(e) => setIgreja(e.target.value)}
              placeholder="Sua igreja/comunidade"
              style={styles.input}
            />

            <div style={styles.footer}>
              <button style={styles.btnPrimary} onClick={handleFinalizar} disabled={salvando}>
                {salvando ? "Entrando..." : "Começar a Usar ✨"}
              </button>
              <button style={styles.btnSkip} onClick={() => setPasso(1)}>
                « Voltar ao nome
              </button>
            </div>
          </div>
        )}
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
