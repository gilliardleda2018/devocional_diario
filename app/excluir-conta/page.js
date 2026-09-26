import PaginaTexto from "@/src/components/PaginaTexto";

export const metadata = {
  title: "Excluir sua conta — Devocional Diário",
  description: "Como excluir sua conta do Devocional Diário e o que acontece com os seus dados.",
};

// Endereço exigido pela Google Play ("URL para excluir a conta").
export default function PaginaExcluirConta() {
  return (
    <PaginaTexto titulo="Como excluir sua conta">
      <h2>Pelo app ou pelo site</h2>
      <ol>
        <li>Entre na sua conta no Devocional Diário.</li>
        <li>Toque no seu nome, no topo da tela, para abrir o Perfil.</li>
        <li>No fim do Perfil, toque em <strong>Excluir minha conta</strong>.</li>
        <li>Digite <strong>EXCLUIR</strong> para confirmar e toque em <strong>Excluir para sempre</strong>.</li>
      </ol>
      <p>
        <a href="/login">Entrar para excluir minha conta →</a>
      </p>

      <h2>Se você não consegue entrar</h2>
      <p>
        Escreva para <a href="mailto:devocionaldiario.app@gmail.com">devocionaldiario.app@gmail.com</a> a partir do
        e-mail da sua conta, com o assunto &quot;Excluir minha conta&quot;. Excluímos em até 7 dias e respondemos
        confirmando.
      </p>

      <h2>O que é apagado</h2>
      <p>
        Tudo: cadastro, perfil, ofensiva, diário e reflexões, favoritos, amizades, comunidades, pedidos de oração,
        comentários, sementes, pontos e dados de uso ligados à conta. A exclusão é definitiva e não pode ser
        desfeita. Nada é guardado depois disso.
      </p>
    </PaginaTexto>
  );
}
