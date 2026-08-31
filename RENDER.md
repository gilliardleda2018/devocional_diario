# Publicar no Render

Este projeto já tem um `render.yaml` (Blueprint) pronto — o mesmo padrão
usado no `fitness_projeto`. Passos:

## 1. Subir o código pro GitHub

Dentro da pasta `devocional_biblico` (a que já está em
`C:\fitness_projeto\devocional_biblico` no seu computador):

```bash
git init
git add .
git commit -m "Devocional Diário: app inicial"
```

Crie um repositório novo no GitHub (pode ser privado) e depois:

```bash
git remote add origin https://github.com/SEU-USUARIO/devocional-biblico.git
git branch -M main
git push -u origin main
```

## 2. Criar o Blueprint no Render

1. Entre em [render.com](https://dashboard.render.com) (mesma conta que
   você já usa).
2. **New** → **Blueprint**.
3. Selecione o repositório que você acabou de criar.
4. O Render vai ler o `render.yaml` e mostrar 1 serviço:
   `devocional-biblico` (Web Service, Node, plano Free).
5. Antes de confirmar, ele vai pedir os valores de
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — pegue
   esses dois valores no painel do Supabase (**Project Settings** → **API**,
   como no `SETUP.md`) e cole ali.
6. Clique em **Apply** / **Deploy**.

O primeiro build demora alguns minutos (`npm install && npm run build`).
Quando terminar, o Render te dá uma URL tipo
`https://devocional-biblico.onrender.com` (ou com um sufixo, se esse nome
já estiver em uso por outra conta — mesma coisa que aconteceu com a API do
projeto de fitness).

## 3. Atualizar as URLs no Supabase

Depois que a URL final existir:

1. Painel do Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: coloque a URL do Render (ex:
   `https://devocional-biblico.onrender.com`).
3. **Redirect URLs**: adicione
   `https://devocional-biblico.onrender.com/auth/callback` (mantenha
   também a de `localhost` se ainda for testar local).

Não precisa mexer no Google Cloud Console de novo — o redirect do Google
sempre aponta pro Supabase (`https://SEU-PROJETO.supabase.co/auth/v1/callback`),
nunca direto pro domínio do Render.

## Sobre o plano gratuito

Assim como a API do projeto de fitness, o plano Free do Render "dorme"
depois de ~15 minutos sem uso — a primeira requisição depois disso demora
uns 30-60 segundos pra acordar o serviço. Normal, não é erro.

## Se preferir Vercel no futuro

Como é um app Next.js "padrão", também funciona sem nenhuma mudança na
Vercel (é literalmente a plataforma feita pela mesma equipe do Next.js) —
o guia original está no `SETUP.md`, passo 7, caso queira comparar depois.
