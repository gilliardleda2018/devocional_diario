# 🚀 Guia Completo de Implantação na AWS (Devocional Diário)

Este guia descreve o passo a passo para implantar o **Devocional Diário** na **Amazon Web Services (AWS)** em produção.

---

## 📌 Método Recomendado: AWS Amplify Hosting

O **AWS Amplify Hosting** é a solução oficial da AWS com suporte nativo a aplicações **Next.js 14 (App Router)** com SSR, SSG e rotas de API. Ele se conecta diretamente ao repositório GitHub e realiza **deploy automático a cada `git push`**.

### 📋 Pré-requisitos
- Uma conta ativa na [AWS Console](https://aws.amazon.com/console/).
- Repositório do projeto no GitHub: `https://github.com/gilliardleda2018/devocional_diario.git`.
- Credenciais do Supabase (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

### 🔨 Passo a Passo no AWS Amplify

#### 1. Acessar o AWS Amplify Console
1. Faça login na [AWS Management Console](https://console.aws.amazon.com/).
2. Na barra de busca superior, digite **AWS Amplify** e selecione o serviço.
3. No painel do Amplify, clique no botão **"Create new app"** (ou **"Host web app"**).

#### 2. Conectar o Repositório GitHub
1. Selecione a opção **GitHub** como provedor de código-fonte e clique em **Continue**.
2. Autorize o AWS Amplify a acessar sua conta do GitHub se solicitado.
3. Selecione o repositório **`gilliardleda2018/devocional_diario`**.
4. Selecione a branch principal: **`main`**.
5. Clique em **Next**.

#### 3. Configurar as Variáveis de Ambiente (Environment Variables)
1. Na tela de configurações de build, expanda a seção **Advanced settings** (ou **Environment variables**).
2. Adicione as seguintes chaves de ambiente:

| Chave (Key) | Valor (Value) | Descrição |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxyyyzzz.supabase.co` | Sua URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJKV1...` | Sua Chave Anon pública do Supabase |

> ⚠️ **Importante**: Sem essas duas variáveis, o Next.js não conseguirá conectar ao banco de dados Supabase em produção.

#### 4. Confirmar a Configuração de Build (`amplify.yml`)
O AWS Amplify detectará automaticamente o arquivo [`amplify.yml`](file:///c:/fitness_projeto/devocional_biblico/amplify.yml) já presente no repositório:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### 5. Implantar e Obter o Domínio
1. Clique em **Save and Deploy**.
2. O Amplify iniciará o pipeline de build em 4 etapas: **Provision**, **Build**, **Deploy** e **Verify**.
3. Ao finalizar, o Amplify gerará uma URL pública com HTTPS habilitado por padrão (exemplo: `https://main.d123456789.amplifyapp.com`).

---

### 🌐 Configurar Domínio Personalizado na AWS (Opcional)

Se você possui um domínio próprio no **Route 53** ou outro registrador (ex: GoDaddy, Registro.br):
1. No menu do seu aplicativo no AWS Amplify, acesse **Domain management**.
2. Clique em **Add domain** e digite o seu domínio (ex: `devocional.com.br`).
3. O AWS Amplify criará e renovará automaticamente os certificados SSL/TLS gratuitos via AWS Certificate Manager (ACM).

---

### 🔄 Configurar URLs de Redirecionamento no Supabase

Após a implantação na AWS, atualize as URLs de autenticação no Supabase:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2. Vá em **Authentication** ➔ **URL Configuration**.
3. Em **Site URL**, altere para a sua URL da AWS (ex: `https://main.d123456789.amplifyapp.com` ou seu domínio customizado).
4. Em **Redirect URLs**, adicione a URL de callback:
   - `https://main.d123456789.amplifyapp.com/auth/callback`

---

## 🐋 Método Alternativo: AWS App Runner (Container Docker)

Se preferir rodar em um container gerenciado:

1. Crie uma imagem Docker usando a compilação standalone do Next.js.
2. Envie a imagem para o **AWS ECR (Elastic Container Registry)**.
3. Crie um serviço no **AWS App Runner** apontando para a imagem no ECR na porta `3000`.
4. Defina as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas configurações do App Runner.

---

## ✅ Resumo da Automação CI/CD
A partir de agora, **qualquer alteração enviada ao GitHub (`git push origin main`) atualizará automaticamente a produção na AWS em tempo real!**
