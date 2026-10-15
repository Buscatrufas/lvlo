# Lvlo: kit de lanzamiento

Todo lo necesario para publicar Lvlo en tu propio servidor y después en Google Play.
La guía paso a paso está en el documento «Lvlo: guía de lanzamiento web y Android».

## Dominios

| Dirección | Uso | Carpeta / servicio |
| --- | --- | --- |
| lvlo.app | Landing pública con lista de espera | `landing/` |
| app.lvlo.app | La app web (PWA) | `web/` |
| api.lvlo.app | PocketBase: API y panel de administración (`/_/`) | contenedor `pocketbase` |
| stats.lvlo.app | Umami (analítica sin cookies) | contenedor `umami` |
| getlvlo.com y www.getlvlo.com | Redirección 301 a lvlo.app | Caddy |

Las páginas legales (`/privacidad.html`, `/aviso-legal.html`, `/borrar-cuenta.html`) se sirven en lvlo.app y en app.lvlo.app.

## Estructura

```
lvlo/
├── landing/                 lvlo.app: presentación y lista de espera (4 idiomas)
├── web/                     app.lvlo.app: la app (PWA)
│   ├── config.js            ← lo único que tocas en cada versión (VERSION, analítica, novedades)
│   ├── index.html, styles.css, i18n.js, app.js, sw.js, manifest.webmanifest
│   ├── privacidad.html, aviso-legal.html, borrar-cuenta.html   ← rellena los [CORCHETES] que quedan
│   ├── .well-known/assetlinks.json                             ← vínculo con la app Android (app.lvlo)
│   └── icons/, fonts/, vendor/
├── server/
│   ├── docker-compose.yml   Caddy (HTTPS) + PocketBase + Umami
│   ├── Caddyfile            Los 6 dominios, HTTPS, redirecciones y cabeceras de seguridad
│   ├── .env.example         Dominios, correo y secretos
│   ├── pocketbase/Dockerfile
│   ├── pb_migrations/       Tablas: partidas, comentarios y lista de espera
│   └── scripts/deploy.sh    Publica landing y app desde tu ordenador
└── android/README.md        Generar la app de Play con Bubblewrap
```

## Arranque rápido (en el servidor)
```bash
git clone <tu-repo-privado> /opt/lvlo
cd /opt/lvlo/server
cp .env.example .env && nano .env        # revisa dominios y genera los secretos
docker compose up -d --build
docker compose exec pocketbase /pb/pocketbase superuser upsert hola@lvlo.app 'UnaContraseñaLarga' --dir=/pb/pb_data
```
Abre https://lvlo.app, https://app.lvlo.app y https://api.lvlo.app/_/

## Probar en local sin servidor
Con `API_URL: ""` en `web/config.js` la app funciona solo en el navegador:
```bash
cd web && python3 -m http.server 8080   # y abre http://localhost:8080
```
