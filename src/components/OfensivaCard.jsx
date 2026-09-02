"use client";

/**
 * Card de ofensiva (streak) em destaque na tela inicial -- reforça a
 * "chama" da oração diária e cria um empurrãozinho pra não perder a
 * sequência, no mesmo espírito do Duolingo. Reaproveita os dados que já
 * vêm do useOfensiva (não faz nenhuma chamada nova).
 */
export default function OfensivaCard({ ofensiva, jaFezHoje }) {
  const atual = ofensiva?.ofensiva_atual ?? 0;
  const recorde = ofensiva?.maior_ofensiva ?? 0;

  let titulo;
  let mensagem;
  let variante;

  if (jaFezHoje && atual > 0) {
    titulo = `Chama acesa: ${atual} ${atual === 1 ? "dia" : "dias"}!`;
    mensagem = "Você manteve sua ofensiva hoje. Volte amanhã pra continuar a sequência viva.";
    variante = "feito";
  } else if (atual > 0) {
    titulo = `Não deixe sua chama apagar!`;
    mensagem = `Você está com ${atual} ${atual === 1 ? "dia seguido" : "dias seguidos"}. Faça o devocional de hoje pra manter a sequência.`;
    variante = "risco";
  } else {
    titulo = "Comece sua sequência hoje";
    mensagem = "Toda jornada de fé começa com um único dia. Faça seu primeiro devocional e acenda a chama.";
    variante = "inicio";
  }

  return (
    <div style={{ ...estilos.card, ...(variante === "risco" ? estilos.cardRisco : {}) }}>
      <div style={estilos.linha}>
        <span style={{ ...estilos.chamaWrap, ...(variante === "inicio" ? estilos.chamaApagada : {}) }}>
          <span className={variante === "risco" || variante === "feito" ? "flame-icon" : undefined} aria-hidden="true">
            🔥
          </span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={estilos.titulo}>{titulo}</p>
          <p style={estilos.mensagem}>{mensagem}</p>
          {recorde > 0 && <p style={estilos.recorde}>Seu recorde: {recorde} {recorde === 1 ? "dia" : "dias"}</p>}
        </div>
      </div>
    </div>
  );
}

const estilos = {
  card: {
    background: "linear-gradient(135deg, #FBF9F3 0%, #F5EEDC 100%)",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "18px 20px",
    marginBottom: 20,
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
  },
  cardRisco: {
    background: "linear-gradient(135deg, #FFF4EC 0%, #FCE3CE 100%)",
    border: "1px solid #F0C79B",
    boxShadow: "0 8px 24px rgba(217, 122, 42, 0.12)",
  },
  linha: { display: "flex", alignItems: "center", gap: 14 },
  chamaWrap: {
    flexShrink: 0,
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: "1px solid #F0DFAF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },
  chamaApagada: { filter: "grayscale(1)", opacity: 0.5 },
  titulo: { fontSize: 15, fontWeight: 800, color: "#33422F", margin: "0 0 2px" },
  mensagem: { fontSize: 12.5, color: "#5C6B5F", margin: 0, lineHeight: 1.4 },
  recorde: { fontSize: 11, color: "#9AA79C", fontWeight: 600, margin: "4px 0 0" },
};
