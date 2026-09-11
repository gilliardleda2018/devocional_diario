"use client";

import { useEffect, useState } from "react";
import { subscribeToast } from "@/src/lib/ui/toast";

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToast(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div style={styles.wrap}>
      {toasts.map((t) => (
        <div key={t.id} style={t.tipo === "sucesso" ? styles.toastSucesso : styles.toastErro}>
          {t.mensagem}
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
    padding: "0 16px",
    pointerEvents: "none",
    boxSizing: "border-box",
  },
  toastErro: {
    background: "#B15A4A",
    color: "#FFFFFF",
    padding: "11px 18px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    textAlign: "center",
    pointerEvents: "auto",
  },
  toastSucesso: {
    background: "#3F7A4D",
    color: "#FFFFFF",
    padding: "11px 18px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    textAlign: "center",
    pointerEvents: "auto",
  },
};
