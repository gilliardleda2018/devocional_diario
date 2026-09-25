"use client";

import { useEffect, useState } from "react";
import { gerarCardPalavraDoDia } from "@/src/lib/util/cardCompartilhamento";
import { copiarTextoSeguro } from "@/src/lib/util/copiarSeguro";
import { registrarEvento } from "@/src/lib/util/eventos";

/**
 * Botão "Compartilhar a Palavra de hoje": gera a imagem vertical do
 * versículo (Status/Stories) e abre o menu de compartilhar do celular com
 * a imagem + uma legenda com o link. O link leva o código de convite de
 * quem compartilhou (/convite/CODIGO), que cai direto no cadastro e, depois
 * de criada a conta, conecta os dois como amigos (resgatar_convite).
 *
 * Onde o navegador não compartilha arquivos (computador, alguns navegadores
 * internos), abre uma janela com a imagem e as opções de baixar, mandar no
 * WhatsApp ou copiar o link.
 *
 * `local` diz de onde veio o compartilhamento (hoje, fim_devocional,
 * entrada...) -- vai no link (?o=) e na medição de uso.
 */
export default function CompartilharPalavra({ texto, referencia, rotuloData, codigoConvite, nomeAutor, local, rotulo }) {
  const [gerando, setGerando] = useState(false);
  const [alternativa, setAlternativa] = useState(null); // { urlImagem, blob }
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [origem, setOrigem] = useState("");
  // A imagem é gerada com antecedência: o Safari do iPhone só abre o menu de
  // compartilhar se ele for chamado logo após o toque, sem esperas no meio.
  const [imagemPronta, setImagemPronta] = useState(null);

  useEffect(() => {
    setOrigem(window.location.origin);
  }, []);

  useEffect(() => {
    if (!texto || !referencia) return;
    let vivo = true;
    setImagemPronta(null);
    gerarCardPalavraDoDia({ texto, referencia, rotuloData, nomeAutor, enderecoSite: window.location.host })
      .then((blob) => vivo && blob && setImagemPronta(blob))
      .catch(() => {});
    return () => { vivo = false; };
  }, [texto, referencia, rotuloData, nomeAutor]);

  useEffect(() => {
    return () => {
      if (alternativa?.urlImagem) URL.revokeObjectURL(alternativa.urlImagem);
    };
  }, [alternativa]);

  if (!texto || !referencia) return null;

  const link = codigoConvite
    ? `${origem}/convite/${encodeURIComponent(codigoConvite)}?o=${local}`
    : `${origem}/?o=${local}`;
  const legenda =
    `“${texto}” — ${referencia}\n\n` +
    `🙏 Essa foi a Palavra de hoje no meu devocional. Faça o seu também, leva 5 minutos e é grátis:\n${link}`;
  const nomeArquivo = `palavra-de-hoje-${referencia.replace(/[^\w]+/g, "-").toLowerCase()}.png`;

  async function compartilhar() {
    if (gerando) return;
    setGerando(true);
    try {
      const blob =
        imagemPronta ||
        (await gerarCardPalavraDoDia({ texto, referencia, rotuloData, nomeAutor, enderecoSite: window.location.host }));
      if (!blob) throw new Error("sem imagem");
      const arquivo = new File([blob], nomeArquivo, { type: "image/png" });

      if (navigator.canShare?.({ files: [arquivo] })) {
        try {
          await navigator.share({ files: [arquivo], text: legenda });
          registrarEvento("compartilhou", { local, metodo: "nativo" });
        } catch (e) {
          // Cancelar o menu de compartilhar não é erro.
          if (e?.name !== "AbortError") setAlternativa({ urlImagem: URL.createObjectURL(blob), blob });
        }
      } else {
        setAlternativa({ urlImagem: URL.createObjectURL(blob), blob });
      }
    } catch {
      // Sem imagem (navegador muito antigo): pelo menos o texto com o link.
      window.open(`https://wa.me/?text=${encodeURIComponent(legenda)}`, "_blank", "noopener,noreferrer");
      registrarEvento("compartilhou", { local, metodo: "whatsapp_texto" });
    } finally {
      setGerando(false);
    }
  }

  function baixar() {
    const a = document.createElement("a");
    a.href = alternativa.urlImagem;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    registrarEvento("compartilhou", { local, metodo: "baixou_imagem" });
  }

  async function copiarLink() {
    if (await copiarTextoSeguro(legenda)) {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2200);
      registrarEvento("compartilhou", { local, metodo: "copiou" });
    }
  }

  return (
    <>
      <button type="button" className="action-btn chunky" style={s.botao} onClick={compartilhar} disabled={gerando}>
        {gerando ? "Preparando a imagem..." : rotulo || "📤 Compartilhar a Palavra de hoje"}
      </button>

      {alternativa && (
        <div style={s.fundo} onClick={() => setAlternativa(null)}>
          <div style={s.janela} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Compartilhar a Palavra de hoje">
            <p style={s.titulo}>Compartilhe a Palavra de hoje</p>
            <img src={alternativa.urlImagem} alt={`Imagem com ${referencia}`} style={s.previa} />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(legenda)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...s.opcao, background: "#2E8B45", color: "#FFFFFF", border: "none" }}
              onClick={() => registrarEvento("compartilhou", { local, metodo: "whatsapp" })}
            >
              💬 Enviar no WhatsApp
            </a>
            <button type="button" style={s.opcao} onClick={baixar}>⬇️ Baixar a imagem (para Status e Stories)</button>
            <button type="button" style={s.opcao} onClick={copiarLink}>{linkCopiado ? "✓ Texto e link copiados" : "🔗 Copiar texto e link"}</button>
            <button type="button" style={s.fechar} onClick={() => setAlternativa(null)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  botao: {
    width: "100%",
    background: "linear-gradient(180deg, #3E7A52 0%, #2F6341 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "4px solid #1F4A2E",
    borderRadius: 14,
    padding: "15px 18px",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  },
  fundo: {
    position: "fixed",
    inset: 0,
    background: "rgba(30, 36, 32, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
  },
  janela: {
    background: "#FBF9F3",
    borderRadius: 18,
    padding: 18,
    width: "100%",
    maxWidth: 360,
    maxHeight: "92vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontFamily: "'Karla', sans-serif",
  },
  titulo: { fontFamily: "'Fraunces', serif", fontSize: 20, color: "#33422F", margin: "0 0 4px", textAlign: "center" },
  previa: { width: "100%", maxWidth: 220, alignSelf: "center", borderRadius: 12, boxShadow: "0 6px 18px rgba(80,70,40,0.18)" },
  opcao: {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid #E7E0D0",
    background: "#FFFFFF",
    color: "#33422F",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    textDecoration: "none",
  },
  fechar: { background: "none", border: "none", color: "#7A8A7F", fontSize: 15, padding: 8, cursor: "pointer" },
};
