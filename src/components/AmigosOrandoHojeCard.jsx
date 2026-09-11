"use client";

import AvatarUsuario from "@/src/components/AvatarUsuario";

/**
 * "Presença ao vivo" ficaria vazia a maior parte do tempo com a base de
 * usuários atual -- em vez disso, mostra quem já orou/fez o devocional HOJE
 * (obter_amigos_orando_hoje), que dá a mesma sensação de comunhão sem
 * depender de todo mundo estar com o app aberto no mesmo minuto.
 */
export default function AmigosOrandoHojeCard({ amigosOrando = [], carregando = false, aoTorcer, aoAbrirPerfil }) {
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
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => aoAbrirPerfil?.(amigo.usuario_id)}
                title={amigo.username ? `Ver perfil de @${amigo.username}` : `Ver perfil de ${amigo.nome_exibicao}`}
                style={estilos.avatarBtn}
              >
                <AvatarUsuario nome={amigo.nome_exibicao} fotoUrl={amigo.foto_url} tamanho={38} />
              </button>
              <button
                type="button"
                onClick={() => aoTorcer?.(amigo.usuario_id)}
                disabled={amigo.ja_torci}
                title={amigo.ja_torci ? "Você já torceu hoje" : "Torcer por essa pessoa"}
                style={{
                  ...estilos.botaoTorcer,
                  ...(amigo.ja_torci ? estilos.botaoTorcerFeito : {}),
                }}
              >
                {amigo.ja_torci ? "💪" : "🙌"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => aoAbrirPerfil?.(amigo.usuario_id)}
              style={estilos.nomeBtn}
              title={amigo.username ? `@${amigo.username}` : undefined}
            >
              <span style={estilos.nome}>{primeiroNome(amigo.nome_exibicao)}</span>
            </button>
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
  avatarBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "block",
    borderRadius: "50%",
  },
  nomeBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    width: "100%",
  },
  botaoTorcer: {
    position: "absolute",
    bottom: -4,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: "1px solid #D9E7DB",
    boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  botaoTorcerFeito: {
    background: "#DCEFE0",
    borderColor: "#9CC9A6",
    cursor: "default",
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
