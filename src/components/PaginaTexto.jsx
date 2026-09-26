/**
 * Moldura simples para páginas de texto públicas (Política de Privacidade,
 * Como excluir sua conta) -- as que a Google Play exige que tenham endereço
 * próprio na web.
 */
export default function PaginaTexto({ titulo, atualizadoEm, children }) {
  return (
    <div style={s.page}>
      <style>{`
        .texto-legal h2 { font-family: Fraunces, Georgia, serif; font-weight: 500; font-size: 21px; color: #33422F; margin: 28px 0 10px; }
        .texto-legal p, .texto-legal li { font-size: 16px; line-height: 1.65; color: #3E4D43; }
        .texto-legal ul, .texto-legal ol { padding-left: 22px; }
        .texto-legal li { margin-bottom: 6px; }
        .texto-legal a { color: #8A6224; text-decoration: underline; font-weight: 600; }
      `}</style>
      <div style={s.container} className="texto-legal">
        <a href="/" style={s.marca}>🕊️ Devocional Diário</a>
        <h1 style={s.titulo}>{titulo}</h1>
        {atualizadoEm && <p style={s.data}>Última atualização: {atualizadoEm}</p>}
        {children}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#F6EFE1",
    fontFamily: "'Karla', sans-serif",
    padding: "24px 16px 60px",
  },
  container: {
    maxWidth: 680,
    margin: "0 auto",
    background: "#FBF9F3",
    border: "1px solid #E7E0D0",
    borderRadius: 18,
    padding: "28px 22px",
  },
  marca: { fontWeight: 700, fontSize: 15, color: "#33422F", textDecoration: "none" },
  titulo: { fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 30, color: "#33422F", margin: "18px 0 6px" },
  data: { fontSize: 14, color: "#7A8A7F", margin: "0 0 18px" },
};
