"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import { CHAVE_CONVITE_PENDENTE } from "@/src/lib/constants";

/**
 * Tela de acesso, simplificada:
 *   - Dois modos claros: "Criar conta" (nome + e-mail + senha) e "Entrar".
 *   - O nome é obrigatório no cadastro (antes era opcional e muita gente
 *     ficava como "Fiel" ou com o e-mail aparecendo como nome).
 *   - O link por e-mail virou "Esqueci minha senha" e NÃO cria conta nova
 *     (antes criava contas sem nome).
 *   - Quem chega pelo navegador interno do Instagram/Facebook/WhatsApp vê
 *     um aviso: o Google bloqueia login nesses navegadores, então o botão
 *     do Google some e sugerimos abrir no navegador do celular.
 *   - ?modo=cadastro e ?convite=CODIGO vindos da página de convite são
 *     respeitados (antes eram ignorados e o convidado caía em "Entrar").
 */

function detectarNavegadorInterno() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "Facebook";
  if (/WhatsApp/i.test(ua)) return "WhatsApp";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "TikTok";
  if (/Line\//i.test(ua)) return "Line";
  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) return "um aplicativo";
  return null;
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={<div style={styles.page} />}>
      <FormularioLogin />
    </Suspense>
  );
}

function FormularioLogin() {
  const searchParams = useSearchParams();
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastro" | "recuperar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [erro, setErro] = useState(null);
  const [appInterno, setAppInterno] = useState(null);
  const [temConvite, setTemConvite] = useState(false);
  const [temDevocionalPendente, setTemDevocionalPendente] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    const erroDaUrl = searchParams?.get("erro");
    if (erroDaUrl) setErro(erroDaUrl);

    const convite = searchParams?.get("convite");
    if (convite) {
      try { window.localStorage.setItem(CHAVE_CONVITE_PENDENTE, convite); } catch {}
    }
    let convitePendente = false;
    try { convitePendente = !!window.localStorage.getItem(CHAVE_CONVITE_PENDENTE); } catch {}
    setTemConvite(convitePendente);
    // Visitante que fez o devocional na página inicial (ver PaginaEntrada).
    try { setTemDevocionalPendente(!!window.localStorage.getItem("devocional_visitante_pendente")); } catch {}

    if (searchParams?.get("modo") === "cadastro" || convitePendente) setModo("cadastro");
    setAppInterno(detectarNavegadorInterno());
  }, [searchParams]);

  function trocarModo(novo) {
    setModo(novo);
    setErro(null);
    setMensagemSucesso(null);
  }

  function lerConvite() {
    try { return window.localStorage.getItem(CHAVE_CONVITE_PENDENTE) || null; } catch { return null; }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopiado(true);
    } catch {
      setLinkCopiado(false);
    }
  }

  function linkAbrirNoChrome() {
    if (typeof window === "undefined") return "#";
    const { host, pathname, search } = window.location;
    return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  async function entrarComGoogle() {
    setErro(null);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro("Não foi possível abrir o login do Google. Tente com e-mail e senha.");
  }

  async function entrarComSenha(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      if (error.message === "Invalid login credentials") {
        setErro("E-mail ou senha incorretos. Se você entrava com o Google, use o botão do Google.");
      } else if (error.message === "Email not confirmed") {
        setErro("Seu e-mail ainda não foi confirmado. Use \"Esqueci minha senha\" para receber um link de acesso.");
      } else {
        setErro(error.message);
      }
      return;
    }
    window.location.href = "/";
  }

  async function cadastrarNovoUsuario(e) {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    if (nomeLimpo.length < 2 || nomeLimpo.includes("@")) {
      setErro("Digite seu nome (é assim que seus amigos vão te ver).");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setEnviando(true);
    const supabase = criarClienteSupabase();
    const convite = lerConvite();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: { full_name: nomeLimpo, ...(convite ? { convite_pendente: convite } : {}) },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setEnviando(false);

    if (error) {
      setErro(error.message === "User already registered" ? "Esse e-mail já tem uma conta. Toque em \"Entrar\"." : error.message);
      return;
    }
    if (data?.session) {
      window.location.href = "/";
      return;
    }
    setMensagemSucesso("Conta criada! Confira seu e-mail (inclusive o spam) para confirmar e depois entre.");
  }

  async function enviarLinkDeAcesso(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setEnviando(false);
    if (error) {
      setErro("Não encontramos uma conta com esse e-mail. Confira o endereço ou crie uma conta.");
      return;
    }
    setMensagemSucesso(
      `Enviamos um link de acesso para ${email.trim()}. Abra o link neste mesmo celular e navegador.`
    );
  }

  const cadastro = modo === "cadastro";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 18px" }}>
          <div style={styles.glowCircle} />
          <div style={styles.glowIcon}>🕊️</div>
        </div>
        <h1 style={styles.title}>Devocional Diário</h1>
        <p style={styles.subtitle}>Um versículo por dia e um devocional guiado para o seu momento.</p>

        {appInterno && (
          <div style={styles.bannerApp}>
            <strong>Você abriu pelo {appInterno}.</strong> Aqui dentro o login com Google não funciona.
            Crie sua conta com e-mail e senha abaixo, ou abra no navegador do celular.
            <div>
              {/Android/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "") && (
                <a href={linkAbrirNoChrome()} style={styles.bannerBtn}>Abrir no Chrome</a>
              )}
              <button type="button" style={styles.bannerBtn} onClick={copiarLink}>
                {linkCopiado ? "Link copiado ✓" : "Copiar link"}
              </button>
            </div>
          </div>
        )}

        <div style={styles.tabContainer}>
          <button type="button" style={cadastro ? styles.tabActive : styles.tabInactive} onClick={() => trocarModo("cadastro")}>
            Criar conta
          </button>
          <button type="button" style={!cadastro ? styles.tabActive : styles.tabInactive} onClick={() => trocarModo("entrar")}>
            Já tenho conta
          </button>
        </div>

        <div style={styles.card}>
          {temDevocionalPendente && !mensagemSucesso && (
            <div style={styles.conviteBox}>🔥 Seu devocional de hoje fica salvo assim que você entrar — é o dia 1 da sua ofensiva.</div>
          )}

          {cadastro && temConvite && !mensagemSucesso && (
            <div style={styles.conviteBox}>🤝 Você veio por um convite. Ao criar a conta, vocês já ficam conectados.</div>
          )}

          {mensagemSucesso ? (
            <div style={{ textAlign: "center" }}>
              <p style={styles.confirmText}>{mensagemSucesso}</p>
              <button style={{ ...styles.primaryBtn, marginTop: 14 }} onClick={() => trocarModo("entrar")}>
                Voltar
              </button>
            </div>
          ) : modo === "recuperar" ? (
            <form onSubmit={enviarLinkDeAcesso}>
              <p style={{ ...styles.confirmText, marginBottom: 12 }}>
                Digite seu e-mail e enviaremos um link para você entrar sem senha.
              </p>
              <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
              <button className="action-btn" type="submit" style={styles.primaryBtn} disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar link de acesso"}
              </button>
              <button type="button" style={styles.linkToggleBtn} onClick={() => trocarModo("entrar")}>
                « Voltar
              </button>
            </form>
          ) : (
            <>
              {!appInterno && (
                <>
                  <button className="action-btn" style={styles.googleBtn} onClick={entrarComGoogle}>
                    <span style={{ fontSize: 18 }}>G</span> {cadastro ? "Criar conta com Google" : "Entrar com Google"}
                  </button>
                  <div style={styles.divider}>
                    <span style={styles.dividerText}>ou com e-mail</span>
                  </div>
                </>
              )}

              {cadastro ? (
                <form onSubmit={cadastrarNovoUsuario}>
                  <input type="text" required autoComplete="name" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} style={styles.input} />
                  <input type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                  <input type="password" required autoComplete="new-password" placeholder="Crie uma senha (mínimo 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} style={styles.input} />
                  <button className="action-btn" type="submit" style={styles.primaryBtn} disabled={enviando}>
                    {enviando ? "Criando conta..." : "Criar minha conta ✨"}
                  </button>
                </form>
              ) : (
                <form onSubmit={entrarComSenha}>
                  <input type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                  <input type="password" required autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} style={styles.input} />
                  <button className="action-btn" type="submit" style={styles.primaryBtn} disabled={enviando}>
                    {enviando ? "Entrando..." : "Entrar"}
                  </button>
                  <button type="button" style={styles.linkToggleBtn} onClick={() => trocarModo("recuperar")}>
                    Esqueci minha senha
                  </button>
                </form>
              )}
            </>
          )}

          {erro && <p style={styles.errorText}>{erro}</p>}
        </div>

        <p style={styles.footnote}>Gratuito. Leva menos de 1 minuto.</p>
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
  bannerApp: {
    background: "#FFF6E0",
    border: "1px solid #E8CF8E",
    borderRadius: 14,
    padding: "14px 16px",
    textAlign: "left",
    marginBottom: 16,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: "#5A4516",
  },
  bannerBtn: {
    display: "inline-block",
    marginTop: 10,
    marginRight: 8,
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
  },
  conviteBox: {
    background: "#EAF0EC",
    border: "1px solid #C9D8CD",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#33422F",
    marginBottom: 14,
  },
  footnote: {
    fontSize: 11.5,
    color: "#9AA79C",
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 1.5,
  },
};
