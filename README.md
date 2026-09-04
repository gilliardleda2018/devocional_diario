# 📖 Devocional Diário — Plataforma de Edificação Espiritual & Conexões Cristãs

Uma aplicação web e mobile moderna, serena e inspiradora, desenvolvida para auxiliar fiéis na leitura diária da Palavra de Deus, cultivo da oração, engajamento em conexões cristãs e compartilhamento de devocionais.

---

## 🌟 Principais Funcionalidades

### 1. 📖 Devocional Diário & Leitura Bíblica
- **Palavra para o Dia**: Versículos selecionados com datas comemorativas automáticas (Dia das Mães, dos Pais, Páscoa, Natal, etc.).
- **Player de Áudio integrável**: Leitura em voz alta (TTS) dos versículos.
- **Bíblia Completa em Português**: Leitor da tradução de João Ferreira de Almeida (Domínio Público) por livro, capítulo ou busca por referência (ex: *Salmos 23*, *João 3:16*).
- **Trilha de Reflexão em 3 Passos**: 1. Leia com calma ➔ 2. Reflita & Escreva seu diário ➔ 3. Ore.
- **Guias Temáticos de Leitura**: Guias para momentos de ansiedade, gratidão, decisões, luto, paz, coragem e restauração.

### 2. 🤝 Sistema de Conexões & Amizades (Faith Graph)
- **Central de Conexões**: 4 abas dedicadas: *Amigos*, *Solicitações Recebidas*, *Enviadas* e *Sugestões Explicáveis*.
- **Busca Paginada de Pessoas**: Pesquisa por Nome, Username (`@username`), Cidade ou Igreja com busca em tempo real.
- **Card de Convite Redes Sociais (WhatsApp & Instagram)**:
  - **📲 WhatsApp**: Link direto (`wa.me`) para convidar contatos da agenda.
  - **📷 Instagram / Redes**: Suporte a Web Share API para Instagram Direct/Stories e botão de copiar link.
- **Perfil do Amigo Modal**: Exibição de amigos em comum, nível de fé, cidade, igreja, bio e botões dinâmicos de relacionamento (*Adicionar*, *Aceitar*, *Remover*, *Bloquear*, *Torcer* 🔥).

### 3. 🔔 Central de Notificações em Tempo Real
- **Sininho no Cabeçalho**: Badge com contador de não lidas e animação suave.
- **Notificações Integradas**: Solicitações de amizade, aceite de convites, torcidas recebidas, intercessões de oração e avisos do sistema.
- **Ações Inline**: Aceitar ou remover pedidos diretamente na gaveta de notificações.
- **Resiliência Total**: Mesclagem de notificações do banco com solicitações pendentes e suporte a Supabase Realtime.

### 4. 🚀 Gamificação & Engajamento Espiritual
- **Sistema de Ofensivas (Chama de Fé 🔥)**: Contador de dias seguidos de devocional com recorde de maior sequência.
- **Missões Diárias & Conquistas**: Quests espirituais com recompensas em XP.
- **Quiz Bíblico**: Perguntas de fixação sobre a Palavra do dia com ganho de XP.
- **Liga de Amigos & Desafios em Grupo**: Ranking de XP entre amigos e metas coletivas.

### 5. 👥 Cadastro & Perfil Editável
- **Cadastro Simplificado**: Cadastro rápido em apenas 3 campos (Nome, E-mail, Senha) ou login via Google OAuth / Magic Link. Foto de perfil 100% opcional.
- **Edição Completa de Perfil**: Nome de exibição, Username, Nome completo, Cidade, Igreja, Bio, presets de Avatares (🕊️, ✝️, 🌿, ⚓, 🛡️, 👑, 💡, 🔥, ⭐, 📖, 🦁, 🌅) ou URL de foto personalizada.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), React 18, Tailwind CSS, Fontes Google (Fraunces & Karla).
- **Backend & Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, RPC Stored Procedures, Realtime Subscriptions, Auth OAuth/MagicLink).
- **Mobile Packaging**: [Capacitor](https://capacitorjs.com/) para compilação nativa em Android (APK/AAB).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** v18 ou superior
- **npm** v9 ou superior
- Conta e Projeto configurado no **Supabase**

### 1. Clonar o Repositório
```bash
git clone https://github.com/gilliardleda2018/devocional_diario.git
cd devocional_diario
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 5. Compilação de Produção
```bash
npm run build
npm run start
```

---

## 🗄️ Configuração do Banco de Dados (Supabase)

Para habilitar todas as funcionalidades de Conexões, Notificações e Gamificação, execute os scripts SQL localizados na pasta `/supabase` no **SQL Editor** do Supabase na seguinte ordem:

1. `supabase/schema.sql` (Estrutura base, tabelas de perfis, devocionais, estatísticas e orações).
2. `supabase/atualizacao_gamificacao.sql` (Tabelas de ofensivas, missões e conquistas).
3. `supabase/schema_faith_graph.sql` (Relacionamentos de amizade, blocos de usuários e torcidas).
4. `supabase/schema_v2_social_notifications.sql` (Tabela de notificações, RPCs `get_relationship_state`, `enviar_pedido_amizade_v2`, `obter_notificacoes`, `obter_recomendacoes_pessoas`, `buscar_usuarios` e `obter_amigos_em_comum`).

---

## 📚 Documentação Técnica Completa

Para detalhes aprofundados sobre a arquitetura de código, dicionário de dados, RPCs, hooks customizados e componentes, consulte a **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## 📄 Licença

Este projeto é de uso pessoal e comunitário para edificação espiritual. Sinta-se livre para contribuir! 🌿
