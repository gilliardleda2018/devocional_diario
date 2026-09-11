"use client";

import { useEffect, useState } from "react";
import { useComunidades, rotuloTipoComunidade } from "@/src/lib/hooks/useComunidades";
import CriarComunidadeModal from "@/src/components/CriarComunidadeModal";
import ComunidadeDetalheModal from "@/src/components/ComunidadeDetalheModal";
import { showToast } from "@/src/lib/ui/toast";

export default function ComunidadesTab({ usuarioId }) {
  const {
    minhasComunidades,
    carregando,
    buscarPublicas,
    obterMembros,
    criarComunidade,
    entrarComunidade,
    sairComunidade,
  } = useComunidades(usuarioId);

  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [comunidadeSelecionada, setComunidadeSelecionada] = useState(null);
  const [buscaTermo, setBuscaTermo] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [entrandoEm, setEntrandoEm] = useState({});

  useEffect(() => {
    let vivo = true;
    setBuscando(true);
    const timer = setTimeout(async () => {
      const res = await buscarPublicas(buscaTermo.trim());
      if (vivo) {
        setResultadosBusca(res);
        setBuscando(false);
      }
    }, 250);
    return () => { vivo = false; clearTimeout(timer); };
  }, [buscaTermo, buscarPublicas, minhasComunidades]);

  const idsMinhasComunidades = new Set(minhasComunidades.map((c) => c.id));

  async function handleEntrarRapido(comunidadeId) {
    setEntrandoEm((prev) => ({ ...prev, [comunidadeId]: true }));
    const res = await entrarComunidade(comunidadeId);
    if (res?.sucesso === false) {
      showToast(res?.erro || "Não foi possível entrar nessa comunidade.");
      setEntrandoEm((prev) => ({ ...prev, [comunidadeId]: false }));
    }
  }

  return (
    <div style={estilos.container}>
      <div style={estilos.header}>
        <div>
          <h2 style={estilos.titulo}>Comunidades</h2>
          <p style={estilos.subtitulo}>Grupos de fé com mural de oração próprio — sua igreja, seu estudo bíblico, sua família.</p>
        </div>
        <button className="action-btn chunky" style={estilos.btnCriar} onClick={() => setModalCriarAberto(true)}>
          ➕ Criar
        </button>
      </div>

      {/* Minhas Comunidades */}
      <div style={estilos.secao}>
        <h3 style={estilos.secaoTitulo}>Minhas Comunidades ({minhasComunidades.length})</h3>
        {carregando ? (
          <p style={estilos.carregandoTexto}>Carregando...</p>
        ) : minhasComunidades.length === 0 ? (
          <div style={estilos.emptyCard}>
            <p style={estilos.emptyTitulo}>Você ainda não participa de nenhuma comunidade.</p>
            <p style={estilos.emptyDesc}>Crie a sua ou entre em uma pública na busca abaixo.</p>
          </div>
        ) : (
          <div style={estilos.lista}>
            {minhasComunidades.map((c) => {
              const tipoInfo = rotuloTipoComunidade(c.tipo);
              return (
                <button
                  key={c.id}
                  style={estilos.cardComunidade}
                  onClick={() => setComunidadeSelecionada(c)}
                >
                  <span style={estilos.iconeComunidade}>{tipoInfo.icone}</span>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <p style={estilos.nomeComunidade}>{c.nome}</p>
                    <p style={estilos.metaComunidade}>{tipoInfo.label} · {c.total_membros} membro{c.total_membros === 1 ? "" : "s"}</p>
                  </div>
                  {c.meu_papel === "ADMIN" && <span style={estilos.badgeAdmin}>Admin</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Descobrir Comunidades */}
      <div style={estilos.secao}>
        <h3 style={estilos.secaoTitulo}>Descobrir Comunidades</h3>
        <input
          type="text"
          placeholder="Buscar comunidades públicas..."
          value={buscaTermo}
          onChange={(e) => setBuscaTermo(e.target.value)}
          style={estilos.inputBusca}
        />

        {buscando ? (
          <p style={estilos.carregandoTexto}>Buscando...</p>
        ) : resultadosBusca.length === 0 ? (
          <div style={estilos.emptyCard}>
            <p style={estilos.emptyTitulo}>Nenhuma comunidade encontrada.</p>
            <p style={estilos.emptyDesc}>Que tal criar a primeira?</p>
          </div>
        ) : (
          <div style={estilos.lista}>
            {resultadosBusca.map((c) => {
              const tipoInfo = rotuloTipoComunidade(c.tipo);
              const jaSouMembro = c.ja_sou_membro || idsMinhasComunidades.has(c.id);
              return (
                <div key={c.id} style={estilos.cardComunidade}>
                  <button
                    style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                    onClick={() => setComunidadeSelecionada(c)}
                  >
                    <span style={estilos.iconeComunidade}>{tipoInfo.icone}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={estilos.nomeComunidade}>{c.nome}</p>
                      <p style={estilos.metaComunidade}>{tipoInfo.label} · {c.total_membros} membro{c.total_membros === 1 ? "" : "s"}</p>
                    </div>
                  </button>
                  {jaSouMembro ? (
                    <span style={estilos.badgeMembro}>✓ Membro</span>
                  ) : (
                    <button
                      style={estilos.btnEntrarRapido}
                      disabled={!!entrandoEm[c.id]}
                      onClick={() => handleEntrarRapido(c.id)}
                    >
                      {entrandoEm[c.id] ? "..." : "Entrar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CriarComunidadeModal
        aberto={modalCriarAberto}
        aoFechar={() => setModalCriarAberto(false)}
        aoCriar={criarComunidade}
      />

      <ComunidadeDetalheModal
        comunidade={comunidadeSelecionada}
        usuarioId={usuarioId}
        souMembro={comunidadeSelecionada ? idsMinhasComunidades.has(comunidadeSelecionada.id) : false}
        aoFechar={() => setComunidadeSelecionada(null)}
        aoEntrar={entrarComunidade}
        aoSair={sairComunidade}
        obterMembros={obterMembros}
      />
    </div>
  );
}

const estilos = {
  container: { padding: "4px 0" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  titulo: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: "#33422F", margin: 0 },
  subtitulo: { fontSize: 12.5, color: "#6B7C70", margin: "4px 0 0", maxWidth: 320, lineHeight: 1.4 },
  btnCriar: {
    flexShrink: 0,
    background: "linear-gradient(180deg, #C89A5E 0%, #B98B4E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #8A6224",
    borderRadius: 12,
    padding: "9px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  secao: { marginBottom: 24 },
  secaoTitulo: { fontFamily: "'Fraunces', serif", fontSize: 15.5, fontWeight: 600, color: "#33422F", margin: "0 0 10px" },
  carregandoTexto: { fontSize: 13, color: "#9AA79C", fontStyle: "italic" },
  emptyCard: { background: "#FBF9F3", border: "1px dashed #D8CFB8", borderRadius: 14, padding: "20px 16px", textAlign: "center" },
  emptyTitulo: { fontSize: 13.5, fontWeight: 700, color: "#33422F", margin: "0 0 4px" },
  emptyDesc: { fontSize: 12, color: "#7A8A7F", margin: 0 },
  lista: { display: "flex", flexDirection: "column", gap: 8 },
  inputBusca: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    fontSize: 13.5,
    color: "#33422F",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 10,
  },
  cardComunidade: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: "12px 14px",
    width: "100%",
    cursor: "pointer",
  },
  iconeComunidade: { fontSize: 26, flexShrink: 0 },
  nomeComunidade: { fontSize: 13.5, fontWeight: 700, color: "#33422F", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  metaComunidade: { fontSize: 11.5, color: "#7A8A7F", margin: "2px 0 0" },
  badgeAdmin: { fontSize: 10.5, fontWeight: 700, color: "#8A6224", background: "#F1E2C4", borderRadius: 999, padding: "3px 8px", flexShrink: 0 },
  badgeMembro: { fontSize: 11, fontWeight: 700, color: "#3F7A4D", background: "#EAF4EC", borderRadius: 999, padding: "4px 10px", flexShrink: 0, whiteSpace: "nowrap" },
  btnEntrarRapido: {
    flexShrink: 0,
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
};
