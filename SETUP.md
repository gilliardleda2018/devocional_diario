# Devocional Diário — guia de configuração

App em Next.js com login real (Google + link mágico por e-mail via
Supabase Auth), Bíblia completa (Almeida 1911, domínio público, buscada ao
vivo da getBible API) e devocional guiado por sentimento, com ofensiva
(streak) de assiduidade.

## 1. Criar o projeto no Supabase

1. Entre em [supabase.com](https://supabase.com), crie uma conta (ou
   entre com a que já tiver) e clique em **New project**.
2. Escolha um nome (ex: `devocional-diario`), uma senha de banco (guarde
   em local seguro) e a região mais próxima (ex: South America).
3. Espere o projeto terminar de provisionar (leva ~2 minutos).

## 2. Rodar o schema do banco

1. No painel do Supabase, vá em **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie **todo** o
   conteúdo e cole no editor.
3. Clique em **Run**. Isso cria as tabelas (`profiles`, `devotional_logs`,
   `streaks`, `favoritos`), as políticas de segurança (RLS) e a função que
   calcula a ofensiva.

## 3. Configurar login com Google

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um
   projeto (ou use um existente) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID** → tipo **Web application**.
3. Em **Authorized redirect URIs**, adicione:
   ```
   https://SEU-PROJETO.supabase.co/auth/v1/callback
   ```
   (troque `SEU-PROJETO` pela referência do seu projeto Supabase — está na
   URL do painel).
4. Copie o **Client ID** e o **Client Secret** gerados.
5. No painel do Supabase: **Authentication** → **Providers** → **Google**
   → habilite e cole o Client ID e Client Secret → **Save**.

## 4. Configurar as URLs de redirecionamento

No painel do Supabase: **Authentication** → **URL Configuration**:

- **Site URL**: a URL onde o app vai rodar (localmente:
  `http://localhost:3000`; depois de publicar, troque para a URL real).
- **Redirect URLs**: adicione tanto `http://localhost:3000/auth/callback`
  quanto `https://SEU-DOMINIO/auth/callback` (a URL final, depois do
  deploy).

## 5. Variáveis de ambiente

1. Copie `.env.local.example` para `.env.local`.
2. No painel do Supabase: **Project Settings** → **API**.
3. Preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` = **Project URL**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = **anon public** key

Essas duas são as únicas obrigatórias — a `SUPABASE_SERVICE_ROLE_KEY` pode
ficar em branco (só é necessária para operações administrativas que este
app não usa).

## 6. Rodar localmente

No terminal, dentro da pasta do projeto:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` — deve aparecer a tela de login.

## 7. Publicar (deploy)

A forma mais simples para um app Next.js é a **Vercel** (mesma empresa
que mantém o Next.js, tem plano gratuito, zero configuração):

1. Suba este projeto para um repositório no GitHub (mesmo processo que já
   usamos no outro projeto — `git init`, `git add .`, `git commit`,
   `git push`).
2. Entre em [vercel.com](https://vercel.com), **Add New** → **Project** →
   selecione o repositório.
3. Em **Environment Variables**, adicione as mesmas 2 variáveis do passo
   5 (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Clique em **Deploy**.
5. Depois que a URL final existir (ex: `https://devocional-diario.vercel.app`),
   volte no passo 4 (Supabase → URL Configuration) e atualize a **Site
   URL** e adicione essa URL + `/auth/callback` nas **Redirect URLs**.
6. Volte no Google Cloud Console (passo 3) e adicione também
   `https://SEU-PROJETO.supabase.co/auth/v1/callback` já deve estar lá —
   não precisa mudar nada ali, o redirect do Google sempre aponta pro
   Supabase, nunca direto pro seu domínio.

Alternativa: como você já tem conta no **Render**, também dá para
publicar lá como um "Web Service" Node (`build command: npm install &&
npm run build`, `start command: npm start`) — só que a Vercel é mais
direta para Next.js especificamente porque foi feita pela mesma equipe.
Se preferir manter tudo no Render por conveniência, é só pedir que eu
monte o `render.yaml` equivalente.

## Sobre a ofensiva (streak)

Cada vez que alguém completa os 3 passos do devocional (ler → refletir →
orar) e clica em "Concluir devocional", o app chama a função
`registrar_devocional_hoje` no banco, que:

- Salva o registro do dia (tema de oração + reflexão escrita).
- Incrementa a ofensiva se o último devocional foi ontem, mantém se já foi
  hoje, ou reinicia em 1 se houve uma falha.
- Atualiza a maior ofensiva já alcançada.

O cálculo mora inteiramente no banco (não no frontend) para que não dê
para "trapacear" a sequência manipulando o app no navegador.
