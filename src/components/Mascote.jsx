"use client";

/**
 * Mascote reativo (a pombinha do topo) -- estilo Duolingo: reage ao
 * estado do usuário em vez de ficar sempre igual.
 *
 *   - "feliz": acabou de concluir o devocional de hoje
 *   - "triste": tinha ofensiva antes mas ela zerou (perdeu um dia)
 *   - "neutro": estado padrão, ainda não fez o devocional hoje
 */
export default function Mascote({ estado = "neutro" }) {
  const conteudo = {
    feliz: { emoji: "🕊️", legenda: "Muito bem! Volte amanhã.", classe: "mascote-feliz" },
    triste: { emoji: "🕊️", legenda: "Sua ofensiva zerou — bora recomeçar?", classe: "mascote-triste" },
    neutro: { emoji: "🕊️", legenda: null, classe: "mascote-neutro" },
  }[estado];

  return (
    <div style={{ textAlign: "center" }}>
      <style>{`
        .mascote-wrap { position: relative; width: 64px; height: 64px; margin: 0 auto 10px; }
        .mascote-glow {
          position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle, rgba(185,139,78,0.35) 0%, rgba(185,139,78,0) 70%);
        }
        .mascote-icon {
          position: relative; width: 64px; height: 64px;
          display: flex; align-items: center; justify-content: center; font-size: 26px;
        }
        .mascote-neutro .mascote-glow { animation: breathe 5s ease-in-out infinite; }
        .mascote-feliz .mascote-icon { animation: pulo 0.6s ease-in-out 2; }
        .mascote-feliz .mascote-glow {
          background: radial-gradient(circle, rgba(217,169,76,0.55) 0%, rgba(217,169,76,0) 70%);
          animation: breathe 2s ease-in-out infinite;
        }
        .mascote-triste .mascote-icon { filter: grayscale(0.5); opacity: 0.75; }
        .mascote-triste .mascote-glow { opacity: 0.35; }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.12); opacity: 0.9; }
        }
        @keyframes pulo {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mascote-icon, .mascote-glow { animation: none !important; }
        }
      `}</style>
      <div className={`mascote-wrap ${conteudo.classe}`}>
        <div className="mascote-glow" />
        <div className="mascote-icon">{conteudo.emoji}</div>
      </div>
      {conteudo.legenda && (
        <p style={{ fontSize: 12.5, color: "#7A8A7F", fontWeight: 600, margin: "0 0 6px" }}>{conteudo.legenda}</p>
      )}
    </div>
  );
}
