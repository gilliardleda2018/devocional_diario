"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AudioPlayer from "@/src/components/AudioPlayer";
import { CHAVE_CONVITE_PENDENTE } from "@/src/lib/constants";
import { registrarEvento } from "@/src/lib/util/eventos";

export default function ConviteConteudo({ codigo, nomeConvidador, textoDoDia, referencia }) {
  const searchParams = useSearchParams();
  const primeiro = (nomeConvidador || "").trim().split(/\s+/)[0];
  const primeiroNome = primeiro ? primeiro.charAt(0).toUpperCase() + primeiro.slice(1) : null;
  const linkCadastro = `/login?modo=cadastro&convite=${encodeURIComponent(codigo)}`;

  useEffect(() => {
    if (!codigo) return;
    try { window.localStorage.setItem(CHAVE_CONVITE_PENDENTE, codigo); } catch {}
    registrarEvento("convite_visita", { codigo, origem: searchParams?.get("o") || null });
  }, [codigo, searchParams]);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <p style={s.marca}>🕊️ Devocional Diário</p>

        <h1 style={s.titulo}>
          {primeiroNome ? (
            <>
              <span style={s.destaque}>{primeiroNome}</span> compartilhou a Palavra de hoje com você
            </>
          ) : (
            "A Palavra de hoje para você"
          )}
        </h1>

        {textoDoDia && (
          <div style={s.pergaminho}>
            <p style={s.versiculo}>&ldquo;{textoDoDia}&rdquo;</p>
            <p style={s.referencia}>— {referencia}</p>
            <AudioPlayer texto={`"${textoDoDia}" — ${referencia}`} rotulo="Ouvir versículo" />
          </div>
        )}

        <div style={s.chamada}>
          <p style={s.chamadaTitulo}>Receba uma Palavra assim todos os dias</p>
          <p style={s.chamadaTexto}>
            Devocional guiado de 5 minutos, com áudio e lembrete no horário que você escolher.
            {primeiroNome ? ` Ao criar a conta, você e ${primeiroNome} já ficam conectados.` : ""}
          </p>
          <a href={linkCadastro} className="action-btn chunky" style={s.botao} onClick={() => registrarEvento("entrada_cadastro_clicado", { local: "convite", codigo })}>
            Criar minha conta grátis
          </a>
          <a href={`/login?convite=${encodeURIComponent(codigo)}`} style={s.linkClaro}>
            Já tenho conta — entrar
          </a>
        </div>

        <a href="/#devocional" style={s.linkSecundario}>Quero fazer o devocional de hoje antes →</a>
      </div>
    </div>
  );
}

const serif = "'Fraunces', serif";

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EAF0EC 0%, #F1EEE3 55%, #F6EFE1 100%)",
    fontFamily: "'Karla', sans-serif",
    color: "#2D3B33",
    padding: "24px 16px 40px",
  },
  container: { maxWidth: 460, margin: "0 auto", textAlign: "center" },
  marca: { fontWeight: 700, fontSize: 15, color: "#33422F", margin: "0 0 22px" },
  titulo: { fontFamily: serif, fontWeight: 500, fontSize: 27, lineHeight: 1.25, color: "#33422F", margin: "0 0 20px" },
  destaque: { color: "#8A6224" },
  pergaminho: {
    background: "linear-gradient(160deg, #F8EFD6 0%, #EFDFAF 100%)",
    border: "1px solid #D9C48A",
    borderRadius: 18,
    padding: "24px 20px",
    boxShadow: "0 8px 22px rgba(139, 108, 46, 0.16)",
    marginBottom: 20,
  },
  versiculo: { fontFamily: serif, fontStyle: "italic", fontSize: 20, lineHeight: 1.55, margin: "0 0 10px" },
  referencia: { fontSize: 14, fontWeight: 700, color: "#8A7455", margin: "0 0 12px" },
  chamada: {
    background: "linear-gradient(135deg, #33422F 0%, #4F6D5C 100%)",
    borderRadius: 18,
    padding: "22px 20px",
    color: "#FFFFFF",
    boxShadow: "0 10px 24px rgba(51, 66, 47, 0.25)",
    marginBottom: 18,
  },
  chamadaTitulo: { fontFamily: serif, fontSize: 21, fontWeight: 500, margin: "0 0 8px" },
  chamadaTexto: { fontSize: 15, lineHeight: 1.5, opacity: 0.92, margin: "0 0 16px" },
  botao: {
    display: "block",
    background: "#D9A94C",
    color: "#2D2410",
    borderRadius: 12,
    borderBottom: "4px solid #A87A22",
    padding: "16px 18px",
    fontWeight: 800,
    fontSize: 17,
  },
  linkClaro: { display: "block", marginTop: 14, fontSize: 15, fontWeight: 700, color: "#EAD9A8" },
  linkSecundario: { display: "inline-block", fontSize: 15, fontWeight: 700, color: "#8A6224", padding: 8 },
};
