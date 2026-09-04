"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import CardDoacao from "@/src/components/CardDoacao";

export default function PaginaLogin() {
  return (
    <Suspense fallback={<div style={styles.page} />}>
      <FormularioLogin />
    </Suspense>
  );
}

function FormularioLogin() {
  const searchParams = useSearchParams();
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastro" | "magic"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  
  const [enviando, setEnviando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [erro, setErro] = useState(null);

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

  async function entrarComSenha(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
    }
  }

  async function cadastrarNovoUsuario(e) {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setEnviando(true);
    const supabase = criarClienteSupabase();
    const nomeLimpo = nome.trim() || "Fiel";

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nomeLimpo,
          display_name: nomeLimpo,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    // Tenta gravar em profiles com resiliência total
    if (data?.user?.id) {
      try {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          nome_exibicao: nomeLimpo,
          email: email.trim(),
        }).catch(() => {});
      } catch (eProf) {
        console.warn("Aviso ao criar linha em profiles:", eProf);
      }
    }

    setMensagemSucesso("Conta criada com sucesso! Você já pode fazer login ou conferir seu e-mail.");
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
    setMensagemSucesso(`Link de acesso enviado para ${email}. Confira sua caixa de entrada.`);
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

        {/* Abas Entrar / Cadastrar */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            style={modo === "entrar" ? styles.tabActive : styles.tabInactive}
            onClick={() => { setModo("entrar"); setErro(null); setMensagemSucesso(null); }}
          >
            Entrar
          </button>
          <button
            type="button"
            style={modo === "cadastro" ? styles.tabActive : styles.tabInactive}
            onClick={() => { setModo("cadastro"); setErro(null); setMensagemSucesso(null); }}
          >
            Criar Conta
          </button>
        </div>

        <div style={styles.card}>
          <button className="action-btn" style={styles.googleBtn} onClick={entrarComGoogle}>
            <span style={{ fontSize: 18 }}>🔎</span> Continuar com Google
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>ou por e-mail</span>
          </div>

          {mensagemSucesso ? (
            <div style={{ textAlign: "center" }}>
              <p style={styles.confirmText}>{mensagemSucesso}</p>
              <button
                style={{ ...styles.primaryBtn, marginTop: 14 }}
                onClick={() => { setModo("entrar"); setMensagemSucesso(null); }}
              >
                Ir para o Login
              </button>
            </div>
          ) : modo === "cadastro" ? (
            <form onSubmit={cadastrarNovoUsuario}>
              <input
                type="text"
                required
                placeholder="Seu nome (ex: João Silva)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={styles.input}
              />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <input
                type="password"
                required
                placeholder="Sua senha (mínimo 6 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={styles.input}
              />

              <button className="action-btn" type="submit" style={styles.primaryBtn} disabled={enviando}>
                {enviando ? "Criando conta..." : "Criar Minha Conta ✨"}
              </button>
            </form>
          ) : modo === "magic" ? (
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
              <button
                type="button"
                style={styles.linkToggleBtn}
                onClick={() => setModo("entrar")}
              >
                « Entrar com E-mail e Senha
              </button>
            </form>
          ) : (
            <form onSubmit={entrarComSenha}>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <input
                type="password"
                required
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={styles.input}
              />
              <button className="action-btn" type="submit" style={styles.primaryBtn} disabled={enviando}>
                {enviando ? "Entrando..." : "Entrar com Senha"}
              </button>
              <button
                type="button"
                style={styles.linkToggleBtn}
                onClick={() => setModo("magic")}
              >
                ✨ Entrar sem senha via Link por E-mail
              </button>
            </form>
          )}

          {erro && <p style={styles.errorText}>{erro}</p>}
        </div>

        <p style={styles.footnote}>
          Rápido e simples — entre com Google, e-mail e senha, ou link direto.
        </p>

        <CardDoacao compacto={true} />
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
    margin: "0 0 20px",
  },
  tabContainer: {
    display: "flex",
    background: "rgba(220, 215, 200, 0.5)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabActive: {
    flex: 1,
    padding: "8px 12px",
    background: "#FBF9F3",
    color: "#33422F",
    fontWeight: 700,
    fontSize: 13.5,
    borderRadius: 8,
    border: "none",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  tabInactive: {
    flex: 1,
    padding: "8px 12px",
    background: "transparent",
    color: "#7A8A7F",
    fontWeight: 600,
    fontSize: 13.5,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "24px 22px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
    textAlign: "left",
    marginBottom: 16,
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
    marginBottom: 10,
    boxSizing: "border-box",
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
  linkToggleBtn: {
    background: "none",
    border: "none",
    color: "#5C7060",
    fontSize: 12.5,
    cursor: "pointer",
    width: "100%",
    marginTop: 12,
    textAlign: "center",
    textDecoration: "underline",
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
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 1.5,
  },
};
