"use client";

import { useState, useEffect } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import { validarUsername } from "@/src/lib/constants";

const AVATARES_PRESET = [
  "🕊️", "✝️", "🌿", "⚓", "🛡️", "👑",
  "💡", "🔥", "⭐", "📖", "🦁", "🌅"
];

export default function PerfilModal({ usuario, perfilAtual, aberto, aoFechar, aoSalvar }) {
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [username, setUsername] = useState("");
  const [cidade, setCidade] = useState("");
  const [igreja, setIgreja] = useState("");
  const [bio, setBio] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [urlPersonalizada, setUrlPersonalizada] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    if (aberto && usuario) {
      setNomeExibicao(perfilAtual?.nome_exibicao || usuario?.user_metadata?.full_name || "");
      setNomeCompleto(perfilAtual?.nome_completo || usuario?.user_metadata?.full_name || "");
      setUsername(perfilAtual?.username || "");
      setCidade(perfilAtual?.cidade || "");
      setIgreja(perfilAtual?.igreja || "");
      setBio(perfilAtual?.bio || "");
      setFotoUrl(perfilAtual?.foto_url || usuario?.user_metadata?.avatar_url || "");
    }
  }, [aberto, perfilAtual, usuario]);

  if (!aberto) return null;

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    const fotoFinal = urlPersonalizada.trim() || fotoUrl;
    let usernameLimpo = null;

    if (username.trim()) {
      const val = validarUsername(username);
      if (!val.valido) {
        setMensagem({ tipo: "erro", texto: val.erro });
        setSalvando(false);
        return;
      }
      usernameLimpo = val.usernameLimpo;
    }

    try {
      const supabase = criarClienteSupabase();

      // Verifica duplicidade de username se alterou
      if (usernameLimpo) {
        const { data: existente } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", usernameLimpo)
          .neq("id", usuario.id)
          .maybeSingle();

        if (existente) {
          setMensagem({ tipo: "erro", texto: "Username já em uso por outra pessoa." });
          setSalvando(false);
          return;
        }
      }

      const payloadCompleto = {
        id: usuario.id,
        nome_exibicao: nomeExibicao.trim(),
        nome_completo: nomeCompleto.trim() || nomeExibicao.trim(),
        username: usernameLimpo || null,
        foto_url: fotoFinal || null,
        cidade: cidade.trim() || null,
        igreja: igreja.trim() || null,
        bio: bio.trim() || null,
      };

      const { error } = await supabase.from("profiles").upsert(payloadCompleto);

      if (error) {
        console.warn("Retentando salvar perfil com campos básicos:", error);
        const { error: errFallback } = await supabase.from("profiles").upsert({
          id: usuario.id,
          nome_exibicao: nomeExibicao.trim(),
          foto_url: fotoFinal || null,
        });
        if (errFallback) throw errFallback;
      }

      if (aoSalvar) {
        aoSalvar({
          nome_exibicao: nomeExibicao.trim(),
          foto_url: fotoFinal,
          username: usernameLimpo,
          nome_completo: nomeCompleto.trim() || null,
          cidade: cidade.trim() || null,
          igreja: igreja.trim() || null,
          bio: bio.trim() || null,
        });
      }

      setMensagem({ tipo: "sucesso", texto: "Perfil atualizado com sucesso! ✨" });
      setTimeout(() => {
        aoFechar();
      }, 1000);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      setMensagem({ tipo: "erro", texto: "Não foi possível salvar as alterações." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={aoFechar}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div style={styles.header}>
          <h3 style={styles.title}>👤 Editar Meu Perfil</h3>
          <button onClick={aoFechar} style={styles.closeBtn}>✕</button>
        </div>

        {/* Preview */}
        <div style={{ textAlign: "center", margin: "10px 0" }}>
          <AvatarUsuario
            nome={nomeExibicao}
            fotoUrl={urlPersonalizada.trim() || fotoUrl}
            tamanho={56}
            moldura={true}
          />
          {username && <p style={styles.usernamePreview}>@{username.replace("@", "")}</p>}
        </div>

        <form onSubmit={handleSalvar} style={styles.form}>
          <div style={styles.rowGrid}>
            <div>
              <label style={styles.label}>Nome de Exibição *</label>
              <input
                type="text"
                required
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Username (@username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_username"
                style={styles.input}
              />
            </div>
          </div>

          <label style={styles.label}>Nome Completo</label>
          <input
            type="text"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            style={styles.input}
          />

          <div style={styles.rowGrid}>
            <div>
              <label style={styles.label}>Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: São Paulo - SP"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Igreja / Comunidade</label>
              <input
                type="text"
                value={igreja}
                onChange={(e) => setIgreja(e.target.value)}
                placeholder="Ex: Igreja Central"
                style={styles.input}
              />
            </div>
          </div>

          <label style={styles.label}>Bio / Frase Pessoal</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Compartilhe seu versículo ou mensagem..."
            style={{ ...styles.input, height: 50, resize: "none" }}
          />

          {/* Preset de Avatares */}
          <div>
            <label style={styles.label}>Escolha um Ícone:</label>
            <div style={styles.emojiGrid}>
              {AVATARES_PRESET.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { setFotoUrl(emoji); setUrlPersonalizada(""); }}
                  style={{
                    ...styles.emojiBtn,
                    background: fotoUrl === emoji && !urlPersonalizada ? "#F1E2C4" : "#FFFFFF",
                    borderColor: fotoUrl === emoji && !urlPersonalizada ? "#B98B4E" : "#E7E0D0",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <label style={styles.label}>URL da Foto Personalizada</label>
          <input
            type="url"
            value={urlPersonalizada}
            onChange={(e) => setUrlPersonalizada(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            style={styles.input}
          />

          {mensagem && (
            <p style={{ ...styles.mensagem, color: mensagem.tipo === "sucesso" ? "#3F7A4D" : "#B15A4A" }}>
              {mensagem.texto}
            </p>
          )}

          <div style={styles.footer}>
            <button type="button" onClick={aoFechar} style={styles.btnSec}>Cancelar</button>
            <button type="submit" disabled={salvando} style={styles.btnPrim}>
              {salvando ? "Salvando..." : "Salvar Alterações"}
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
    background: "rgba(30, 40, 35, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FBF9F3",
    borderRadius: 20,
    maxWidth: 440,
    width: "100%",
    padding: 20,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    border: "1px solid #E7E0D0",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #E7E0D0",
    paddingBottom: 10,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    color: "#33422F",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#7A8A7F",
    cursor: "pointer",
  },
  usernamePreview: {
    fontSize: 12,
    fontWeight: 700,
    color: "#B98B4E",
    margin: "4px 0 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 10,
  },
  rowGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  label: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#33422F",
    display: "block",
    marginBottom: 3,
  },
  input: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid #E7E0D0",
    padding: "8px 10px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 13,
    background: "#FFFFFF",
    color: "#2D3B33",
    boxSizing: "border-box",
  },
  emojiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 6,
  },
  emojiBtn: {
    height: 36,
    borderRadius: 8,
    border: "1px solid #E7E0D0",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mensagem: {
    fontSize: 12.5,
    fontWeight: 700,
    textAlign: "center",
    margin: "4px 0",
  },
  footer: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },
  btnPrim: {
    flex: 1,
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "10px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  btnSec: {
    flex: 1,
    background: "transparent",
    color: "#7A8A7F",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "10px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
