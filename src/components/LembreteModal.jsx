"use client";

import { useState, useEffect } from "react";
import {
  obterConfigLembrete,
  salvarConfigLembrete,
  solicitarPermissaoNotificacao,
  dispararNotificacaoTeste,
} from "@/src/lib/notifications/lembretes";

export default function LembreteModal({ aberto, aoFechar }) {
  const [ativo, setAtivo] = useState(false);
  const [horario, setHorario] = useState("07:00");
  const [mensagemStatus, setMensagemStatus] = useState("");

  useEffect(() => {
    if (aberto) {
      const config = obterConfigLembrete();
      setAtivo(config.ativo);
      setHorario(config.horario || "07:00");
      setMensagemStatus("");
    }
  }, [aberto]);

  if (!aberto) return null;

  async function handleSalvar() {
    if (ativo) {
      const concedido = await solicitarPermissaoNotificacao();
      if (!concedido) {
        setMensagemStatus("⚠️ Permissão de notificação negada pelo navegador/celular.");
        return;
      }
    }
    salvarConfigLembrete({ ativo, horario });
    setMensagemStatus("✅ Lembrete salvo com sucesso!");
    setTimeout(() => {
      aoFechar();
    }, 1000);
  }

  async function handleTestar() {
    const concedido = await solicitarPermissaoNotificacao();
    if (concedido) {
      dispararNotificacaoTeste();
      setMensagemStatus("🔔 Notificação de teste enviada!");
    } else {
      setMensagemStatus("⚠️ Permissão de notificação negada.");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#FBF9F3",
          border: "1px solid #E7E0D0",
          borderRadius: 18,
          maxWidth: 400,
          width: "100%",
          padding: "24px 22px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, color: "#33422F" }}>
            🔔 Lembrete Diário
          </h3>
          <button
            onClick={aoFechar}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#7A8A7F",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13.5, color: "#5C6B60", margin: "0 0 20px", lineHeight: 1.5 }}>
          Defina um horário diário para receber um lembrete no seu dispositivo e não perder sua sequência de devocionais (ofensiva 🔥)!
        </p>

        <div style={{ background: "#FFFFFF", border: "1px solid #E7E0D0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#33422F" }}>Ativar lembrete</span>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: "#B98B4E", cursor: "pointer" }}
            />
          </div>

          {ativo && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #F0EA99" }}>
              <span style={{ fontSize: 13, color: "#5C6B60" }}>Horário do lembrete:</span>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #E7E0D0",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#33422F",
                }}
              />
            </div>
          )}
        </div>

        {mensagemStatus && (
          <p style={{ fontSize: 12.5, textAlign: "center", color: mensagemStatus.startsWith("⚠️") ? "#B15A4A" : "#3F7550", margin: "0 0 16px" }}>
            {mensagemStatus}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="action-btn"
            onClick={handleTestar}
            style={{
              flex: 1,
              background: "#EBE5D8",
              border: "1px solid #D8CEBB",
              borderRadius: 10,
              padding: "10px",
              fontWeight: 700,
              fontSize: 13,
              color: "#5C4A30",
              cursor: "pointer",
            }}
          >
            Testar
          </button>
          <button
            className="action-btn"
            onClick={handleSalvar}
            style={{
              flex: 2,
              background: "#B98B4E",
              border: "none",
              borderRadius: 10,
              padding: "10px",
              fontWeight: 700,
              fontSize: 13,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Salvar Lembrete
          </button>
        </div>
      </div>
    </div>
  );
}
