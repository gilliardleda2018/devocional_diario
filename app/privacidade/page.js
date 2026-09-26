import PaginaTexto from "@/src/components/PaginaTexto";

export const metadata = {
  title: "Política de Privacidade — Devocional Diário",
  description: "Como o Devocional Diário coleta, usa e protege os seus dados.",
};

// Endereço exigido pela Google Play na ficha do app. Revise este texto antes
// de publicar: ele descreve o que o app faz hoje (set/2026).
export default function PaginaPrivacidade() {
  return (
    <PaginaTexto titulo="Política de Privacidade" atualizadoEm="25 de setembro de 2026">
      <p>
        O Devocional Diário é um aplicativo gratuito de devocional cristão, mantido por Aggilli Intelligence. Esta
        página explica quais dados coletamos, para que usamos e quais são os seus direitos, conforme a Lei Geral de
        Proteção de Dados (LGPD, Lei nº 13.709/2018).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (guardada de forma criptografada). Se você entra com o Google, recebemos seu nome, e-mail e foto de perfil do Google.</li>
        <li><strong>Dados de perfil que você decide preencher:</strong> nome de usuário, foto, cidade, igreja, telefone, Instagram, Facebook e biografia.</li>
        <li><strong>Conteúdo que você cria:</strong> reflexões do devocional e do diário, versículos favoritos, pedidos de oração, comentários e respostas do quiz.</li>
        <li><strong>Atividade no app:</strong> dias em que fez o devocional (ofensiva), pontos, sementes, amizades, comunidades e torcidas.</li>
        <li><strong>Dados de uso:</strong> quais telas foram abertas e quais botões foram tocados (por exemplo, &quot;compartilhou a Palavra&quot;), ligados a um identificador aleatório do aparelho. Usamos isso para entender o que funciona e melhorar o app.</li>
        <li><strong>Lembrete diário:</strong> o horário escolhido fica guardado só no seu aparelho.</li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Criar e manter a sua conta e permitir que você entre nela.</li>
        <li>Mostrar seu progresso, ofensiva, diário e favoritos.</li>
        <li>Conectar você a amigos e comunidades, se você quiser.</li>
        <li>Enviar e-mails de acesso (código para entrar ou redefinir a senha).</li>
        <li>Melhorar o app a partir dos dados de uso.</li>
      </ul>
      <p>Não vendemos seus dados, não mostramos anúncios e não usamos seus dados para publicidade.</p>

      <h2>3. O que outras pessoas veem</h2>
      <p>
        Outros usuários podem ver seu nome de exibição, foto, nome de usuário e sua ofensiva. Cidade, igreja e redes
        sociais aparecem conforme as suas configurações de privacidade no app. E-mail, telefone e nome completo não
        são mostrados a outros usuários. Pedidos de oração podem ser publicados de forma anônima.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <p>Usamos serviços de terceiros que processam dados em nosso nome, apenas para o app funcionar:</p>
      <ul>
        <li><strong>Supabase</strong> — banco de dados e login.</li>
        <li><strong>Amazon Web Services (AWS Amplify)</strong> — hospedagem do app.</li>
        <li><strong>Brevo</strong> — envio dos e-mails de acesso.</li>
        <li><strong>Google</strong> — login com Google, se você escolher essa opção.</li>
      </ul>
      <p>O texto bíblico vem de um serviço público (bible-api.com), que não recebe nenhum dado seu.</p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Enquanto a sua conta existir. Quando você exclui a conta, apagamos seus dados de forma definitiva, incluindo
        perfil, diário, favoritos, amizades, pedidos de oração, comentários e dados de uso ligados à conta.
      </p>

      <h2>6. Seus direitos</h2>
      <p>
        Você pode ver e corrigir seus dados no próprio app (Perfil), e pode excluir sua conta a qualquer momento em
        Perfil → &quot;Excluir minha conta&quot; (veja <a href="/excluir-conta">como excluir sua conta</a>). Para
        qualquer outro pedido — acesso, correção, portabilidade ou dúvidas — escreva para{" "}
        <a href="mailto:devocionaldiario.app@gmail.com">devocionaldiario.app@gmail.com</a>.
      </p>

      <h2>7. Crianças</h2>
      <p>O app não é direcionado a menores de 13 anos, e não coletamos dados de crianças de propósito.</p>

      <h2>8. Segurança</h2>
      <p>
        Os dados trafegam de forma criptografada (HTTPS) e o acesso a eles no banco é restrito por regras de
        segurança: cada pessoa só lê e altera o que é seu.
      </p>

      <h2>9. Mudanças nesta política</h2>
      <p>Se esta política mudar, atualizamos a data no topo desta página.</p>
    </PaginaTexto>
  );
}
