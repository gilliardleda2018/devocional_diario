"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

// useSearchParams() exige um limite de Suspense no App Router -- sem isso o
// build falha/avisa. O fallback abaixo praticamente não aparece (é só o
// tempo de ler o parâmetro "erro" da URL, instantâneo).
export default function PaginaLogin() {
  return (
    <Suspense fallback={<div style={styles.page} />}>
      <FormularioLogin />
    </Suspense>
  );
}

function FormularioLogin() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [linkEnviado, setLinkEnviado] = useState(false);
  const [erro, setErro] = useState(null);

  // Erro vindo da rota /auth/callback (ex: link de e-mail expirado, usado
  // em outro navegador, ou já utilizado antes).
  useEffect(() => {
    const erroDaUrl = searchParams.get("erro");
    if (erroDaUrl) setErro(erroDaUrl);
  }, [searchParams]);

  async function entrarComGoogle() {
    setErro(null);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setErro(error.message);
  }

  async function enviarMagicLink(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setLinkEnviado(true);
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 18px" }}>
          <div style={styles.glowCircle} />
          <div style={styles.glowIcon}>🕊️</div>
        </div>
        <h1 style={styles.title}>Devocional Diário</h1>
        <p style={styles.subtitle}>Um versículo por dia e um devocional guiado para o seu momento.</p>

        <div style={styles.card}>
          <button className="action-btn" style={styles.googleBtn} onClick={entrarComGoogle}>
            <span style={{ fontSize: 18 }}>🔎</span> Entrar com Google
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>ou por e-mail</span>
          </div>

          {linkEnviado ? (
            <p style={styles.confirmText}>
              Link enviado para <strong>{email}</strong>. Confira sua caixa de entrada (e o spam) e clique nele para
              entrar.
            </p>
          ) : (
            <form onSubmit={enviarMagicLink}>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <button className="action-btn" type="submit" style={styles.primaryBtn} disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar link de acesso"}
              </button>
            </form>
          )}

          {erro && <p style={styles.errorText}>{erro}</p>}
        </div>

        <p style={styles.footnote}>
          Sem senha — você entra com um link enviado ao seu e-mail, ou com sua conta Google.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EAF0EC 0%, #F1EEE3 55%, #F6EFE1 100%)",
    fontFamily: "'Karla', sans-serif",
    color: "#2D3B33",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  container: {
    maxWidth: 380,
    width: "100%",
    textAlign: "center",
  },
  glowCircle: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(185,139,78,0.35) 0%, rgba(185,139,78,0) 70%)",
  },
  glowIcon: {
    position: "relative",
    width: 64,
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 28,
    margin: "0 0 8px",
    color: "#33422F",
  },
  subtitle: {
    fontSize: 14,
    color: "#7A8A7F",
    margin: "0 0 28px",
  },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "26px 24px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
    textAlign: "left",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#FFFFFF",
    color: "#33422F",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "20px 0",
  },
  dividerText: {
    fontSize: 11.5,
    color: "#9AA79C",
    textTransform: "uppercase",
    letterSpacing: 1,
    margin: "0 auto",
  },
  input: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    padding: "12px 14px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 14,
    color: "#2D3B33",
    marginBottom: 12,
  },
  primaryBtn: {
    width: "100%",
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  confirmText: {
    fontSize: 13.5,
    lineHeight: 1.6,
    color: "#4F6D5C",
    margin: 0,
  },
  errorText: {
    fontSize: 12.5,
    color: "#B15A4A",
    marginTop: 12,
    marginBottom: 0,
  },
  footnote: {
    fontSize: 11.5,
    color: "#9AA79C",
    marginTop: 20,
    lineHeight: 1.5,
  },
};
