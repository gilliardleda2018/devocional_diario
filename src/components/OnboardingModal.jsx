"use client";

import { useState, useEffect } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

const RESERVED_USERNAMES = [
  "admin", "administrator", "support", "devocional", "devocionaldiario", "system", "root"
];

export default function OnboardingModal({ usuario, perfilAtual, aoConcluir }) {
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Campos do formulário
  const [nomeExibicao, setNomeExibicao] = useState(perfilAtual?.nome_exibicao || usuario?.user_metadata?.full_name || "");
  const [username, setUsername] = useState(perfilAtual?.username || "");
  const [fotoUrl, setFotoUrl] = useState(perfilAtual?.foto_url || usuario?.user_metadata?.avatar_url || "");
  const [cidade, setCidade] = useState(perfilAtual?.cidade || "");
  const [igreja, setIgreja] = useState(perfilAtual?.igreja || "");
  const [bio, setBio] = useState(perfilAtual?.bio || "");

  // Privacidade
  const [privacidade, setPrivacidade] = useState({
    discoverable: true,
    allow_friend_requests: true,
    show_city: true,
    show_church: true,
  });

  // Sugestões no passo final
  const [sugestoes, setSugestoes] = useState([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const [pedidosEnviados, setPedidosEnviados] = useState({});

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
  }, [nomeExibicao, usuario]);

  // Carrega sugestões no passo 4
  useEffect(() => {
    if (passo === 4) {
      let vivo = true;
      async function carregarPessoas() {
        setCarregandoSugestoes(true);
        try {
          const supabase = criarClienteSupabase();
          const { data } = await supabase.rpc("obter_recomendacoes_pessoas", { p_limite: 4 });
          if (vivo && data) setSugestoes(data);
        } catch (e) {
          console.error("Erro ao obter recomendações:", e);
        } finally {
          if (vivo) setCarregandoSugestoes(false);
        }
      }
      carregarPessoas();
      return () => { vivo = false; };
    }
  }, [passo]);

  function validarUsername(user) {
    const limpo = user.trim().toLowerCase().replace("@", "");
    if (!limpo) return "Por favor insira um nome de usuário.";
    if (limpo.length < 3) return "Username deve ter no mínimo 3 caracteres.";
    if (limpo.length > 20) return "Username deve ter no máximo 20 caracteres.";
    if (RESERVED_USERNAMES.includes(limpo)) return "Este nome de usuário é reservado.";
    if (!/^[a-z0-9_.]+$/.test(limpo)) return "Use apenas letras, números, ponto ou underline.";
    return null;
  }

  async function salvarPerfil(finalizar = false) {
    setErro(null);
    const erroUser = validarUsername(username);
    if (erroUser) {
      setErro(erroUser);
      return false;
    }

    setSalvando(true);
    try {
      const supabase = criarClienteSupabase();
      const uLimpo = username.trim().toLowerCase().replace("@", "");

      // Verifica se username já existe para outro usuário
      const { data: usuarioExistente } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", uLimpo)
        .neq("id", usuario.id)
        .maybeSingle();

      if (usuarioExistente) {
        setErro("Este nome de usuário já está em uso por outra pessoa.");
        setSalvando(false);
        return false;
      }

      // Upsert no perfil
      const { error: errProf } = await supabase.from("profiles").upsert({
        id: usuario.id,
        nome_exibicao: nomeExibicao.trim() || "Fiel",
        username: uLimpo,
        foto_url: fotoUrl || null,
        cidade: cidade.trim() || null,
        igreja: igreja.trim() || null,
        bio: bio.trim() || null,
        status: "ACTIVE",
        atualizado_em: new Date().toISOString(),
      });

      if (errProf) throw errProf;

      // Grava configurações de privacidade
      await supabase.from("user_privacy_settings").upsert({
        user_id: usuario.id,
        discoverable: privacidade.discoverable,
        allow_friend_requests: privacidade.allow_friend_requests,
        show_city: privacidade.show_city,
        show_church: privacidade.show_church,
        atualizado_em: new Date().toISOString(),
      });

      if (finalizar && aoConcluir) {
        aoConcluir();
      }
      return true;
    } catch (e) {
      console.error("Erro ao salvar onboarding:", e);
      setErro(e.message || "Erro ao salvar perfil.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function avancarPasso() {
    if (passo === 1) {
      const ok = await salvarPerfil(false);
      if (ok) setPasso(2);
    } else if (passo === 2) {
      await salvarPerfil(false);
      setPasso(3);
    } else if (passo === 3) {
      await salvarPerfil(false);
      setPasso(4);
    } else if (passo === 4) {
      await salvarPerfil(true);
    }
  }

  async function adicionarAmigoSugestao(candId) {
    try {
      const supabase = criarClienteSupabase();
      await supabase.rpc("enviar_pedido_amizade_v2", { p_identificador: candId });
      setPedidosEnviados((prev) => ({ ...prev, [candId]: true }));
    } catch (e) {
      console.error("Erro ao adicionar:", e);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Barra de progresso */}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(passo / 4) * 100}%` }} />
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>
            {passo === 1 && "Bem-vindo ao Devocional Diário! 🕊️"}
            {passo === 2 && "Sua Comunidade & Localização 📍"}
            {passo === 3 && "Sua Privacidade em Primeiro Lugar 🔒"}
            {passo === 4 && "Caminhe com Outros Fiéis 🤝"}
          </h2>
          <p style={styles.subtitle}>
            {passo === 1 && "Configure seu nome de exibição e identificador único."}
            {passo === 2 && "Compartilhe sua cidade e igreja se desejar se conectar."}
            {passo === 3 && "Você está no controle de quem pode te encontrar."}
            {passo === 4 && "Descubra conexões com base na sua fé e interesses."}
          </p>
        </div>

        {/* Conteúdo do Passo */}
        <div style={styles.body}>
          {passo === 1 && (
            <div>
              <label style={styles.label}>Nome de Exibição *</label>
              <input
                type="text"
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                placeholder="Como quer ser chamado?"
                style={styles.input}
              />

              <label style={styles.label}>Nome de Usuário (@username) *</label>
              <div style={styles.usernameWrapper}>
                <span style={styles.atSymbol}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_username"
                  style={styles.inputUsername}
                />
              </div>

              <label style={styles.label}>URL da Foto de Perfil (Opcional)</label>
              <input
                type="url"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                style={styles.input}
              />

              <label style={styles.label}>Biografia curta (Opcional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Uma frase sobre você ou seu versículo favorito..."
                style={{ ...styles.input, height: 60, resize: "none" }}
              />
            </div>
          )}

          {passo === 2 && (
            <div>
              <label style={styles.label}>Cidade / Região (Opcional)</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: São Paulo - SP"
                style={styles.input}
              />

              <label style={styles.label}>Sua Igreja ou Comunidade (Opcional)</label>
              <input
                type="text"
                value={igreja}
                onChange={(e) => setIgreja(e.target.value)}
                placeholder="Ex: Igreja Batista Central"
                style={styles.input}
              />
              <p style={styles.tipText}>
                💡 Preencher estes campos ajuda a sugerir irmãos da mesma região ou comunidade.
              </p>
            </div>
          )}

          {passo === 3 && (
            <div>
              <div style={styles.switchRow}>
                <div>
                  <strong>Perfil Descobrível</strong>
                  <p style={styles.switchSub}>Permitir aparecer na busca de pessoas e sugestões</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacidade.discoverable}
                  onChange={(e) => setPrivacidade({ ...privacidade, discoverable: e.target.checked })}
                  style={styles.checkbox}
                />
              </div>

              <div style={styles.switchRow}>
                <div>
                  <strong>Receber Pedidos de Amizade</strong>
                  <p style={styles.switchSub}>Outros membros podem te enviar solicitações</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacidade.allow_friend_requests}
                  onChange={(e) => setPrivacidade({ ...privacidade, allow_friend_requests: e.target.checked })}
                  style={styles.checkbox}
                />
              </div>

              <div style={styles.switchRow}>
                <div>
                  <strong>Exibir Minha Cidade</strong>
                  <p style={styles.switchSub}>Mostrar cidade para conexões e buscas</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacidade.show_city}
                  onChange={(e) => setPrivacidade({ ...privacidade, show_city: e.target.checked })}
                  style={styles.checkbox}
                />
              </div>

              <div style={styles.switchRow}>
                <div>
                  <strong>Exibir Minha Igreja</strong>
                  <p style={styles.switchSub}>Mostrar comunidade religiosa no perfil público</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacidade.show_church}
                  onChange={(e) => setPrivacidade({ ...privacidade, show_church: e.target.checked })}
                  style={styles.checkbox}
                />
              </div>
            </div>
          )}

          {passo === 4 && (
            <div>
              {carregandoSugestoes ? (
                <p style={{ textAlign: "center", color: "#7A8A7F" }}>Carregando sugestões...</p>
              ) : sugestoes.length === 0 ? (
                <p style={{ textAlign: "center", color: "#7A8A7F", margin: "20px 0" }}>
                  Você é um dos primeiros por aqui! Continue e adicione amigos depois pelo código de amigo.
                </p>
              ) : (
                <div style={styles.sugestoesGrid}>
                  {sugestoes.map((item) => (
                    <div key={item.candidate_id} style={styles.sugestaoCard}>
                      <div style={styles.avatarMini}>
                        {item.foto_url ? (
                          <img src={item.foto_url} alt="" style={styles.avatarImg} />
                        ) : (
                          item.nome_exibicao?.slice(0, 2).toUpperCase() || "FI"
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.candNome}>{item.nome_exibicao}</div>
                        <div style={styles.candReason}>{item.reason_text || "Comunidade"}</div>
                      </div>
                      <button
                        style={pedidosEnviados[item.candidate_id] ? styles.btnAdicionado : styles.btnAdicionar}
                        disabled={pedidosEnviados[item.candidate_id]}
                        onClick={() => adicionarAmigoSugestao(item.candidate_id)}
                      >
                        {pedidosEnviados[item.candidate_id] ? "Enviado" : "➕ Adicionar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {erro && <p style={styles.errorText}>{erro}</p>}
        </div>

        {/* Rodapé do Modal */}
        <div style={styles.footer}>
          {passo > 1 && (
            <button
              style={styles.btnSecondary}
              onClick={() => setPasso(passo - 1)}
              disabled={salvando}
            >
              Voltar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            style={styles.btnPrimary}
            onClick={avancarPasso}
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : passo === 4
              ? "Concluir Onboarding ✨"
              : "Próximo »"}
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
    maxWidth: 460,
    width: "100%",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    overflow: "hidden",
    border: "1px solid #E7E0D0",
    display: "flex",
    flexDirection: "column",
  },
  progressBar: {
    height: 6,
    background: "#E7E0D0",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    background: "#B98B4E",
    transition: "width 0.3s ease",
  },
  header: {
    padding: "20px 24px 12px",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 20,
    color: "#33422F",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: 13,
    color: "#7A8A7F",
    margin: 0,
  },
  body: {
    padding: "10px 24px 20px",
  },
  label: {
    display: "block",
    fontSize: 12.5,
    fontWeight: 700,
    color: "#33422F",
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    padding: "10px 12px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 13.5,
    background: "#FFFFFF",
    color: "#2D3B33",
    boxSizing: "border-box",
  },
  usernameWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    paddingLeft: 12,
  },
  atSymbol: {
    color: "#B98B4E",
    fontWeight: 700,
    fontSize: 15,
  },
  inputUsername: {
    width: "100%",
    border: "none",
    padding: "10px 8px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 13.5,
    outline: "none",
    background: "transparent",
    color: "#2D3B33",
  },
  tipText: {
    fontSize: 12,
    color: "#7A8A7F",
    marginTop: 8,
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px dashed #E7E0D0",
  },
  switchSub: {
    fontSize: 11.5,
    color: "#7A8A7F",
    margin: "2px 0 0",
  },
  checkbox: {
    accentColor: "#B98B4E",
    width: 18,
    height: 18,
    cursor: "pointer",
  },
  sugestoesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 10,
  },
  sugestaoCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 12,
    padding: 10,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#EAF0EC",
    color: "#33422F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 12,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  candNome: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "#33422F",
  },
  candReason: {
    fontSize: 11.5,
    color: "#7A8A7F",
  },
  btnAdicionar: {
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnAdicionado: {
    background: "#EAF0EC",
    color: "#4F6D5C",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
  errorText: {
    fontSize: 12.5,
    color: "#B15A4A",
    marginTop: 10,
    marginBottom: 0,
  },
  footer: {
    padding: "14px 24px",
    background: "#F6EFE1",
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid #E7E0D0",
  },
  btnPrimary: {
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "transparent",
    color: "#7A8A7F",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
};
