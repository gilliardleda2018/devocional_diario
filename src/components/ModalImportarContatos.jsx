"use client";

import { useState, useEffect } from "react";
import { copiarTextoSeguro } from "@/src/lib/util/copiarSeguro";

export default function ModalImportarContatos({ aberto, aoFechar, meuCodigo }) {
  const [temContactPicker, setTemContactPicker] = useState(false);
  const [contatosImportados, setContatosImportados] = useState([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [buscaContato, setBuscaContato] = useState("");
  const [numeroManual, setNumeroManual] = useState("");
  const [nomeManual, setNomeManual] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  const [urlApp, setUrlApp] = useState("https://main.d357ab4gel6chc.amplifyapp.com");
  const mensagemPadrao = `Olá! Estou usando o aplicativo Devocional Diário para minhas leituras e orações bíblicas. Venha se conectar comigo e acompanhar devocionais juntos! 📖✨\n\nAcesse aqui: ${urlApp}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlApp(window.location.origin);
    }
    if (typeof navigator !== "undefined" && "contacts" in navigator && "select" in navigator.contacts) {
      setTemContactPicker(true);
    }
  }, []);

  if (!aberto) return null;

  // Função para abrir o Contact Picker nativo do celular
  async function abrirContactPickerNativo() {
    setErroMsg("");
    setCarregandoContatos(true);
    try {
      if (typeof navigator !== "undefined" && "contacts" in navigator && "select" in navigator.contacts) {
        const props = ["name", "tel", "email"];
        const opts = { multiple: true };
        const selecionados = await navigator.contacts.select(props, opts);
        
        if (Array.isArray(selecionados) && selecionados.length > 0) {
          const formatados = selecionados.map((c, idx) => ({
            id: `contact-${idx}-${Date.now()}`,
            nome: (c.name && c.name[0]) || "Contato sem Nome",
            tel: (c.tel && c.tel[0]) || "",
            email: (c.email && c.email[0]) || "",
          }));
          setContatosImportados(formatados);
        }
      } else {
        setErroMsg("O acesso direto à lista de contatos nativa não está disponível neste navegador/dispositivo. Use o formulário de convite manual abaixo!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.warn("[ContactPicker] Erro ao selecionar contatos:", err);
        setErroMsg("Não foi possível acessar a agenda de contatos. Tente usar o formulário manual.");
      }
    } finally {
      setCarregandoContatos(false);
    }
  }

  // Limpa caracteres não numéricos do telefone
  function limparTelefone(tel) {
    if (!tel) return "";
    let limpo = tel.replace(/\D/g, "");
    if (limpo.length === 10 || limpo.length === 11) {
      limpo = `55${limpo}`; // adiciona DDI Brasil se ausente
    }
    return limpo;
  }

  function convidarWhatsApp(tel, nome) {
    const numLimpo = limparTelefone(tel || numeroManual);
    const saudacao = nome ? `Olá, ${nome}! ` : "";
    const texto = `${saudacao}${mensagemPadrao}`;
    const url = numLimpo
      ? `https://wa.me/${numLimpo}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function convidarInstagram() {
    await copiarTextoSeguro(mensagemPadrao);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
    if (typeof window !== "undefined") {
      window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener,noreferrer");
    }
  }

  async function compartilharNativo() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Devocional Diário",
          text: mensagemPadrao,
          url: urlApp,
        });
        return;
      } catch {
        // Usuário cancelou o compartilhamento
      }
    }
    const ok = await copiarTextoSeguro(mensagemPadrao);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  }

  const contatosFiltrados = contatosImportados.filter((c) =>
    c.nome?.toLowerCase().includes(buscaContato.toLowerCase()) ||
    c.tel?.includes(buscaContato)
  );

  return (
    <div style={styles.overlay} onClick={aoFechar}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div style={styles.header}>
          <h2 style={styles.titulo}>📲 Importar e Conectar Contatos</h2>
          <button onClick={aoFechar} style={styles.closeBtn} title="Fechar modal">✕</button>
        </div>

        <div style={styles.body}>
          {/* Subtítulo informativo */}
          <p style={styles.subtitulo}>
            Convide seus contatos do <strong>WhatsApp</strong> e <strong>Instagram</strong> para caminhar com você em devocionais diários, oração e conquistas!
          </p>

          {/* Botão de Contact Picker Nativo se disponível */}
          <div style={styles.secaoPicker}>
            <button
              onClick={abrirContactPickerNativo}
              disabled={carregandoContatos}
              style={temContactPicker ? styles.btnNativoDestaque : styles.btnNativo}
            >
              {carregandoContatos
                ? "⏳ Carregando agenda..."
                : temContactPicker
                ? "📇 Selecionar Contatos do Aparelho"
                : "📱 Selecionar da Agenda Nativa"}
            </button>
            {!temContactPicker && (
              <span style={styles.dicaSemNativo}>
                💡 (Contact Picker API disponível em smartphones Android/iOS no Chrome/Safari)
              </span>
            )}
          </div>

          {erroMsg && <div style={styles.boxErro}>{erroMsg}</div>}

          {/* Se a lista de contatos nativa foi carregada */}
          {contatosImportados.length > 0 && (
            <div style={styles.listaBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h4 style={styles.secaoTitulo}>Contatos Encontrados ({contatosImportados.length})</h4>
                <input
                  type="text"
                  placeholder="Filtrar por nome ou telefone..."
                  value={buscaContato}
                  onChange={(e) => setBuscaContato(e.target.value)}
                  style={styles.inputFiltro}
                />
              </div>

              <div style={styles.scrollLista}>
                {contatosFiltrados.map((c) => (
                  <div key={c.id} style={styles.contatoItem}>
                    <div>
                      <strong style={{ fontSize: 13, color: "#33422F", display: "block" }}>{c.nome}</strong>
                      <span style={{ fontSize: 11, color: "#6A7B6E" }}>{c.tel || c.email || "Sem telefone registrado"}</span>
                    </div>
                    <button
                      onClick={() => convidarWhatsApp(c.tel, c.nome)}
                      style={styles.btnWhatsappItem}
                    >
                      💬 Convidar no WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de Envio Direto (WhatsApp / Instagram) */}
          <div style={styles.cardManual}>
            <h4 style={styles.secaoTitulo}>⚡ Convite Instantâneo por Telefone ou Nome</h4>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Nome do contato (opcional)"
                value={nomeManual}
                onChange={(e) => setNomeManual(e.target.value)}
                style={styles.inputManual}
              />
              <input
                type="tel"
                placeholder="DDD + Telefone (ex: 11999998888)"
                value={numeroManual}
                onChange={(e) => setNumeroManual(e.target.value)}
                style={styles.inputManual}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => convidarWhatsApp(numeroManual, nomeManual)}
                style={styles.btnWhatsappDirect}
              >
                💬 Abrir no WhatsApp
              </button>

              <button
                onClick={convidarInstagram}
                style={styles.btnInstagramDirect}
              >
                📷 Direct do Instagram
              </button>

              <button
                onClick={compartilharNativo}
                style={styles.btnCompartilharDirect}
              >
                🔗 Compartilhar Geral
              </button>
            </div>
          </div>

          {copiado && (
            <p style={styles.feedbackSucesso}>
              ✨ Convite copiado com sucesso para a área de transferência!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 540,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #E7E0D0",
  },
  titulo: {
    margin: 0,
    fontSize: 18,
    fontFamily: "'Fraunces', serif",
    color: "#33422F",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#7A8A7F",
  },
  body: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  subtitulo: {
    margin: 0,
    fontSize: 13,
    color: "#5C6B5F",
    lineHeight: 1.5,
  },
  secaoPicker: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  btnNativoDestaque: {
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
  },
  btnNativo: {
    background: "#33422F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  dicaSemNativo: {
    fontSize: 11,
    color: "#8A9A8D",
    fontStyle: "italic",
  },
  boxErro: {
    background: "#FFF2F2",
    border: "1px solid #FFCACC",
    color: "#D32F2F",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
  },
  listaBox: {
    background: "#FAF7F0",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: 12,
  },
  secaoTitulo: {
    margin: 0,
    fontSize: 13.5,
    fontWeight: 700,
    color: "#33422F",
  },
  inputFiltro: {
    padding: "4px 8px",
    fontSize: 11.5,
    borderRadius: 6,
    border: "1px solid #D8CFB8",
  },
  scrollLista: {
    maxHeight: 180,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  contatoItem: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 10,
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btnWhatsappItem: {
    background: "#25D366",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  cardManual: {
    background: "#F5EFE3",
    border: "1px solid #E7E0D0",
    borderRadius: 14,
    padding: 14,
  },
  inputManual: {
    flex: 1,
    minWidth: 140,
    padding: "8px 12px",
    fontSize: 12.5,
    borderRadius: 8,
    border: "1px solid #D8CFB8",
  },
  btnWhatsappDirect: {
    background: "#25D366",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnInstagramDirect: {
    background: "linear-gradient(45deg, #F9CE34, #EE2A7B 55%, #6228D7)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnCompartilharDirect: {
    background: "#B98B4E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  feedbackSucesso: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: "#2E5B37",
    textAlign: "center",
  },
};
