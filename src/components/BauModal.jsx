"use client";

import { useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

const TITULOS_ORIGEM = {
  guia_completo: "Você completou um guia de leitura! 📖",
  marco_ofensiva: "Novo marco de ofensiva! 🔥",
};

/**
 * Modal do Baú de Bênçãos. A recompensa só é sorteada no servidor quando o
 * usuário clica em abrir (RPC abrir_bau) -- nunca antes, pra não dar pra
 * adivinhar/manipular o valor.
 */
export default function BauModal({ bauId, aoFechar, aoAbrir }) {
  const [abrindo, setAbrindo] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  if (!bauId) return null;

  async function handleAbrir() {
    setAbrindo(true);
    setErro(null);
    try {
      const supabase = criarClienteSupabase();
      const { data, error } = await supabase.rpc("abrir_bau", { p_bau_id: bauId });
      if (error) {
        setErro(error.message || "Não foi possível abrir o baú agora.");
        return;
      }
      const linha = Array.isArray(data) ? data[0] : data;
      setResultado(linha);
      setAberto(true);
      aoAbrir?.(linha);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <div style={estilos.overlay} onClick={aberto ? aoFechar : undefined}>
      <div style={estilos.modal} onClick={(e) => e.stopPropagation()}>
        {!aberto ? (
          <>
            <p style={estilos.emoji}>🎁</p>
            <h3 style={estilos.titulo}>{TITULOS_ORIGEM[resultado?.origem] || "Baú de Bênçãos!"}</h3>
            <p style={estilos.subtitulo}>Você ganhou um baú de recompensa. Toque para abrir.</p>
            {erro && <p style={estilos.erro}>{erro}</p>}
            <button style={estilos.btnAbrir} onClick={handleAbrir} disabled={abrindo}>
              {abrindo ? "Abrindo..." : "Abrir Baú"}
            </button>
          </>
        ) : (
          <>
            <p style={estilos.emoji}>🌱</p>
            <h3 style={estilos.titulo}>+{resultado?.sementes_ganhas} Sementes de Fé!</h3>
            <p style={estilos.subtitulo}>Use suas sementes na loja para comprar um Congelar Ofensiva.</p>
            <button style={estilos.btnFechar} onClick={aoFechar}>
              Continuar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30, 40, 32, 0.65)",
    backdropFilter: "blur(4px)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 24,
    maxWidth: 340,
    width: "100%",
    padding: "32px 24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  emoji: { fontSize: 56, margin: "0 0 8px" },
  titulo: {
    fontFamily: "'Fraunces', serif",
    fontSize: 19,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 6px",
  },
  subtitulo: { fontSize: 13, color: "#7A8A7F", margin: "0 0 20px", lineHeight: 1.4 },
  erro: { fontSize: 12.5, color: "#B15A4A", fontWeight: 600, margin: "0 0 12px" },
  btnAbrir: {
    width: "100%",
    background: "linear-gradient(180deg, #E3B76A 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 14,
    padding: "13px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  btnFechar: {
    width: "100%",
    background: "#3F7A4D",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 14,
    padding: "13px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};
