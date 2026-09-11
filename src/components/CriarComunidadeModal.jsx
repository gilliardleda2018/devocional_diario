"use client";

import { useState } from "react";
import { TIPOS_COMUNIDADE } from "@/src/lib/hooks/useComunidades";

export default function CriarComunidadeModal({ aberto, aoFechar, aoCriar }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("GENERAL");
  const [visibilidade, setVisibilidade] = useState("PUBLIC");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  if (!aberto) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (nome.trim().length < 3) {
      setErro("Dê um nome com pelo menos 3 caracteres pra comunidade.");
      return;
    }
    setSalvando(true);
    setErro(null);
    const res = await aoCriar({ nome: nome.trim(), descricao: descricao.trim(), tipo, visibilidade });
    setSalvando(false);
    if (res?.sucesso) {
      setNome("");
      setDescricao("");
      setTipo("GENERAL");
      setVisibilidade("PUBLIC");
      aoFechar();
    } else {
      setErro(res?.erro || "Não foi possível criar a comunidade.");
    }
  }

  return (
    <div style={estilos.overlay} onClick={aoFechar}>
      <div style={estilos.modal} onClick={(e) => e.stopPropagation()}>
        <div style={estilos.header}>
          <h3 style={estilos.titulo}>🏛️ Criar Comunidade</h3>
          <button style={estilos.fechar} onClick={aoFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={estilos.form}>
          {erro && <p style={estilos.erro}>{erro}</p>}

          <label style={estilos.label}>Nome da Comunidade</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Igreja Central, Jovens em Cristo..."
            style={estilos.input}
            maxLength={60}
            required
          />

          <label style={estilos.label}>Descrição (opcional)</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Do que se trata essa comunidade?"
            style={{ ...estilos.input, height: 60, resize: "none" }}
            maxLength={200}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={estilos.input}>
                {TIPOS_COMUNIDADE.map((t) => (
                  <option key={t.id} value={t.id}>{t.icone} {t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={estilos.label}>Visibilidade</label>
              <select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)} style={estilos.input}>
                <option value="PUBLIC">🌐 Pública (qualquer um entra)</option>
                <option value="PRIVATE">🔒 Privada (só por convite)</option>
              </select>
            </div>
          </div>

          <div style={estilos.footer}>
            <button type="button" onClick={aoFechar} style={estilos.btnSec}>Cancelar</button>
            <button type="submit" disabled={salvando} style={estilos.btnPrim}>
              {salvando ? "Criando..." : "Criar Comunidade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30, 40, 32, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 20,
    maxWidth: 420,
    width: "100%",
    padding: 22,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  titulo: { fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: "#33422F", margin: 0 },
  fechar: { background: "transparent", border: "none", fontSize: 18, color: "#7A8A7F", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 11.5, fontWeight: 700, color: "#33422F", marginTop: 4 },
  input: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
    padding: "9px 11px",
    fontFamily: "'Karla', sans-serif",
    fontSize: 13.5,
    color: "#2D3B33",
    boxSizing: "border-box",
  },
  erro: { fontSize: 12.5, color: "#B15A4A", background: "#FDF2F2", padding: "8px 10px", borderRadius: 8, margin: 0 },
  footer: { display: "flex", gap: 10, marginTop: 10 },
  btnPrim: {
    flex: 1,
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
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
