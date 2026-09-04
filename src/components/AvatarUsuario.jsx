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

export default function AvatarUsuario({ nome, fotoUrl, tamanho = 32, className = "" }) {
  const iniciais = useMemo(() => obterIniciais(nome), [nome]);
  const gradiente = useMemo(() => obterCorGradiente(nome || fotoUrl), [nome, fotoUrl]);

  // Se fotoUrl for um emoji/preset curto
  const eEmoji = fotoUrl && fotoUrl.length <= 4;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 shadow-sm border border-amber-500/25 dark:border-amber-400/30 transition-all ${className}`}
      style={{ width: tamanho, height: tamanho, minWidth: tamanho, minHeight: tamanho }}
    >
      {fotoUrl && !eEmoji ? (
        <img
          src={fotoUrl}
          alt={nome || "Avatar do usuário"}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Em caso de erro de carregamento da imagem, esconde a img e cai no fallback
            e.currentTarget.style.display = "none";
          }}
        />
      ) : eEmoji ? (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradiente} flex items-center justify-center text-white select-none`}
          style={{ fontSize: tamanho * 0.46 }}
        >
          {fotoUrl}
        </div>
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradiente} flex items-center justify-center text-white font-semibold tracking-wider select-none`}
          style={{ fontSize: tamanho * 0.38 }}
        >
          {iniciais}
        </div>
      )}
    </div>
  );
}
