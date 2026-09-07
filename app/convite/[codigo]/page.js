"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

const CHAVE_CONVITE_PENDENTE = "codigo_convite_pendente";

/**
 * Página pública de convite (/convite/SEUCODIGO). Quem clica aqui pode
 * nem estar logado ainda -- por isso usa a RPC pública obter_convite_info
 * em vez de consultar `profiles` direto (que exige autenticação).
 *
 * O código do convite é salvo no localStorage e só é de fato usado depois
 * que a pessoa cria a conta e cai autenticada em DevocionalApp.jsx, que
 * lê essa chave e envia o pedido de amizade automaticamente.
 */
export default function PaginaConvite({ params }) {
  const router = useRouter();
  const codigo = decodeURIComponent(params.codigo || "").trim();
  const [convidador, setConvidador] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (codigo && typeof window !== "undefined") {
      window.localStorage.setItem(CHAVE_CONVITE_PENDENTE, codigo);
    }
  }, [codigo]);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (!codigo) {
        setCarregando(false);
        return;
      }
      try {
        const supabase = criarClienteSupabase();
        const { data } = await supabase.rpc("obter_convite_info", { p_codigo: codigo });
        if (vivo && Array.isArray(data) && data.length > 0) {
          setConvidador(data[0]);
        }
      } catch (e) {
        // Sem problema -- mostramos uma versão genérica do convite abaixo.
      } finally {
        if (vivo) setCarregando(false);
      }
    }
    carregar();
    return () => {
      vivo = false;
    };
  }, [codigo]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.glowIcon}>🕊️</div>
        <h1 style={styles.title}>Devocional Diário</h1>

        {carregando ? (
          <p style={styles.subtitle}>Carregando convite...</p>
        ) : convidador ? (
          <p style={styles.subtitle}>
            <strong>{convidador.nome_exibicao || "Um amigo"}</strong> te convidou para se
            conectar no Devocional Diário — um versículo por dia e devocional guiado
            para o seu momento.
          </p>
        ) : (
          <p style={styles.subtitle}>
            Você recebeu um convite para o Devocional Diário — um versículo por dia e
            devocional guiado para o seu momento.
          </p>
        )}

        <button
          className="action-btn"
          style={styles.primaryBtn}
          onClick={() => router.push("/login?modo=cadastro")}
        >
          Criar minha conta ✨
        </button>
        <button style={styles.linkBtn} onClick={() => router.push("/login")}>
          Já tenho conta — Entrar
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EAF0EC 0%, #F1EEE3 55%, #F6EFE1 100%)",
    fontFamily: "'Karla', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  card: {
    maxWidth: 380,
    width: "100%",
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "28px 24px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
  },
  glowIcon: { fontSize: 40, marginBottom: 10 },
  title: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 24,
    margin: "0 0 12px",
    color: "#33422F",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#5C7060",
    margin: "0 0 22px",
  },
  primaryBtn: {
    width: "100%",
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 10,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#5C7060",
    fontSize: 12.5,
    textDecoration: "underline",
    cursor: "pointer",
  },
};
