#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${GITHUB_WORKSPACE:-$PWD}"
OUT="$ROOT/evidencias/zap"
mkdir -p "$OUT"
BACK_PID=''
FRONT_PID=''
cleanup() {
  if [[ -n "$FRONT_PID" ]]; then kill "$FRONT_PID" 2>/dev/null || true; fi
  if [[ -n "$BACK_PID" ]]; then kill "$BACK_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

# Base de datos temporal del job GitHub Actions (no se cargan datos reales).
export MONGO_URI='mongodb://127.0.0.1:27028/La_Tarima_CI'
export PORT=3300
export NODE_ENV=test
export CORS_ORIGIN='http://127.0.0.1:4173'
export JWT_SECRET="$(openssl rand -hex 32)"

node "$ROOT/la-tarima-back/index.js" > "$OUT/backend.log" 2>&1 &
BACK_PID=$!

# El frontend compilado apunta a la API temporal, no a produccion.
export VITE_API_BASE_URL='http://127.0.0.1:3300/api'
npm run build --prefix "$ROOT/la-tarima-front" > "$OUT/build-frontend.log" 2>&1
(
  cd "$ROOT/la-tarima-front"
  npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
) > "$OUT/frontend.log" 2>&1 &
FRONT_PID=$!

READY=0
for attempt in $(seq 1 45); do
  if curl --fail --silent 'http://127.0.0.1:4173/' >/dev/null; then
    READY=1
    break
  fi
  if ! kill -0 "$BACK_PID" 2>/dev/null || ! kill -0 "$FRONT_PID" 2>/dev/null; then
    echo 'Fallo el backend o frontend; revisar los logs de evidencias/zap.' >&2
    exit 1
  fi
  sleep 2
done
if [[ "$READY" != 1 ]]; then
  echo 'El frontend no estuvo listo a tiempo.' >&2
  exit 1
fi

# Un 404 del backend es normal para una ruta inexistente; se comprueba que responde.
BACK_CODE="$(curl --silent --output /dev/null --write-out '%{http_code}' \
  'http://127.0.0.1:3300/api/ruta-inexistente' || true)"
echo "HTTP backend ruta de prueba: $BACK_CODE"
if [[ "$BACK_CODE" == '000' ]]; then
  echo 'El backend no responde.' >&2
  exit 1
fi

printf 'commit=%s\nrun_id=%s\nscan_type=ZAP Baseline pasivo\ntarget=http://127.0.0.1:4173\n' \
  "${GITHUB_SHA:-local}" "${GITHUB_RUN_ID:-manual}" > "$OUT/metadata.txt"

# -I no falla el job por alertas WARN; las alertas siguen en los reportes.
# Los hallazgos FAIL y errores operativos mantienen un codigo de salida no cero.
docker run --rm --network host \
  --user 0:0 \
  -v "$OUT:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t 'http://127.0.0.1:4173' \
  -m 2 -I \
  -r zap-report.html \
  -J zap-report.json \
  -w zap-report.md
