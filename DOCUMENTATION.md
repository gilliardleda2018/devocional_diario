# 📄 Documentação Técnica e Arquitetura do Sistema — Devocional Diário

Documentação completa dos módulos, componentes, hooks customizados, esquema de banco de dados, funções armazenadas (RPCs) e fluxos de integração do projeto **Devocional Diário**.

---

## 📑 Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Módulos e Componentes React (`src/components/`)](#3-módulos-e-componentes-react-srccomponents)
4. [Hooks Customizados (`src/lib/hooks/`)](#4-hooks-customizados-srclibhooks)
5. [Modelagem de Dados e Esquema SQL (`supabase/`)](#5-modelagem-de-dados-e-esquema-sql-supabase)
6. [Funções Armazenadas (RPCs) no Banco de Dados](#6-funções-armazenadas-rpcs-no-banco-de-dados)
7. [Sistema de Notificações e Realtime](#7-sistema-de-notificações-e-realtime)
8. [Fluxo de Convites Sociais (WhatsApp & Instagram)](#8-fluxo-de-convites-sociais-whatsapp--instagram)
9. [Guia de Geração do APK Android](#9-guia-de-geração-do-apk-android)

---

## 1. Visão Geral da Arquitetura

O **Devocional Diário** foi construído sobre uma arquitetura moderna, responsiva e resiliente baseada no ecossistema Next.js e Supabase.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Navegador Web / App Mobile                   │
│                                                                        │
│   ┌───────────────────────┐              ┌─────────────────────────┐   │
│   │   DevocionalApp.jsx   │              │   AmigosTab.jsx         │   │
│   │   (Página Principal)  │              │   (Central de Conexões) │   │
│   └───────────┬───────────┘              └────────────┬────────────┘   │
│               │                                       │                │
│   ┌───────────▼───────────┐              ┌────────────▼────────────┐   │
│   │  CentralNotificacoes  │              │    CardConectarRedes    │   │
│   │   (Gaveta com Badge)  │              │  (WhatsApp & Instagram) │   │
│   └───────────┬───────────┘              └────────────┬────────────┘   │
└───────────────┼───────────────────────────────────────┼────────────────┘
                │ Hooks Customizados                    │
                ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Hooks Client (`src/lib/hooks/`)               │
│                                                                        │
│   useUsuario · useAmigos · useNotificacoes · useFeedAmigos · useOfensiva│
└───────────────┬───────────────────────────────────────┬────────────────┘
                │ Supabase JS Client & Realtime WebSocket│
                ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend / Cloud (Supabase)                      │
│                                                                        │
│  ┌───────────────────────┐   ┌─────────────────┐   ┌────────────────┐ │
│  │ PostgreSQL DB (RLS)    │   │ RPC Functions   │   │ Auth (OAuth &  │ │
│  │ (profiles, amizades...)│   │ (stored procs)  │   │ Magic Link)    │ │
│  └───────────────────────┘   └─────────────────┘   └────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura do Projeto

```
devocional_diario/
├── app/                        # Next.js App Router (Rotas e Páginas)
│   ├── auth/callback/          # Redirecionamento de OAuth/Magic Link
│   ├── login/                  # Tela de Login/Cadastro em 3 Campos
│   ├── globals.css             # Estilos Globais e Variáveis de Cores
│   ├── layout.js               # Layout Root do App
│   └── page.js                 # Controller da Rota Inicial
├── src/
│   ├── components/             # Componentes React de UI e Modais
│   │   ├── AmigosTab.jsx       # Hub de Conexões, Amigos, Sugestões e Liga
│   │   ├── AudioPlayer.jsx     # Leitor de Áudio em Voz Alta (TTS)
│   │   ├── AvatarUsuario.jsx   # Renderizador de Avatares e Presets
│   │   ├── CentralNotificacoesModal.jsx # Gaveta da Central de Notificações
│   │   ├── CompartilharBotoes.jsx       # Compartilhamento de Versículos
│   │   ├── DevocionalApp.jsx   # Controlador Principal da Aplicação
│   │   ├── GuiaLeituraBiblia.jsx # Navegador e Guia Bíblico
│   │   ├── PerfilModal.jsx     # Editor do Perfil do Usuário
│   │   ├── PerfilAmigoModal.jsx# Modal de Perfil de Outro Usuário
│   │   └── ...                 # Outros componentes de UI (Ofensiva, Quizzes, etc.)
│   └── lib/
│       ├── biblia/             # Utilitários da API de Leitura Bíblica
│       ├── devocional/         # Lógica de Missões, Níveis, Datas e Versículos
│       ├── hooks/              # Hooks React para Gestão de Estado e Dados
│       │   ├── useAmigos.js    # Hook de Gestão de Conexões e Relacionamentos
│       │   ├── useFeedAmigos.js# Hook de Atividade do Feed com Realtime
│       │   ├── useNotificacoes.js# Hook da Central de Notificações com Realtime
│       │   ├── useOfensiva.js  # Hook do Contador de Sequência Diária
│       │   └── ...             # Outros hooks do sistema
│       └── supabase/           # Instanciação do Cliente Supabase
├── supabase/                   # Scripts de Migração SQL e Esquemas do Banco
│   ├── schema.sql              # Tabelas base do sistema
│   ├── schema_faith_graph.sql  # Grafo de Amizades e Torcidas
│   └── schema_v2_social_notifications.sql # Notificações e RPCs estendidas
├── android/                    # Projeto Nativo Android (Capacitor)
├── capacitor.config.json       # Configuração do Capacitor Native
├── README.md                   # Resumo de Apresentação no GitHub
└── DOCUMENTATION.md            # Este manual técnico
```

---

## 3. Módulos e Componentes React (`src/components/`)

### 3.1 `DevocionalApp.jsx`
- **Função**: Componente mestre que controla a navegação por abas (`Início`, `Bíblia`, `Favoritos`, `Progresso`, `Comunidade`, `🤝 Conexões`), o cabeçalho superior com pílula de usuário e o acionamento dos modais principais.
- **Destaques**:
  - Pílula do Usuário com ícone lápis `✏️` indicando a ação de editar perfil.
  - Botão de Notificações 🔔 com badge numérico em tempo real.
  - Carregamento inicial resiliente do perfil local via Supabase `profiles`.

### 3.2 `AmigosTab.jsx`
- **Função**: Hub central de conexões.
- **Sub-abas**:
  - `Conexões`: Subdividida em *Amigos*, *Pedidos*, *Enviados* e *Sugestões*.
  - `Feed`: Atualizações dos devocionais e torcidas enviadas por amigos.
  - `Desafios`: Metas e quests coletivas de fé.
  - `Liga`: Ranking de XP acumulado.
- **`CardConectarRedes`**: Banner integrativo para WhatsApp e Instagram.

### 3.3 `PerfilModal.jsx`
- **Função**: Modal de edição completa de perfil.
- **Campos Editáveis**:
  - Nome de Exibição (obrigatório).
  - Username (`@username`).
  - Nome Completo.
  - Cidade e Estado (ex: *São Paulo - SP*).
  - Igreja / Comunidade Local.
  - Bio / Testemunho Curto.
  - Presets de Ícones Avatares (🕊️, ✝️, 🌿, ⚓, 🛡️, 👑, 💡, 🔥, ⭐, 📖, 🦁, 🌅) ou URL de Foto Personalizada.

### 3.4 `PerfilAmigoModal.jsx`
- **Função**: Visualizador do perfil de outro fiel da comunidade.
- **Recursos**:
  - Exibe Amigos em Comum (com quantidade e previews de foto).
  - Exibe Nível de Fé e XP acumulado.
  - Botões de Ação Dinâmicos (*Adicionar*, *Aceitar*, *Remover Amizade*, *Bloquear Usuário*, *Torcer* 🔥).

### 3.5 `CentralNotificacoesModal.jsx`
- **Função**: Drawer/Gaveta lateral de notificações agrupadas por período (*Hoje*, *Ontem*, *Esta Semana*, *Mais Antigas*).
- **Recursos**:
  - Botões de ação inline (*ACEITAR* / *REMOVER* solicitações de amizade).
  - Botão "Marcar todas como lidas".
  - Indicador visual de item não lido.

---

## 4. Hooks Customizados (`src/lib/hooks/`)

### 4.1 `useAmigos.js`
- **Responsabilidade**: Gerenciar relacionamentos, solicitações pendentes e busca de usuários.
- **Mecanismos de Resiliência**:
  - Executa RPCs primárias (`obter_meus_amigos`, `obter_pedidos_pendentes`, `enviar_pedido_amizade_v2`).
  - Possui consulta direta (*fallback*) às tabelas `amizades` e `profiles` caso alguma RPC não esteja disponível no banco.

### 4.2 `useNotificacoes.js`
- **Responsabilidade**: Carregar notificações, manter o contador de não lidas e escutar atualizações ao vivo.
- **Destaques**:
  - Tenta RPC `obter_notificacoes` e recorre ao fallback direto de `notifications`.
  - **Mesclagem de Pedidos Pendentes**: Insere automaticamente pedidos de amizade pendentes recebidos da tabela `amizades` no topo da lista.
  - **Escuta Dupla no Realtime**: Inscreve canais para `notifications` e `amizades`.

### 4.3 `useFeedAmigos.js`
- **Responsabilidade**: Carregar atividades da comunidade (devocionais concluídos e torcidas).
- **Destaques**:
  - Escuta em tempo real nas tabelas `devocionais_diarios`, `torcidas_amigos` e `amizades`.
  - Fallback direto caso a RPC `obter_feed_amigos` seja omitida no banco.

---

## 5. Modelagem de Dados e Esquema SQL (`supabase/`)

### 5.1 Tabela `profiles`
Guarda as informações de cadastro e perfil estendido do usuário.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_exibicao TEXT NOT NULL,
  nome_completo TEXT,
  username TEXT UNIQUE,
  foto_url TEXT,
  codigo_amigo TEXT UNIQUE,
  cidade TEXT,
  igreja TEXT,
  bio TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Tabela `amizades`
Armazena as conexões entre fiéis com controle de status (*pendente*, *aceita*, *bloqueada*).

```sql
CREATE TABLE public.amizades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'aceita', 'bloqueada')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT amizade_unica UNIQUE (solicitante_id, destinatario_id)
);
```

### 5.3 Tabela `notifications`
Armazena a central de notificações do usuário.

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'PRAYER_INTERACTION', etc.
  entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  lido_em TIMESTAMPTZ
);
```

---

## 6. Funções Armazenadas (RPCs) no Banco de Dados

### 6.1 `get_relationship_state(p_target_id UUID)`
Retorna o estado exato da conexão entre o usuário logado (`auth.uid()`) e um perfil alvo:
- `'SELF'`: O próprio usuário.
- `'FRIENDS'`: Amigos confirmados.
- `'REQUEST_SENT'`: Solicitação enviada aguardando resposta.
- `'REQUEST_RECEIVED'`: Solicitação recebida pendente de aceite.
- `'BLOCKED'`: Usuário bloqueado.
- `'NONE'`: Sem relacionamento prévio.

### 6.2 `enviar_pedido_amizade_v2(p_identificador TEXT)`
Permite adicionar um amigo utilizando o **código de amigo**, **`@username`** ou **UUID**. Se já houver um pedido pendente vindo da outra pessoa, a função aceita automaticamente o relacionamento de forma transparente.

---

## 7. Sistema de Notificações e Realtime

A aplicação utiliza canais do **Supabase Realtime (WebSockets)** para notificar o usuário instantaneamente:

```javascript
const canal = supabase
  .channel(`notificacoes_user_${usuarioId}`)
  .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${usuarioId}` }, carregarNotificacoes)
  .on("postgres_changes", { event: "*", schema: "public", table: "amizades", filter: `destinatario_id=eq.${usuarioId}` }, carregarNotificacoes)
  .subscribe();
```

---

## 8. Fluxo de Convites Sociais (WhatsApp & Instagram)

No componente `CardConectarRedes` (`AmigosTab.jsx`), o compartilhamento é acionado sem necessidade de SDKs pesados de terceiros:

1. **WhatsApp**:
   - Aciona `window.open("https://wa.me/?text=...", "_blank")` com mensagem calorosa preenchida com a URL do app.
2. **Instagram / Redes**:
   - Tenta invocar a API nativa `navigator.share({ title, text, url })` (em celulares Android/iOS) que abre a folha nativa com opções de envio no Instagram Direct, Stories, Telegram e WhatsApp.
   - Em navegadores desktop, copia automaticamente a mensagem formatada para a área de transferência e abre o Instagram Direct com um feedback visual.

---

## 9. Guia de Geração do APK Android

O projeto está pré-configurado com **Capacitor** para geração de aplicativo Android nativo.

### Passos para Compilar o APK:

1. **Compilar a Aplicação Next.js**:
   ```bash
   npm run build
   ```

2. **Sincronizar com o Projeto Nativo Android**:
   ```bash
   npx cap sync android
   ```

3. **Abrir no Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Gerar o APK de Produção**:
   - No Android Studio, vá em **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)**.
   - O APK gerado estará localizado em `android/app/build/outputs/apk/debug/app-debug.apk` ou `release`.
