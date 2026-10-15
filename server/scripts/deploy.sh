#!/usr/bin/env bash
# Publica la web en el servidor. Uso:  ./server/scripts/deploy.sh usuario@ip-del-servidor
# Antes de ejecutarlo: sube VERSION en web/config.js y añade la entrada en CHANGELOG.
set -euo pipefail

DEST="${1:?Uso: deploy.sh usuario@servidor}"
REMOTE_DIR="${REMOTE_DIR:-/opt/lvlo}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

VERSION=$(grep -oE 'VERSION: *"[^"]+"' "$ROOT/web/config.js" | grep -oE '[0-9][^"]*')
echo "Publicando la versión $VERSION en $DEST:$REMOTE_DIR"

# Comprobación básica de sintaxis antes de subir nada
for f in web/config.js web/i18n.js web/app.js web/sw.js web/borrar-cuenta.js landing/landing.js; do
  node --check "$ROOT/$f"
done

rsync -az --delete --exclude ".DS_Store" "$ROOT/web/" "$DEST:$REMOTE_DIR/web/"
rsync -az --delete --exclude ".DS_Store" "$ROOT/landing/" "$DEST:$REMOTE_DIR/landing/"
rsync -az "$ROOT/server/pb_migrations/" "$DEST:$REMOTE_DIR/server/pb_migrations/"

# Si has añadido migraciones, reinicia PocketBase para aplicarlas
ssh "$DEST" "cd $REMOTE_DIR/server && docker compose restart pocketbase >/dev/null && docker compose ps --format '{{.Name}}: {{.Status}}'"

echo "Listo. Los usuarios verán la versión $VERSION la próxima vez que abran la app."
