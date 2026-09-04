"use client";

import { useMemo } from "react";

export function obterIniciais(nome) {
  if (!nome) return "👤";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const PALETA_CORES = [
  "from-amber-500 to-amber-700",
  "from-blue-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-purple-500 to-indigo-800",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-blue-700",
];

export function obterCorGradiente(identificador) {
  if (!identificador) return PALETA_CORES[0];
  let hash = 0;
  for (let i = 0; i < identificador.length; i++) {
    hash = identificador.charCodeAt(i) + ((hash << 5) - hash);
  }
  const indice = Math.abs(hash) % PALETA_CORES.length;
  return PALETA_CORES[indice];
}

export default function AvatarUsuario({ nome, fotoUrl, tamanho = 26, moldura = true, className = "" }) {
  const iniciais = useMemo(() => obterIniciais(nome), [nome]);
  const gradiente = useMemo(() => obterCorGradiente(nome || fotoUrl), [nome, fotoUrl]);

  // Se fotoUrl for um emoji/preset curto
  const eEmoji = fotoUrl && fotoUrl.length <= 4;

  const containerStyle = {
    width: `${tamanho}px`,
    height: `${tamanho}px`,
    minWidth: `${tamanho}px`,
    minHeight: `${tamanho}px`,
    maxWidth: `${tamanho}px`,
    maxHeight: `${tamanho}px`,
    borderRadius: "50%",
    overflow: "hidden",
    display: "inline-block",
    verticalAlign: "middle",
    flexShrink: 0,
    border: moldura ? "1.5px solid #C89A5E" : "1.5px solid #E7E0D0",
    boxShadow: moldura
      ? "0 0 0 1.5px rgba(200, 154, 94, 0.25), 0 1px 3px rgba(0,0,0,0.1)"
      : "0 1px 3px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
    position: "relative",
    background: "#F1EAD6",
  };

  const imgStyle = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    display: "block",
  };

  return (
    <div className={className} style={containerStyle}>
      {fotoUrl && !eEmoji ? (
        <img
          src={fotoUrl}
          alt={nome || "Avatar do usuário"}
          style={imgStyle}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : eEmoji ? (
        <div
          className={`bg-gradient-to-br ${gradiente}`}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: tamanho * 0.46,
            borderRadius: "50%",
            userSelect: "none",
          }}
        >
          {fotoUrl}
        </div>
      ) : (
        <div
          className={`bg-gradient-to-br ${gradiente}`}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: 700,
            letterSpacing: 1,
            fontSize: tamanho * 0.38,
            borderRadius: "50%",
            userSelect: "none",
          }}
        >
          {iniciais}
        </div>
      )}
    </div>
  );
}
