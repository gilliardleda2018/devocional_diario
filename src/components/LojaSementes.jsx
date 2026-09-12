"use client";

import { useState } from "react";
import { showToast } from "@/src/lib/ui/toast";

const PRECO_CONGELAMENTO = 50;

const COSMETICOS = [
  { item: "avatar_borboleta", emoji: "🦋", nome: "Avatar Borboleta", preco: 60 },
  { item: "avatar_arco_iris", emoji: "🌈", nome: "Avatar Arco-íris", preco: 60 },
  { item: "avatar_diamante", emoji: "💎", nome: "Avatar Diamante", preco: 80 },
  { item: "avatar_medalha", emoji: "🎖️", nome: "Avatar Medalha", preco: 80 },
  { item: "avatar_raio", emoji: "⚡", nome: "Avatar Raio", preco: 100 },
  { item: "avatar_trofeu", emoji: "🏆", nome: "Avatar Troféu", preco: 120 },
];

/**
 * Loja de Sementes de Fé -- vende "Congelar Ofensiva" e avatares cosméticos
 * exclusivos. Um item comprado fica no inventário pra sempre; pra usar, é só
 * escolhê-lo em "Editar Perfil" junto com os presets gratuitos.
 */
export default function LojaSementes({
  aberto,
  aoFechar,
  saldo = 0,
  congelamentos = 0,
  possuiItem = () => false,
  comprarCongelamento,
  comprarCosmetico,
  carregando = false,
}) {
  const [comprando, setComprando] = useState(null);

  if (!aberto) return null;

  async function handleComprarCongelamento() {
    setComprando("congelar_ofensiva");
    const res = await comprarCongelamento();
    setComprando(null);
    if (res?.sucesso) {
      showToast("🧊 Congelar Ofensiva comprado!", "sucesso");
    } else {
      showToast(res?.erro || "Não foi possível comprar.");
    }
  }

  async function handleComprarCosmetico(cosmetico) {
    setComprando(cosmetico.item);
    const res = await comprarCosmetico(cosmetico.item);
    setComprando(null);
    if (res?.sucesso) {
      showToast(`${cosmetico.emoji} ${cosmetico.nome} desbloqueado! Escolha-o em Editar Perfil.`, "sucesso");
    } else {
      showToast(res?.erro || "Não foi possível comprar.");
    }
  }

  return (
    <div style={estilos.overlay} onClick={aoFechar}>
      <div style={estilos.modal} onClick={(e) => e.stopPropagation()}>
        <button style={estilos.fechar} onClick={aoFechar}>
          ✕
        </button>
        <h3 style={estilos.titulo}>🌱 Loja de Sementes</h3>
        <p style={estilos.saldo}>{carregando ? "Carregando..." : `Seu saldo: ${saldo} sementes`}</p>

        <div style={estilos.conteudoRolavel}>
          <div style={estilos.item}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🧊</span>
              <div>
                <p style={estilos.itemNome}>Congelar Ofensiva</p>
                <p style={estilos.itemDesc}>Protege sua sequência se você faltar exatamente 1 dia.</p>
                {congelamentos > 0 && <p style={estilos.itemEstoque}>Você tem {congelamentos} em estoque</p>}
              </div>
            </div>
            <button
              style={estilos.btnComprar}
              disabled={comprando === "congelar_ofensiva" || saldo < PRECO_CONGELAMENTO}
              onClick={handleComprarCongelamento}
            >
              {comprando === "congelar_ofensiva" ? "..." : `${PRECO_CONGELAMENTO} 🌱`}
            </button>
          </div>

          <h4 style={estilos.secaoTitulo}>🎨 Avatares Exclusivos</h4>
          {COSMETICOS.map((c) => {
            const adquirido = possuiItem(c.item);
            return (
              <div key={c.item} style={estilos.item}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <div>
                    <p style={estilos.itemNome}>{c.nome}</p>
                    <p style={estilos.itemDesc}>Ícone exclusivo pra usar como foto de perfil.</p>
                  </div>
                </div>
                {adquirido ? (
                  <span style={estilos.badgeAdquirido}>✓ Adquirido</span>
                ) : (
                  <button
                    style={estilos.btnComprar}
                    disabled={comprando === c.item || saldo < c.preco}
                    onClick={() => handleComprarCosmetico(c)}
                  >
                    {comprando === c.item ? "..." : `${c.preco} 🌱`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {saldo < PRECO_CONGELAMENTO && (
          <p style={estilos.aviso}>Complete devocionais, quizzes e guias de leitura para ganhar mais sementes.</p>
        )}
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
    borderRadius: 24,
    maxWidth: 380,
    width: "100%",
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
    position: "relative",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
  },
  fechar: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "transparent",
    border: "none",
    fontSize: 18,
    color: "#7A8A7F",
    cursor: "pointer",
  },
  titulo: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#33422F",
    margin: "0 0 4px",
  },
  saldo: { fontSize: 13, color: "#8A6224", fontWeight: 700, margin: "0 0 18px" },
  conteudoRolavel: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingRight: 2,
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: 700,
    color: "#8A6224",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    margin: "10px 0 -2px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "14px 16px",
  },
  itemNome: { fontSize: 13.5, fontWeight: 700, color: "#33422F", margin: 0 },
  itemDesc: { fontSize: 11.5, color: "#7A8A7F", margin: "2px 0 0", lineHeight: 1.3, maxWidth: 190 },
  itemEstoque: { fontSize: 11, color: "#3F7A4D", fontWeight: 700, margin: "4px 0 0" },
  btnComprar: {
    flexShrink: 0,
    background: "linear-gradient(180deg, #8FCB9A 0%, #4F9463 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "2px solid #35704A",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  badgeAdquirido: {
    flexShrink: 0,
    background: "#EAF4EC",
    color: "#3F7A4D",
    border: "1px solid #A8D5B5",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 12,
  },
  aviso: { fontSize: 11.5, color: "#9AA79C", fontStyle: "italic", margin: "14px 0 0", textAlign: "center" },
};
