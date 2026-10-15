# App Android (TWA con Bubblewrap)

La app Android es tu web dentro de una Trusted Web Activity. No hay que tocar código Android:
cada despliegue de la web llega también a los usuarios de Android.

## Requisitos (en tu ordenador, no en el servidor)
- Node.js 20 o superior
- Bubblewrap: `npm i -g @bubblewrap/cli` (la primera vez descarga el JDK y el SDK de Android)

## 1. Generar el proyecto
```bash
mkdir lvlo-android && cd lvlo-android
bubblewrap init --manifest https://app.lvlo.app/manifest.webmanifest
```
Respuestas recomendadas:
- Domain: `app.lvlo.app` · Application name y Short name: `Lvlo`
- Application ID (package): `app.lvlo` (no se puede cambiar después de publicar)
- Display mode: `standalone` · Orientation: `portrait`
- Status bar / navigation colour: `#10141C`
- Signing key: crea una nueva (`android.keystore`). **Guarda el archivo y las contraseñas en un gestor de contraseñas**: sin ellos no podrás publicar actualizaciones.

## 2. Compilar
```bash
bubblewrap build
```
Genera `app-release-bundle.aab` (para Play) y `app-release-signed.apk` (para probar en tu móvil).
Bubblewrap 1.27 ya apunta a Android 16 (API 36), que es lo que exige Google Play desde el 31 de agosto de 2026.

## 3. Vincular la web con la app (Digital Asset Links)
Sin este paso la app muestra una barra de navegador arriba.
1. En Play Console → tu app → Configuración → Integridad de la app → Firma de apps, copia la **huella SHA-256 de la clave de firma de la app** (la de Google, no la de subida).
2. Pégala en `web/.well-known/assetlinks.json` junto con tu package name. Puedes añadir también la huella de tu clave de subida:
   `bubblewrap fingerprint add <SHA256>` y luego `bubblewrap fingerprint generateAssetLinks`.
3. Despliega la web y comprueba que responde: `https://app.lvlo.app/.well-known/assetlinks.json`.
4. Verifícalo con la herramienta de Google: https://developers.google.com/digital-asset-links/tools/generator

## 4. Nuevas versiones de la app Android
Solo hace falta cuando cambias el icono, el nombre, los colores o el package. Para todo lo demás basta con desplegar la web.
```bash
bubblewrap update   # sube appVersionCode
bubblewrap build
```
