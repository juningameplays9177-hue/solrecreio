# Android APK

Este projeto agora tem um wrapper Android via Capacitor que abre o site publicado:

- URL: `https://skyblue-lark-202006.hostingersite.com`
- Nome do app: `Sol do Recreio`
- App ID: `com.soldorecreio.app`

## Como abrir o projeto Android

No terminal do projeto:

```bash
npm run android:open
```

Isso abre a pasta `android/` no Android Studio.

## Como gerar o APK

No Android Studio:

1. Espere o Gradle sincronizar.
2. Abra `Build`.
3. Clique em `Build Bundle(s) / APK(s)`.
4. Clique em `Build APK(s)`.

O Android Studio vai gerar o arquivo `.apk`.

## Como instalar no celular

1. Transfira o arquivo `.apk` para o Android.
2. Abra o arquivo no celular.
3. Permita instalar de fontes confiáveis, se o Android pedir.
4. Conclua a instalação.

## Quando o site mudar

Como o app abre a URL publicada, você não precisa gerar um novo APK para cada mudança visual do site.

Só precisa gerar um novo APK se quiser mudar:

- nome do app
- ícone nativo
- permissões Android
- comportamento do wrapper nativo
