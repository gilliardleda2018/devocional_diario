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

Este projeto é publicado na **AWS (Amplify Hosting)**, conectado ao
GitHub — todo `git push origin main` gera build e deploy automáticos.
Veja o passo a passo completo em [AWS_DEPLOY.md](./AWS_DEPLOY.md).

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
