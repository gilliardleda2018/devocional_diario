# Mudanças — auditoria de set/2026

## Segurança (banco)
- Aplicado: funções bloqueadas para visitantes anônimos; e-mails removidos dos nomes públicos; busca de pessoas exige login e 2+ letras; gatilho de cadastro não usa mais o e-mail como nome.
- Aplicado: e-mail, telefone e nome completo não são mais legíveis por outros usuários.
- Aplicado: usuário só edita campos permitidos do próprio perfil (não mexe em status, e-mail etc.).
- Aplicado: configurações de privacidade agora são salvas de verdade.

## Ofensiva e recompensas
- "Hoje" passou a ser o dia do Brasil no banco e no app (antes, depois das 21h contava como o dia seguinte).
- Devocional agora dá +10 sementes (+5 com reflexão), além dos 20 XP.
- Se o devocional não for salvo, o app avisa (antes mostrava como concluído mesmo sem salvar).

## Fluxo do app
- Menu: de 10 abas para 5 áreas (Hoje, Devocional, Bíblia, Comunhão, Meu caminho), com sub-abas.
- Tela "Hoje": botão principal "Começar meu devocional" levando ao devocional que conta para a ofensiva.
- Missões clicáveis: cada uma leva até onde a tarefa é feita.
- Guia de leitura saiu da tela inicial (continua na Bíblia). Desafios ocultos (zero uso).

## Cadastro e convite
- Dois modos claros: "Criar conta" (nome obrigatório + e-mail + senha) e "Já tenho conta".
- Link por e-mail virou "Esqueci minha senha" e não cria mais contas sem nome.
- Aviso para quem abre pelo Instagram/Facebook/WhatsApp (Google bloqueia login ali), com "Abrir no Chrome" e "Copiar link".
- Convite abre direto em "Criar conta" e o código fica salvo na conta (não se perde ao trocar de navegador).
- Doação removida da tela de login.
- Boas-vindas: só pede o nome, e só quando falta. Username gerado automaticamente.

## Publicar
    git add -A
    git commit -m "Auditoria: segurança, fluxo principal e cadastro"
    git push origin main
A Amplify publica sozinha após o push.
