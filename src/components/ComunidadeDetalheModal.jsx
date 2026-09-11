"use client";

import { useEffect, useState } from "react";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import PedidosOracaoTab from "@/src/components/PedidosOracaoTab";
import { rotuloTipoComunidade } from "@/src/lib/hooks/useComunidades";
import { showToast } from "@/src/lib/ui/toast";

export default function ComunidadeDetalheModal({
  comunidade,
  usuarioId,
  souMembro,
  aoFechar,
  aoEntrar,
  aoSair,
  obterMembros,
}) {
  const [aba, setAba] = useState("mural"); // mural, membros
  const [membros, setMembros] = useState([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!comunidade || aba !== "membros" || !souMembro) return;
    let vivo = true;
    (async () => {
      setCarregandoMembros(true);
      const res = await obterMembros(comunidade.id);
      if (vivo) {
        setMembros(res?.membros || []);
        setCarregandoMembros(false);
      }
    })();
    return () => { vivo = false; };
  }, [comunidade, aba, souMembro, obterMembros]);

  if (!comunidade) return null;

  const tipoInfo = rotuloTipoComunidade(comunidade.tipo);

  async function handleEntrar() {
    setProcessando(true);
    const res = await aoEntrar(comunidade.id);
    setProcessando(false);
    if (res?.sucesso === false) {
      showToast(res?.erro || "Não foi possível entrar nessa comunidade.");
    }
  }

  async function handleSair() {
    if (!confirm(`Sair de ${comunidade.nome}?`)) return;
    setProcessando(true);
    const res = await aoSair(comunidade.id);
    setProcessando(false);
    if (res?.sucesso === false) {
      showToast(res?.erro || "Não foi possível sair da comunidade.");
    } else {
      aoFechar();
    }
  }

  return (
    <div style={estilos.overlay} onClick={aoFechar}>
      <div style={estilos.modal} onClick={(e) => e.stopPropagation()}>
        <div style={estilos.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={estilos.iconeGrande}>{tipoInfo.icone}</span>
            <div style={{ minWidth: 0 }}>
              <h3 style={estilos.titulo}>{comunidade.nome}</h3>
              <p style={estilos.metaTexto}>{tipoInfo.label} · {comunidade.total_membros} membro{comunidade.total_membros === 1 ? "" : "s"}</p>
            </div>
          </div>
          <button style={estilos.fechar} onClick={aoFechar}>✕</button>
        </div>

        {comunidade.descricao && <p style={estilos.descricao}>{comunidade.descricao}</p>}

        <div style={estilos.acoesRow}>
          {souMembro ? (
            <button style={estilos.btnSair} disabled={processando} onClick={handleSair}>
              Sair da comunidade
            </button>
          ) : (
            <button style={estilos.btnEntrar} disabled={processando} onClick={handleEntrar}>
              {processando ? "Entrando..." : "➕ Entrar na comunidade"}
            </button>
          )}
        </div>

        {souMembro && (
          <>
            <div style={estilos.tabRow}>
              <button
                style={aba === "mural" ? estilos.tabAtiva : estilos.tabInativa}
                onClick={() => setAba("mural")}
              >
                🙏 Mural
              </button>
              <button
                style={aba === "membros" ? estilos.tabAtiva : estilos.tabInativa}
                onClick={() => setAba("membros")}
              >
                👥 Membros
              </button>
            </div>

            <div style={estilos.conteudo}>
              {aba === "mural" && (
                <PedidosOracaoTab usuarioId={usuarioId} comunidadeId={comunidade.id} comunidadeNome={comunidade.nome} />
              )}

              {aba === "membros" && (
                carregandoMembros ? (
                  <p style={estilos.carregandoTexto}>Carregando membros...</p>
                ) : (
                  <div style={estilos.listaMembros}>
                    {membros.map((m) => (
                      <div key={m.user_id} style={estilos.membroItem}>
                        <AvatarUsuario nome={m.nome_exibicao} fotoUrl={m.foto_url} tamanho={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={estilos.membroNome}>{m.nome_exibicao}</p>
                        </div>
                        {m.papel === "ADMIN" && <span style={estilos.badgeAdmin}>Admin</span>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        )}

        {!souMembro && (
          <p style={estilos.avisoNaoMembro}>Entre na comunidade pra ver o mural de oração e os membros.</p>
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
    zIndex: 9998,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 20,
    maxWidth: 560,
    width: "100%",
    maxHeight: "88vh",
    overflowY: "auto",
    padding: 22,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 10 },
  iconeGrande: { fontSize: 34, flexShrink: 0 },
  titulo: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#33422F", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  metaTexto: { fontSize: 12, color: "#7A8A7F", margin: "2px 0 0" },
  fechar: { background: "transparent", border: "none", fontSize: 18, color: "#7A8A7F", cursor: "pointer", flexShrink: 0 },
  descricao: { fontSize: 13, color: "#4B5563", lineHeight: 1.4, margin: "0 0 14px" },
  acoesRow: { marginBottom: 14 },
  btnEntrar: {
    width: "100%",
    background: "linear-gradient(180deg, #8FCB9A 0%, #4F9463 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #35704A",
    borderRadius: 12,
    padding: "11px",
    fontWeight: 700,
    fontSize: 13.5,
    cursor: "pointer",
  },
  btnSair: {
    width: "100%",
    background: "#FBF9F3",
    color: "#B15A4A",
    border: "1px solid #E7E0D0",
    borderRadius: 12,
    padding: "10px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  tabRow: { display: "flex", gap: 6, background: "#EFEAD9", borderRadius: 10, padding: 3, marginBottom: 14 },
  tabAtiva: { flex: 1, background: "#FFFFFF", color: "#33422F", border: "none", borderRadius: 8, padding: "7px 10px", fontWeight: 700, fontSize: 12.5, cursor: "pointer" },
  tabInativa: { flex: 1, background: "transparent", color: "#8A9184", border: "none", borderRadius: 8, padding: "7px 10px", fontWeight: 600, fontSize: 12.5, cursor: "pointer" },
  conteudo: { marginTop: 4 },
  carregandoTexto: { fontSize: 13, color: "#9AA79C", fontStyle: "italic" },
  listaMembros: { display: "flex", flexDirection: "column", gap: 8 },
  membroItem: { display: "flex", alignItems: "center", gap: 10, background: "#FBF9F3", border: "1px solid #E7E0D0", borderRadius: 12, padding: "8px 12px" },
  membroNome: { fontSize: 13, fontWeight: 700, color: "#33422F", margin: 0 },
  badgeAdmin: { fontSize: 10.5, fontWeight: 700, color: "#8A6224", background: "#F1E2C4", borderRadius: 999, padding: "3px 8px" },
  avisoNaoMembro: { fontSize: 12.5, color: "#7A8A7F", fontStyle: "italic", textAlign: "center", margin: "8px 0 0" },
};
