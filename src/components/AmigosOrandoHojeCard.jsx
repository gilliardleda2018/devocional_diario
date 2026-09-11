"use client";

import AvatarUsuario from "@/src/components/AvatarUsuario";

/**
 * "Presença ao vivo" ficaria vazia a maior parte do tempo com a base de
 * usuários atual -- em vez disso, mostra quem já orou/fez o devocional HOJE
 * (obter_amigos_orando_hoje), que dá a mesma sensação de comunhão sem
 * depender de todo mundo estar com o app aberto no mesmo minuto.
 */
export default function AmigosOrandoHojeCard({ amigosOrando = [], carregando = false }) {
  if (carregando || amigosOrando.length === 0) return null;

  return (
    <div style={estilos.card}>
      <div style={estilos.header}>
        <span style={estilos.iconeOndas} aria-hidden="true">
          🙏
        </span>
        <div>
          <p style={estilos.titulo}>
            {amigosOrando.length === 1
              ? "1 amigo orou hoje"
              : `${amigosOrando.length} amigos oraram hoje`}
          </p>
          <p style={estilos.subtitulo}>Você não está sozinho nessa caminhada.</p>
        </div>
      </div>

      <div style={estilos.lista} className="no-scrollbar">
        {amigosOrando.map((amigo) => (
          <div key={`${amigo.usuario_id}-${amigo.criado_em}`} style={estilos.item}>
            <AvatarUsuario nome={amigo.nome_exibicao} fotoUrl={amigo.foto_url} tamanho={38} />
            <span style={estilos.nome}>{primeiroNome(amigo.nome_exibicao)}</span>
            {amigo.tema_oracao && <span style={estilos.tema}>{amigo.tema_oracao}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return "Amigo";
  return nomeCompleto.trim().split(" ")[0];
}

const estilos = {
  card: {
    background: "linear-gradient(135deg, #F3F7F4 0%, #E9F1EA 100%)",
    border: "1px solid #D9E7DB",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 20,
    boxShadow: "0 8px 24px rgba(51, 66, 47, 0.05)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconeOndas: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: "1px solid #C9DFCC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
  },
  titulo: { fontSize: 14.5, fontWeight: 800, color: "#33422F", margin: "0 0 2px" },
  subtitulo: { fontSize: 12, color: "#6B7C6E", margin: 0 },
  lista: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: 2,
  },
  item: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    width: 64,
  },
  nome: {
    fontSize: 11,
    fontWeight: 700,
    color: "#33422F",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
  tema: {
    fontSize: 9.5,
    color: "#6B7C6E",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
};
