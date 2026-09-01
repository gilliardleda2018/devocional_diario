"use client";

/**
 * Trilha de fases estilo Duolingo: uma sequência de "estações"
 * conectadas por um caminho, cada uma podendo estar:
 *   - "completo"  -> já concluída (medalha dourada com ✓)
 *   - "atual"     -> a fase em que o usuário está agora (maior, pulsando)
 *   - "bloqueado" -> ainda não liberada (cinza, com cadeado)
 *
 * orientation="horizontal" -> mini trilha usada dentro do devocional do
 * dia (Ler → Refletir → Orar).
 * orientation="vertical"   -> trilha serpenteada usada na Jornada de
 * níveis (aba Progresso), como um mapa de fases de jogo.
 */
export default function TrilhaFases({ fases, orientation = "vertical" }) {
  return orientation === "horizontal" ? <TrilhaHorizontal fases={fases} /> : <TrilhaVertical fases={fases} />;
}

function Selo({ fase, tamanho }) {
  const conteudo = fase.status === "completo" ? "✓" : fase.status === "bloqueado" ? "🔒" : fase.icone ?? "★";
  const classe =
    fase.status === "atual" ? "no-atual" : fase.status === "completo" ? "no-completo" : "no-bloqueado";
  return (
    <div
      className={`trilha-no ${classe}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.4 }}
      title={fase.descricao || fase.label}
    >
      {conteudo}
    </div>
  );
}

function TrilhaHorizontal({ fases }) {
  return (
    <div style={estilos.hWrap}>
      <style>{estiloGlobal}</style>
      {fases.map((f, i) => (
        <div key={f.id} style={estilos.hItem}>
          <div style={estilos.hNodeCol}>
            <Selo fase={f} tamanho={40} />
            <span style={{ ...estilos.hLabel, color: f.status === "bloqueado" ? "#B7BEB2" : "#4F6D5C" }}>
              {f.label}
            </span>
          </div>
          {i < fases.length - 1 && (
            <div
              style={{
                ...estilos.hLinha,
                background: f.status === "completo" ? "#D9A94C" : "#E7E0D0",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function TrilhaVertical({ fases }) {
  const GAP_Y = 92;
  const AMPLITUDE = 62;
  const LARGURA = 240;
  const TOPO = 44;
  const centroX = LARGURA / 2;

  const pontos = fases.map((_, i) => ({
    x: centroX + Math.sin(((i % 4) * Math.PI) / 2) * AMPLITUDE,
    y: TOPO + i * GAP_Y,
  }));

  const altura = TOPO + Math.max(0, fases.length - 1) * GAP_Y + 44;
  const linhaPontos = pontos.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ ...estilos.vWrap, width: LARGURA, height: altura }}>
      <style>{estiloGlobal}</style>
      <svg width={LARGURA} height={altura} style={{ position: "absolute", top: 0, left: 0 }}>
        <polyline
          points={linhaPontos}
          fill="none"
          stroke="#E7E0D0"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 14"
        />
      </svg>
      {fases.map((f, i) => {
        const p = pontos[i];
        const tamanho = f.status === "atual" ? 62 : 52;
        const labelEsquerda = p.x >= centroX;
        return (
          <div key={f.id} style={{ position: "absolute", left: p.x - tamanho / 2, top: p.y - tamanho / 2 }}>
            {f.status === "atual" && <div style={estilos.bandeiraAtual}>Você está aqui</div>}
            <Selo fase={f} tamanho={tamanho} />
            <span
              style={{
                ...estilos.vLabel,
                ...(labelEsquerda ? { right: tamanho + 10 } : { left: tamanho + 10 }),
                color: f.status === "bloqueado" ? "#B7BEB2" : "#33422F",
              }}
            >
              {f.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const estiloGlobal = `
  .trilha-no {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; font-weight: 800; flex-shrink: 0;
    position: relative; z-index: 1; box-sizing: border-box;
    transition: transform 0.15s ease;
  }
  .no-completo {
    background: linear-gradient(180deg, #E3B76A 0%, #B98B4E 100%);
    color: #FFFFFF; border-bottom: 4px solid #8A6224;
  }
  .no-atual {
    background: linear-gradient(180deg, #F1C878 0%, #D9A94C 100%);
    color: #FFFFFF; border-bottom: 5px solid #8A6224;
    box-shadow: 0 0 0 6px rgba(217,169,76,0.25);
    animation: pulsar-no 1.8s ease-in-out infinite;
  }
  .no-bloqueado {
    background: #EFEAD9; color: #B7BEB2; border-bottom: 4px solid #DCD5BF;
  }
  @keyframes pulsar-no {
    0%, 100% { box-shadow: 0 0 0 6px rgba(217,169,76,0.25); }
    50% { box-shadow: 0 0 0 11px rgba(217,169,76,0.12); }
  }
  @media (prefers-reduced-motion: reduce) {
    .no-atual { animation: none; }
  }
`;

const estilos = {
  hWrap: { display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "4px 0 10px" },
  hItem: { display: "flex", alignItems: "flex-start" },
  hNodeCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 68 },
  hLabel: { fontSize: 10.5, fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  hLinha: { width: 22, height: 4, borderRadius: 2, marginTop: 18 },
  vWrap: { position: "relative", margin: "0 auto" },
  vLabel: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12.5,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  bandeiraAtual: {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginBottom: 8,
    background: "#33422F",
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
};
