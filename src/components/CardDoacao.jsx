"use client";

import { useState } from "react";

import { copiarTextoSeguro } from "@/src/lib/util/copiarSeguro";

export default function CardDoacao({ compacto = false }) {
  const [copiado, setCopiado] = useState(false);
  const chavePix = "42.178.408/0001-06";

  async function copiarChave() {
    const ok = await copiarTextoSeguro("42178408000106");
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  if (compacto) {
    return (
      <div
        style={{
          background: "#FAF7F0",
          border: "1px solid #E7E0D0",
          borderRadius: 12,
          padding: "12px 14px",
          marginTop: 16,
          fontSize: 12,
          color: "#5C6B5F",
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: "0 0 8px" }}>
          🎗️ <strong>Apoie esta causa:</strong> As doações visam o desenvolvimento de uma tecnologia para auxiliar no <strong>diagnóstico de câncer oral</strong>.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#FFFFFF", border: "1px solid #E7E0D0", borderRadius: 8, padding: "6px 10px" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#33422F" }}>Pix: {chavePix}</span>
          <button
            type="button"
            className="action-btn"
            onClick={copiarChave}
            style={{
              background: copiado ? "#2E5B37" : "#B98B4E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {copiado ? "✓ Copiado!" : "📋 Copiar Pix"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FAF7F0 0%, #F5EFE3 100%)",
        border: "1px solid #E7E0D0",
        borderRadius: 16,
        padding: "18px 20px",
        marginTop: 24,
        marginBottom: 20,
        boxShadow: "0 4px 16px rgba(80, 70, 40, 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>🎗️</span>
        <h4 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 16, color: "#33422F" }}>
          Apoie a prevenção do Câncer Oral
        </h4>
      </div>
      <p style={{ fontSize: 12.5, color: "#5C6B5F", margin: "0 0 14px", lineHeight: 1.5 }}>
        As doações visam o desenvolvimento de uma tecnologia para auxiliar no <strong>diagnóstico de câncer oral</strong>. Se deseja contribuir com qualquer valor, sua doação faz a diferença!
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justify: "space-between",
          background: "#FFFFFF",
          border: "1px dashed #B98B4E",
          borderRadius: 10,
          padding: "10px 14px",
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "#7A8A7F", display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Chave Pix (CNPJ)
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#33422F" }}>{chavePix}</span>
        </div>
        <button
          type="button"
          className="action-btn"
          onClick={copiarChave}
          style={{
            background: copiado ? "#2E5B37" : "#B98B4E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {copiado ? "✓ Chave Copiada!" : "📋 Copiar Chave Pix"}
        </button>
      </div>
    </div>
  );
}
