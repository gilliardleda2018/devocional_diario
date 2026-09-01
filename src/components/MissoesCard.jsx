"use client";

/**
 * Painel de Missões, estilo quest de jogo: metas curtas (diárias e
 * semanais) que dão um objetivo claro pra abrir o app hoje, além do
 * devocional em si. Ver src/lib/devocional/missoes.js pra como o
 * progresso de cada uma é calculado.
 */
export default function MissoesCard({ missoes }) {
  return (
    <div style={estilos.card}>
      <p style={estilos.titulo}>Missões</p>
      <p style={estilos.subtitulo}>Cumpra os desafios de hoje e da semana, como nas fases de um jogo.</p>
      <div style={estilos.lista}>
        {missoes.map((m) => {
          const concluida = m.atual >= m.meta;
          const progresso = Math.max(0, Math.min(1, m.atual / m.meta));
          return (
            <div key={m.id} style={estilos.item}>
              <div style={{ ...estilos.icone, ...(concluida ? estilos.iconeConcluido : {}) }}>
                {concluida ? "✓" : m.icone}
              </div>
              <div style={estilos.corpo}>
                <div style={estilos.linhaTitulo}>
                  <span style={estilos.itemTitulo}>{m.titulo}</span>
                  <span style={{ ...estilos.tag, ...(m.tipo === "diaria" ? estilos.tagDiaria : estilos.tagSemanal) }}>
                    {m.tipo === "diaria" ? "Hoje" : "Semana"}
                  </span>
                </div>
                <p style={estilos.descricao}>{m.descricao}</p>
                <div style={estilos.barraFundo}>
                  <div
                    style={{
                      ...estilos.barraProgresso,
                      width: `${progresso * 100}%`,
                      background: concluida
                        ? "linear-gradient(90deg, #7FB88A, #4F9463)"
                        : "linear-gradient(90deg, #D9A94C, #B98B4E)",
                    }}
                  />
                </div>
              </div>
              <span style={estilos.fracao}>
                {m.atual}/{m.meta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const estilos = {
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "20px 20px 22px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
    marginBottom: 20,
  },
  titulo: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 19,
    margin: "0 0 4px",
    color: "#33422F",
  },
  subtitulo: { fontSize: 12.5, color: "#7A8A7F", margin: "0 0 16px" },
  lista: { display: "flex", flexDirection: "column", gap: 14 },
  item: { display: "flex", alignItems: "center", gap: 12 },
  icone: {
    flexShrink: 0,
    width: 38,
    height: 38,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderBottom: "3px solid #D8CFB8",
  },
  iconeConcluido: {
    background: "linear-gradient(180deg, #8FCB9A 0%, #4F9463 100%)",
    color: "#FFFFFF",
    border: "none",
    borderBottom: "3px solid #35704A",
  },
  corpo: { flex: 1, minWidth: 0 },
  linhaTitulo: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemTitulo: { fontSize: 13.5, fontWeight: 700, color: "#33422F" },
  tag: {
    flexShrink: 0,
    fontSize: 9.5,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    borderRadius: 999,
    padding: "2px 8px",
  },
  tagDiaria: { background: "#F1E2C4", color: "#8A6224" },
  tagSemanal: { background: "#DDE8DE", color: "#3F5642" },
  descricao: { fontSize: 11.5, color: "#7A8A7F", margin: "2px 0 6px" },
  barraFundo: { height: 7, borderRadius: 999, background: "#EFEAD9", overflow: "hidden" },
  barraProgresso: { height: "100%", borderRadius: 999, transition: "width 0.4s ease" },
  fracao: { flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: "#9AA79C", minWidth: 28, textAlign: "right" },
};
