"use client";

import { useEstatisticas } from "@/src/lib/hooks/useEstatisticas";
import { useRanking } from "@/src/lib/hooks/useRanking";
import { NIVEIS, obterNivel } from "@/src/lib/devocional/niveis";
import { calcularConquistas } from "@/src/lib/devocional/badges";
import TrilhaFases from "@/src/components/TrilhaFases";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";
import AvatarUsuario from "@/src/components/AvatarUsuario";

export default function ProgressoTab({ usuarioId, nomeExibicao, gatilhoRecarga }) {
  const { stats, carregando: carregandoStats } = useEstatisticas(usuarioId, gatilhoRecarga);
  const { ranking, minhaPosicao, carregando: carregandoRanking } = useRanking(usuarioId);

  const nivel = obterNivel(stats?.xp_total ?? 0);
  const { tieradas: conquistasTieradas, unica: conquistaUnica } = calcularConquistas(stats);
  const totalConquistado = conquistasTieradas.filter((c) => c.conquistada).length + (conquistaUnica.conquistada ? 1 : 0);
  const totalConquistas = conquistasTieradas.length + 1;

  // Jornada estilo Duolingo: cada nível é uma fase na trilha -- as que já
  // ficaram para trás estão completas, a atual está em destaque, e as
  // seguintes aparecem bloqueadas até o usuário chegar lá.
  const fasesJornada = NIVEIS.map((n, i) => ({
    id: n.titulo,
    label: n.titulo,
    status: i < nivel.indice ? "completo" : i === nivel.indice ? "atual" : "bloqueado",
  }));

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

      {/* Jornada: trilha de níveis, estilo mapa de fases de jogo */}
      <div style={{ marginTop: 28 }}>
        <h2 style={styles.sectionTitle}>Sua jornada</h2>
        <p style={styles.sectionSubtitle}>Cada devocional te leva um passo adiante na trilha.</p>
        <div style={styles.jornadaCard}>
          <TrilhaFases orientation="vertical" fases={fasesJornada} />
        </div>
      </div>

      {/* Conquistas com níveis (Bronze/Prata/Ouro/Diamante), estilo jogo */}
      <div style={{ marginTop: 24 }}>
        <h2 style={styles.sectionTitle}>
          Conquistas {!carregandoStats && `(${totalConquistado}/${totalConquistas})`}
        </h2>
        <p style={styles.sectionSubtitle}>Suba de nível em cada categoria conforme você usa o app.</p>

        <div style={styles.listaConquistas}>
          {conquistasTieradas.map((c) => (
            <div key={c.id} style={{ ...styles.conquistaCard, ...(c.conquistada ? {} : styles.conquistaCardInativa) }}>
              <div style={styles.conquistaTopo}>
                <span style={styles.conquistaIconeGrande}>{c.icone}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.conquistaLinhaNome}>
                    <span style={styles.conquistaNome}>{c.nome}</span>
                    {c.nivelAtual && (
                      <span style={{ ...styles.medalhaTag, color: c.nivelAtual.cor }}>
                        {c.nivelAtual.medalha} {c.nivelAtual.nome}
                      </span>
                    )}
                  </div>
                  <p style={styles.conquistaDescricao}>
                    {c.nivelMaximo ? "Nível máximo alcançado!" : c.descricao}
                  </p>
                </div>
              </div>

              {!c.nivelMaximo && (
                <>
                  <div style={{ ...styles.barraFundo, marginTop: 10 }}>
                    <div style={{ ...styles.barraProgresso, width: `${Math.round(c.progresso * 100)}%` }} />
                  </div>
                  <p style={styles.conquistaFracao}>
                    {c.valor}/{c.metaProxima} · próximo: {c.proximoNivel.medalha} {c.proximoNivel.nome}
                  </p>
                </>
              )}

              {c.conquistada && (
                <div style={{ marginTop: 10 }}>
                  <CompartilharBotoes
                    compact
                    texto={`${c.nivelAtual.medalha} Alcancei o nível ${c.nivelAtual.nome} em "${c.nome}" no Devocional Diário!`}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Conquista única, sem níveis */}
          <div style={{ ...styles.conquistaCard, ...(conquistaUnica.conquistada ? {} : styles.conquistaCardInativa) }}>
            <div style={styles.conquistaTopo}>
              <span
                style={{
                  ...styles.conquistaIconeGrande,
                  filter: conquistaUnica.conquistada ? "none" : "grayscale(1)",
                  opacity: conquistaUnica.conquistada ? 1 : 0.4,
                }}
              >
                {conquistaUnica.icone}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={styles.conquistaNome}>{conquistaUnica.nome}</span>
                <p style={styles.conquistaDescricao}>{conquistaUnica.descricao}</p>
              </div>
            </div>
            {conquistaUnica.conquistada && (
              <div style={{ marginTop: 10 }}>
                <CompartilharBotoes
                  compact
                  texto={`🙏 Desbloqueei a conquista "${conquistaUnica.nome}" no Devocional Diário!`}
                />
              </div>
            )}
          </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <AvatarUsuario nome={r.nome_exibicao} fotoUrl={r.foto_url} tamanho={28} />
                  <span style={styles.rankingNome}>{r.nome_exibicao}</span>
                </div>
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
  jornadaCard: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "18px 10px 24px",
    display: "flex",
    justifyContent: "center",
    overflow: "hidden",
  },
  listaConquistas: { display: "flex", flexDirection: "column", gap: 12 },
  conquistaCard: {
    background: "#FFFDF7",
    border: "1px solid #F0DFAF",
    borderRadius: 16,
    padding: "14px 16px",
    boxShadow: "0 4px 14px rgba(217,169,76,0.12)",
  },
  conquistaCardInativa: {
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    boxShadow: "none",
  },
  conquistaTopo: { display: "flex", alignItems: "flex-start", gap: 12 },
  conquistaIconeGrande: { fontSize: 28, flexShrink: 0, lineHeight: 1 },
  conquistaLinhaNome: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  conquistaNome: { fontSize: 14.5, fontWeight: 700, color: "#33422F" },
  medalhaTag: { fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" },
  conquistaDescricao: { fontSize: 12.5, color: "#7A8A7F", margin: "2px 0 0" },
  conquistaFracao: { fontSize: 11, color: "#9AA79C", fontWeight: 600, margin: "6px 0 0" },
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
