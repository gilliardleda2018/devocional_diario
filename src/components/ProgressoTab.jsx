"use client";

import { useEstatisticas } from "@/src/lib/hooks/useEstatisticas";
import { useRanking } from "@/src/lib/hooks/useRanking";
import { obterNivel } from "@/src/lib/devocional/niveis";
import { calcularBadges } from "@/src/lib/devocional/badges";

export default function ProgressoTab({ usuarioId, nomeExibicao, gatilhoRecarga }) {
  const { stats, carregando: carregandoStats } = useEstatisticas(usuarioId, gatilhoRecarga);
  const { ranking, minhaPosicao, carregando: carregandoRanking } = useRanking(usuarioId);

  const nivel = obterNivel(stats?.xp_total ?? 0);
  const badges = calcularBadges(stats);
  const badgesConquistadas = badges.filter((b) => b.conquistada);

  return (
    <div style={styles.wrap}>
      {/* XP e nível */}
      <div style={styles.card}>
        <p style={styles.cardLabel}>Seu nível</p>
        <p style={styles.nivelTitulo}>{nivel.titulo}</p>
        <p style={styles.xpTexto}>
          {carregandoStats ? "Carregando..." : `${nivel.xp} XP`}
          {!nivel.nivelMaximo && !carregandoStats && ` · próximo nível: ${nivel.proximoTitulo} (${nivel.xpProximoNivel} XP)`}
        </p>
        {!nivel.nivelMaximo && (
          <div style={styles.barraFundo}>
            <div style={{ ...styles.barraProgresso, width: `${Math.round(nivel.progresso * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ marginTop: 24 }}>
        <h2 style={styles.sectionTitle}>
          Conquistas {!carregandoStats && `(${badgesConquistadas.length}/${badges.length})`}
        </h2>
        <div style={styles.badgeGrid}>
          {badges.map((b) => (
            <div key={b.id} style={b.conquistada ? styles.badgeCardAtiva : styles.badgeCardInativa} title={b.descricao}>
              <span style={{ fontSize: 26, filter: b.conquistada ? "none" : "grayscale(1)", opacity: b.conquistada ? 1 : 0.4 }}>
                {b.icone}
              </span>
              <span style={styles.badgeNome}>{b.nome}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div style={{ marginTop: 28 }}>
        <h2 style={styles.sectionTitle}>Liga</h2>
        <p style={styles.sectionSubtitle}>
          {minhaPosicao ? `Sua posição: #${minhaPosicao}` : "Complete um devocional para entrar na liga."}
        </p>
        {carregandoRanking ? (
          <p style={styles.loadingText}>Carregando...</p>
        ) : (
          <div style={styles.rankingCard}>
            {ranking.map((r) => (
              <div
                key={`${r.posicao}-${r.nome_exibicao}`}
                style={{
                  ...styles.rankingRow,
                  ...(r.nome_exibicao === nomeExibicao ? styles.rankingRowEu : {}),
                }}
              >
                <span style={styles.rankingPosicao}>#{r.posicao}</span>
                <span style={styles.rankingNome}>{r.nome_exibicao}</span>
                <span style={styles.rankingXp}>{r.xp_total} XP</span>
              </div>
            ))}
            {ranking.length === 0 && <p style={styles.loadingText}>Ninguém na liga ainda — seja o primeiro!</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { textAlign: "left" },
  card: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "22px 22px",
    boxShadow: "0 8px 24px rgba(80, 70, 40, 0.06)",
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#B98B4E",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  nivelTitulo: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 24,
    margin: "0 0 6px",
    color: "#33422F",
  },
  xpTexto: {
    fontSize: 13,
    color: "#7A8A7F",
    fontWeight: 600,
    margin: "0 0 14px",
  },
  barraFundo: {
    height: 10,
    borderRadius: 999,
    background: "#EFEAD9",
    overflow: "hidden",
  },
  barraProgresso: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #D9A94C, #B98B4E)",
    transition: "width 0.4s ease",
  },
  sectionTitle: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 500,
    fontSize: 19,
    margin: "0 0 6px",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#7A8A7F",
    margin: "0 0 14px",
  },
  badgeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  badgeCardAtiva: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 6px",
    borderRadius: 14,
    border: "1px solid #F0DFAF",
    background: "#FFFDF7",
    boxShadow: "0 4px 14px rgba(217,169,76,0.18)",
  },
  badgeCardInativa: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 6px",
    borderRadius: 14,
    border: "1px solid #E7E0D0",
    background: "#FBF9F3",
  },
  badgeNome: {
    fontSize: 10.5,
    fontWeight: 600,
    color: "#3C4A3F",
    textAlign: "center",
    lineHeight: 1.2,
  },
  loadingText: {
    fontSize: 13,
    color: "#9AA79C",
    fontStyle: "italic",
  },
  rankingCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E0D0",
    borderRadius: 16,
    overflow: "hidden",
  },
  rankingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderBottom: "1px solid #F1EEE3",
    fontSize: 13.5,
  },
  rankingRowEu: {
    background: "#F1E2C4",
    fontWeight: 700,
  },
  rankingPosicao: {
    width: 32,
    color: "#B98B4E",
    fontWeight: 700,
  },
  rankingNome: {
    flex: 1,
    color: "#2D3B33",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rankingXp: {
    color: "#7A8A7F",
    fontWeight: 700,
  },
};
