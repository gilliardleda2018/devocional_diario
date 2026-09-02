# Como gerar o app Android (Devocional Diário)

## Por que eu não consegui gerar o APK sozinho

Tentei montar o projeto Android aqui no meu ambiente, mas dei de cara com duas limitações:

1. O ambiente de nuvem que eu uso pra rodar comandos não tem acesso à internet liberado para os servidores do Google/Android (SDK, Gradle) nem para o registro do npm — política de rede da organização.
2. A ponte com o seu computador (que eu uso pra rodar comandos direto na sua máquina) está fora do ar no momento.

Então preparei tudo que dá pra preparar sem essas duas coisas — a configuração do projeto e o ícone — e deixei abaixo o passo a passo pra você (ou eu, quando a ponte voltar) terminar rapidinho no seu computador.

## O que este pacote contém

- `capacitor.config.json` — configuração pronta do app (nome, id do pacote, e aponta para o site já publicado: `https://main.d357ab4gel6chc.amplifyapp.com`)
- `icone-app-1024.png` — ícone placeholder (pomba, no mesmo estilo visual da tela de login). Troque por um ícone definitivo quando tiver um.
- `public/index.html` — arquivo vazio exigido pela estrutura do Capacitor (não é usado de fato, porque o app carrega o site ao vivo)

**Importante sobre a abordagem escolhida (Capacitor carregando a URL ao vivo):** como o Devocional Diário usa recursos de servidor (login por magic link, callback de autenticação, Supabase), ele não pode ser "exportado" como arquivos estáticos dentro do APK. Por isso o app Android vai funcionar como uma casca nativa que abre o site publicado — visualmente idêntico ao app web, em tela cheia, sem barra de navegador, com ícone e nome próprios. Ele **precisa de internet** pra funcionar, exatamente como o site hoje. Isso também abre caminho pra adicionar recursos nativos de verdade (notificações push, etc.) depois, se quiser.

## Passo a passo

### 1. Pré-requisitos
- **Android Studio** instalado: https://developer.android.com/studio (gratuito; já vem com o SDK e o Gradle, então resolve o problema de rede que eu tive)
- **Node.js** (você já tem, usa no projeto Next.js)

### 2. Copiar os arquivos deste pacote
Copie `capacitor.config.json`, `icone-app-1024.png` e a pasta `public/` para dentro da pasta do projeto:
```
C:\fitness_projeto\devocional_biblico\
```

### 3. Instalar o Capacitor e criar o projeto Android
No PowerShell, dentro de `C:\fitness_projeto\devocional_biblico`:
```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
```

### 4. Definir o ícone do app
Abra o projeto no Android Studio:
```powershell
npx cap open android
```
Dentro do Android Studio: clique com o botão direito na pasta `app/res` → **New → Image Asset** → escolha `icone-app-1024.png` como "Foreground Layer" → siga o assistente. Ele gera automaticamente todos os tamanhos (mipmap) necessários.

### 5. Gerar a chave de assinatura (keystore)
**Isso é o passo mais importante de todos.** No Android Studio: **Build → Generate Signed Bundle / APK**.
- Escolha **Android App Bundle (AAB)** — é o formato que a Play Store exige hoje para publicar apps novos (o APK tradicional serve pra testar no seu celular, mas não é aceito para publicação de apps novos na loja).
- Clique em **Create new...** para criar uma keystore nova. Preencha os campos (senha da keystore, senha da chave, validade — sugiro 25+ anos, dados da organização).
- **Salve o arquivo `.jks` (ou `.keystore`) e as duas senhas em um lugar seguro e com backup** (ex: gerenciador de senhas + um segundo local). Se você perder essa chave, **nunca mais** vai conseguir publicar uma atualização deste mesmo app na Play Store — teria que criar um app novo do zero.

### 6. Publicar
- Build → Generate Signed Bundle / APK novamente, agora selecionando a keystore que você já criou, gera o `.aab`.
- No Google Play Console (você já tem a conta): crie o app, preencha a ficha da loja (descrição, capturas de tela, política de privacidade — obrigatória, principalmente por causa do login), e faça o upload do `.aab` em **Produção** (ou primeiro em **Teste interno**, recomendado).

### 7. Testar antes de publicar (opcional mas recomendado)
Para gerar um **APK de debug** só pra instalar no seu celular e testar (não serve pra Play Store, mas é rápido):
```powershell
cd android
./gradlew assembleDebug
```
O arquivo fica em `android/app/build/outputs/apk/debug/app-debug.apk` — copie pro celular e instale.

---

Qualquer erro que aparecer em algum desses passos, me manda a mensagem completa que eu ajudo a resolver. E se a ponte com o seu computador voltar antes de você mexer nisso, eu mesmo rodo os comandos dos passos 2 e 3 pra você.
